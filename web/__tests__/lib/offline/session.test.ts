import {
  claimOfflineData,
  clearOfflineData,
  registerServiceWorker
} from '@/lib/offline/session'
import { clearStore, getOwner, pruneEntries, setOwner } from '@/lib/offline/store'
import { logger } from '@/lib/logger'
import { resetOutbox } from '@/lib/offline/outbox'

vi.mock('@/lib/offline/store', () => ({
  clearStore: vi.fn(async () => {}),
  getOwner: vi.fn(),
  pruneEntries: vi.fn(async () => {}),
  setOwner: vi.fn(async () => {})
}))
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn() } }))
vi.mock('@/lib/offline/outbox', () => ({ resetOutbox: vi.fn() }))

const postMessage = vi.fn()
const register = vi.fn()

function installServiceWorker() {
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      register,
      controller: { postMessage },
      ready: Promise.resolve({ active: { postMessage } })
    },
    configurable: true
  })
}

describe('offline session', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    installServiceWorker()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('registers the worker only in production', async () => {
    registerServiceWorker()
    expect(register).not.toHaveBeenCalled()

    vi.stubEnv('PROD', true)
    register.mockRejectedValueOnce(new Error('denied'))
    registerServiceWorker()
    expect(register).toHaveBeenCalledWith('/sw.js')
    await Promise.resolve()
    expect(logger.warn).toHaveBeenCalledWith('service worker registration failed', {
      error: 'Error: denied'
    })
  })

  it('clears the store and the worker state', async () => {
    await clearOfflineData()

    expect(postMessage).toHaveBeenCalledWith({ type: 'clear' })
    expect(clearStore).toHaveBeenCalled()
    expect(resetOutbox).toHaveBeenCalled()
  })

  it('clears data saved for another user before claiming it', async () => {
    vi.mocked(getOwner).mockResolvedValue('someone-else')

    await claimOfflineData('me')

    expect(clearStore).toHaveBeenCalled()
    expect(setOwner).toHaveBeenCalledWith('me')
    expect(pruneEntries).toHaveBeenCalled()
  })

  it('keeps data already owned by the user', async () => {
    vi.mocked(getOwner).mockResolvedValue('me')

    await claimOfflineData('me')

    expect(clearStore).not.toHaveBeenCalled()
    expect(setOwner).not.toHaveBeenCalled()
  })

  it('claims unowned data without clearing it', async () => {
    vi.mocked(getOwner).mockResolvedValue(undefined)

    await claimOfflineData('me')

    expect(clearStore).not.toHaveBeenCalled()
    expect(setOwner).toHaveBeenCalledWith('me')
  })
})

describe('offline session without service worker support', () => {
  it('is a no-op', async () => {
    // @ts-expect-error -- simulate a browser without service workers
    delete navigator.serviceWorker

    registerServiceWorker()
    await clearOfflineData()

    expect(clearStore).toHaveBeenCalled()
  })
})
