/** @vitest-environment node */
import {
  serviceWorker,
  serviceWorkerScript,
  type SwFetchEvent,
  type SwMessageEvent,
  type SwScope
} from '@/lib/offline/serviceWorker'

const ORIGIN = 'https://tools.test'

function keyOf(req: RequestInfo | URL): string {
  if (typeof req === 'string') return new URL(req, ORIGIN).href
  return req instanceof URL ? req.href : req.url
}

class FakeCache {
  entries = new Map<string, Response>()
  async match(req: RequestInfo | URL) {
    return this.entries.get(keyOf(req))?.clone()
  }
  async put(req: RequestInfo | URL, res: Response) {
    this.entries.delete(keyOf(req))
    this.entries.set(keyOf(req), res)
  }
  async keys() {
    return [...this.entries.keys()].map((k) => new Request(k))
  }
  async delete(req: RequestInfo | URL) {
    return this.entries.delete(keyOf(req))
  }
}

class FakeCacheStorage {
  stores = new Map<string, FakeCache>()
  async open(name: string) {
    let cache = this.stores.get(name)
    if (!cache) {
      cache = new FakeCache()
      this.stores.set(name, cache)
    }
    return cache
  }
  async keys() {
    return [...this.stores.keys()]
  }
  async delete(name: string) {
    return this.stores.delete(name)
  }
}

type Listener = (event: SwFetchEvent & SwMessageEvent) => void

const PRECACHE = ['assets/index-abc.js', 'assets/index-abc.css', 'icon.svg']

function setup(enabled = true) {
  const listeners = new Map<string, Listener>()
  const caches = new FakeCacheStorage()
  const fetch = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>()
  const scope: SwScope = {
    location: { origin: ORIGIN },
    caches,
    registration: { unregister: vi.fn(async () => true) },
    clients: { claim: vi.fn(async () => {}) },
    skipWaiting: vi.fn(async () => {}),
    fetch,
    addEventListener: (type: string, listener: Listener) => listeners.set(type, listener)
  }
  serviceWorker(scope, enabled, PRECACHE)

  async function dispatch(type: string, extra: { request?: Request; data?: unknown } = {}) {
    const waits: Promise<unknown>[] = []
    let response: Promise<Response> | undefined
    listeners.get(type)?.({
      request: extra.request ?? new Request(ORIGIN),
      data: extra.data,
      waitUntil: (p) => waits.push(p),
      respondWith: (r) => {
        response = r
      }
    })
    const res = await response
    // waitUntil may be called while the response settles.
    while (waits.length) await waits.shift()
    return res
  }

  return { listeners, caches, fetch, scope, dispatch }
}

function navigate(path: string) {
  const req = new Request(new URL(path, ORIGIN))
  Object.defineProperty(req, 'mode', { value: 'navigate' })
  return { request: req }
}

function html(body = 'page', init: ResponseInit = {}) {
  return new Response(body, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', Date: new Date().toUTCString() },
    ...init
  })
}

