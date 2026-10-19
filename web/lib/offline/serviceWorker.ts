// The service worker, emitted as sw.js at build time by vite.config.ts as
// `(${serviceWorker})(self, enabled, precache)`. It must stay self-contained:
// no imports or outer references survive the toString(). The api swaps the
// `enabled` token per request (OFFLINE_DISABLED kill switch).

interface SwEvent {
  waitUntil(promise: Promise<unknown>): void
}

export interface SwFetchEvent extends SwEvent {
  request: Request
  respondWith(response: Promise<Response>): void
}

export interface SwMessageEvent extends SwEvent {
  data: unknown
}

interface SwCache {
  match(request: RequestInfo | URL): Promise<Response | undefined>
  put(request: RequestInfo | URL, response: Response): Promise<void>
  keys(): Promise<readonly Request[]>
  delete(request: RequestInfo | URL): Promise<boolean>
}

export interface SwScope {
  location: { origin: string }
  caches: {
    open(name: string): Promise<SwCache>
    keys(): Promise<string[]>
    delete(name: string): Promise<boolean>
  }
  registration: { unregister(): Promise<boolean> }
  clients: { claim(): Promise<void> }
  skipWaiting(): Promise<void>
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>
  addEventListener(type: 'install' | 'activate', listener: (event: SwEvent) => void): void
  addEventListener(type: 'fetch', listener: (event: SwFetchEvent) => void): void
  addEventListener(type: 'message', listener: (event: SwMessageEvent) => void): void
}

/**
 * The app is one HTML shell plus content-hashed assets, so the worker
 * precaches both (`precache` lists the build's files) and serves the shell for
 * any navigation it can't reach the network for; page data comes from the
 * IndexedDB SWR cache. With `enabled` false it deletes its caches and
 * unregisters itself (the kill switch).
 */
export function serviceWorker(sw: SwScope, enabled: boolean, precache: string[]): void {
  const PREFIX = 'tools-'
  const APP = 'tools-app'
  const SHELL = '/'
  const ENV = '/env.js'
  // Paths the api serves itself; a navigation to them is never the SPA shell.
  const SERVER_ONLY = [
    '/api/',
    '/.well-known/',
    '/downloads/',
    '/logs',
    '/web-vitals',
    '/release',
    '/health',
    '/sw.js'
  ]

  const deleteCaches = async (keep: string[]) => {
    const names = await sw.caches.keys()
    await Promise.all(
      names.filter((n) => n.startsWith(PREFIX) && !keep.includes(n)).map((n) => sw.caches.delete(n))
    )
  }

  if (!enabled) {
    sw.addEventListener('install', (event) => event.waitUntil(sw.skipWaiting()))
    sw.addEventListener('activate', (event) =>
      event.waitUntil(deleteCaches([]).then(() => sw.registration.unregister()))
    )
    return
  }

  const files = [SHELL, ...precache.map((name) => `/${name}`)]

  sw.addEventListener('install', (event) =>
    event.waitUntil(
      // One failed file only costs its offline copy, so it doesn't fail the install.
      sw.caches
        .open(APP)
        .then((cache) =>
          Promise.allSettled(
            files.map(async (file) => {
              const res = await sw.fetch(file)
              if (res.status === 200) await cache.put(file, res)
            })
          )
        )
        .then(() => sw.skipWaiting())
    )
  )

  // Drops hashed files a newer build no longer lists.
  const pruneAssets = async () => {
    const cache = await sw.caches.open(APP)
    const live = new Set(files.map((f) => new URL(f, sw.location.origin).href))
    const stale = (await cache.keys()).filter((r) => r.url.includes('/assets/') && !live.has(r.url))
    await Promise.all(stale.map((r) => cache.delete(r)))
  }

  sw.addEventListener('activate', (event) =>
    event.waitUntil(
      deleteCaches([APP])
        .then(pruneAssets)
        .then(() => sw.clients.claim())
    )
  )

  const offlinePage = () =>
    new Response(
      '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
        '<meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<title>Offline</title><style>:root{color-scheme:light dark}' +
        'body{font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem}' +
        'a{display:inline-block;min-height:44px;line-height:44px;padding:0 .5rem}</style>' +
        '</head><body><h1>You&#39;re offline</h1>' +
        '<p>The app hasn&#39;t been saved for offline use yet. Open it once while online.</p>' +
        '<p><a href="">Try again</a></p></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )

  const isHtml = (res: Response) =>
    res.status === 200 &&
    !res.redirected &&
    (res.headers.get('Content-Type') ?? '').startsWith('text/html')

  // Every path serves the same shell, so one saved copy answers them all.
  const shell = async (event: SwFetchEvent) => {
    try {
      const res = await sw.fetch(event.request)
      if (isHtml(res)) {
        const copy = res.clone()
        event.waitUntil(sw.caches.open(APP).then((cache) => cache.put(SHELL, copy)))
      }
      return res
    } catch {
      const cached = await (await sw.caches.open(APP)).match(SHELL)
      return cached ?? offlinePage()
    }
  }

  const networkFirst = async (request: Request, key: string) => {
    const cache = await sw.caches.open(APP)
    try {
      const res = await sw.fetch(request)
      if (res.status === 200) await cache.put(key, res.clone())
      return res
    } catch (err) {
      const cached = await cache.match(key)
      if (cached) return cached
      throw err
    }
  }

  const cacheFirst = async (request: Request) => {
    const cache = await sw.caches.open(APP)
    const hit = await cache.match(request)
    if (hit) return hit
    const res = await sw.fetch(request)
    if (res.status === 200) await cache.put(request, res.clone())
    return res
  }

  sw.addEventListener('fetch', (event) => {
    const { request } = event
    if (request.method !== 'GET') return
    const url = new URL(request.url)
    if (url.origin !== sw.location.origin) return
    if (url.pathname === ENV) {
      event.respondWith(networkFirst(request, ENV))
    } else if (url.pathname.startsWith('/assets/') || precache.includes(url.pathname.slice(1))) {
      event.respondWith(cacheFirst(request))
    } else if (
      request.mode === 'navigate' &&
      !SERVER_ONLY.some((p) => url.pathname.startsWith(p))
    ) {
      event.respondWith(shell(event))
    }
  })

  sw.addEventListener('message', (event) => {
    const data: unknown = event.data
    if (typeof data !== 'object' || data === null || !('type' in data)) return
    // Sign-out: drop everything but the app files (e.g. offline book copies).
    if (data.type === 'clear') event.waitUntil(deleteCaches([APP]))
  })
}

export function serviceWorkerScript(enabled: boolean | string, precache: string[]): string {
  return `(${serviceWorker.toString()})(self, ${String(enabled)}, ${JSON.stringify(precache)});\n`
}
