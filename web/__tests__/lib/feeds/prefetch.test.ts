vi.mock('@/lib/offline/store', () => ({
  loadEntry: vi.fn(),
  saveEntry: vi.fn()
}))

import type { Client } from '@connectrpc/connect'
import type { FeedService } from '@/lib/gen/feeds/v1/feeds_pb'
import { loadEntry, saveEntry } from '@/lib/offline/store'

const listFeedItems = vi.fn()
const getFeedItem = vi.fn()
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- only the two RPCs the prefetch calls
const client = { listFeedItems, getFeedItem } as unknown as Client<typeof FeedService>

// A fresh module per test: the prefetch runs once per page load.
async function load(): Promise<typeof import('@/lib/feeds/prefetch')> {
  vi.resetModules()
  return import('@/lib/feeds/prefetch')
}

function setOnline(online: boolean) {
  Object.defineProperty(navigator, 'onLine', { value: online, configurable: true })
}

beforeEach(() => {
  vi.clearAllMocks()
  setOnline(true)
  listFeedItems.mockResolvedValue({
    items: [
      { id: 'saved', hasContent: true },
      { id: 'new', hasContent: true },
      { id: 'empty', hasContent: false }
    ]
  })
  vi
    .mocked(loadEntry)
    .mockImplementation(async (key) =>
      key === '/feeds/item/saved' ? { key, data: {}, savedAt: 1 } : undefined
    )
  getFeedItem.mockImplementation(async ({ itemId }: { itemId: string }) => ({
    item: { id: itemId }
  }))
})

describe('prefetchFeedBodies', () => {
  it('saves the bodies of unread items not saved yet, once per page load', async () => {
    const { prefetchFeedBodies } = await load()
    await prefetchFeedBodies(client)
    await prefetchFeedBodies(client)

    expect(listFeedItems).toHaveBeenCalledTimes(1)
    expect(listFeedItems).toHaveBeenCalledWith({ limit: 100, unreadOnly: true })
    expect(getFeedItem).toHaveBeenCalledTimes(1)
    expect(getFeedItem).toHaveBeenCalledWith({ itemId: 'new' })
    expect(saveEntry).toHaveBeenCalledWith('/feeds/item/new', { item: { id: 'new' } })
  })

  it('does nothing offline', async () => {
    setOnline(false)
    await (await load()).prefetchFeedBodies(client)
    expect(listFeedItems).not.toHaveBeenCalled()
  })

  it('retries on a later visit after a failure', async () => {
    const { prefetchFeedBodies } = await load()
    listFeedItems.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await prefetchFeedBodies(client)
    await prefetchFeedBodies(client)
    expect(listFeedItems).toHaveBeenCalledTimes(2)
    expect(saveEntry).toHaveBeenCalledTimes(1)
  })
})