describe('serviceWorker', () => {
  it('precaches the shell and the build files on install', async () => {
    const { caches, fetch, scope, dispatch } = setup()
    fetch.mockImplementation(async (req) =>
      keyOf(req) === `${ORIGIN}/` ? html('shell') : new Response('file')
    )

    await dispatch('install')

    expect(scope.skipWaiting).toHaveBeenCalled()
    const files = [...(caches.stores.get('tools-app')?.entries.keys() ?? [])].sort()
    expect(files).toEqual(
      [
        `${ORIGIN}/`,
        `${ORIGIN}/assets/index-abc.css`,
        `${ORIGIN}/assets/index-abc.js`,
        `${ORIGIN}/icon.svg`
      ].sort()
    )
  })

  it('installs even when a file cannot be fetched', async () => {
    const { fetch, scope, dispatch } = setup()
    fetch.mockRejectedValue(new TypeError('Failed to fetch'))

    await dispatch('install')

    expect(scope.skipWaiting).toHaveBeenCalled()
  })

  it('does not cache a failed file on install', async () => {
    const { caches, fetch, dispatch } = setup()
    fetch.mockResolvedValue(new Response('', { status: 404 }))

    await dispatch('install')

    expect(caches.stores.get('tools-app')?.entries.size).toBe(0)
  })

  it('claims clients, drops stale caches and prunes assets a new build dropped', async () => {
    const { caches, scope, dispatch } = setup()
    await caches.open('tools-pages')
    await caches.open('tools-old')
    await caches.open('other-app')
    const app = await caches.open('tools-app')
    await app.put(`${ORIGIN}/assets/old-123.js`, new Response('old'))
    await app.put(`${ORIGIN}/assets/index-abc.js`, new Response('current'))
    await app.put(`${ORIGIN}/`, html('shell'))

    await dispatch('activate')

    expect(scope.clients.claim).toHaveBeenCalled()
    expect((await caches.keys()).sort()).toEqual(['other-app', 'tools-app'])
    expect([...app.entries.keys()].sort()).toEqual([`${ORIGIN}/`, `${ORIGIN}/assets/index-abc.js`])
  })

  it('serves the saved shell for any navigation when the network fails', async () => {
    const { caches, fetch, dispatch } = setup()
    fetch.mockResolvedValueOnce(html('fresh'))

    const online = await dispatch('fetch', navigate('/shoppinglist#top'))
    expect(await online?.text()).toBe('fresh')
    expect(caches.stores.get('tools-app')?.entries.has(`${ORIGIN}/`)).toBe(true)

    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const offline = await dispatch('fetch', navigate('/books/7/read'))
    expect(await offline?.text()).toBe('fresh')
  })

  it('serves an offline page when no shell was ever saved', async () => {
    const { fetch, dispatch } = setup()
    fetch.mockRejectedValue(new TypeError('Failed to fetch'))

    const res = await dispatch('fetch', navigate('/recipes/list'))

    expect(res?.status).toBe(503)
    expect(await res?.text()).toContain('You&#39;re offline')
  })

  it.each([
    ['a redirect', () => Object.defineProperty(html(), 'redirected', { value: true })],
    ['a server error', () => html('boom', { status: 500 })],
    [
      'a non-HTML response',
      () => new Response('{}', { headers: { 'Content-Type': 'application/json' } })
    ]
  ])('does not save %s as the shell', async (_, response) => {
    const { caches, fetch, dispatch } = setup()
    fetch.mockResolvedValueOnce(response())

    await dispatch('fetch', navigate('/feeds'))

    expect(caches.stores.get('tools-app')?.entries.size ?? 0).toBe(0)
  })

  it.each([
    ['an api route', navigate('/api/version')],
    ['an OAuth discovery document', navigate('/.well-known/openid-configuration')],
    ['a download', navigate('/downloads/kobo-gateway.zip')],
    ['a cross-origin request', { request: new Request('https://elsewhere.test/x') }],
    ['a POST', { request: new Request(`${ORIGIN}/api/x`, { method: 'POST' }) }],
    ['an uncached same-origin subresource', { request: new Request(`${ORIGIN}/other.png`) }]
  ])('leaves %s to the network', async (_, event) => {
    const { fetch, dispatch } = setup()

    expect(await dispatch('fetch', event)).toBeUndefined()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('serves hashed assets cache-first', async () => {
    const { fetch, dispatch } = setup()
    const asset = () => ({ request: new Request(`${ORIGIN}/assets/chunk-9.js`) })
    fetch.mockResolvedValueOnce(new Response('js'))

    expect(await (await dispatch('fetch', asset()))?.text()).toBe('js')
    expect(await (await dispatch('fetch', asset()))?.text()).toBe('js')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('serves other precached files cache-first', async () => {
    const { fetch, dispatch } = setup()
    fetch.mockResolvedValueOnce(new Response('<svg/>'))

    await dispatch('fetch', { request: new Request(`${ORIGIN}/icon.svg`) })
    await dispatch('fetch', { request: new Request(`${ORIGIN}/icon.svg`) })

    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('does not cache a failed asset', async () => {
    const { caches, fetch, dispatch } = setup()
    fetch.mockResolvedValueOnce(new Response('', { status: 404 }))

    await dispatch('fetch', { request: new Request(`${ORIGIN}/assets/chunk-b.js`) })

    expect(caches.stores.get('tools-app')?.entries.size).toBe(0)
  })

  it('serves env.js network-first and falls back to the saved copy offline', async () => {
    const { fetch, dispatch } = setup()
    const env = () => ({ request: new Request(`${ORIGIN}/env.js`) })
    fetch.mockResolvedValueOnce(new Response('window.__ENV__={}'))

    expect(await (await dispatch('fetch', env()))?.text()).toBe('window.__ENV__={}')

    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    expect(await (await dispatch('fetch', env()))?.text()).toBe('window.__ENV__={}')
  })

  it('lets env.js fail when it was never saved', async () => {
    const { fetch, dispatch } = setup()
    fetch.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(dispatch('fetch', { request: new Request(`${ORIGIN}/env.js`) })).rejects.toThrow(
      'Failed to fetch'
    )
  })

  it('ignores malformed messages', async () => {
    const { caches, dispatch } = setup()
    await caches.open('tools-webpub')

    await dispatch('message', { data: null })
    await dispatch('message', { data: 'clear' })
    await dispatch('message', { data: { type: 'other' } })

    expect(await caches.keys()).toEqual(['tools-webpub'])
  })

  it('clears everything but the app files on request', async () => {
    const { caches, dispatch } = setup()
    await caches.open('tools-app')
    await caches.open('tools-webpub')

    await dispatch('message', { data: { type: 'clear' } })

    expect(await caches.keys()).toEqual(['tools-app'])
  })

  it('unregisters and deletes its caches when disabled', async () => {
    const { caches, scope, listeners, dispatch } = setup(false)
    await caches.open('tools-app')
    await caches.open('tools-webpub')

    await dispatch('install')
    await dispatch('activate')

    expect(scope.skipWaiting).toHaveBeenCalled()
    expect(await caches.keys()).toEqual([])
    expect(scope.registration.unregister).toHaveBeenCalled()
    expect(listeners.has('fetch')).toBe(false)
  })
})

describe('serviceWorkerScript', () => {
  it('invokes the worker with the enabled flag and the precache list', () => {
    expect(serviceWorkerScript(true, ['a.js'])).toMatch(/\)\(self, true, \["a\.js"\]\);\n$/)
    expect(serviceWorkerScript(false, [])).toMatch(/\)\(self, false, \[\]\);\n$/)
  })

  it('leaves a placeholder token for the api to fill in', () => {
    expect(serviceWorkerScript('__OFFLINE_ENABLED__', [])).toContain(
      '(self, __OFFLINE_ENABLED__, [])'
    )
  })
})
