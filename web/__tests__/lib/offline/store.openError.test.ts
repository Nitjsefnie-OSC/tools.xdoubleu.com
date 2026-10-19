import { listBookFileKeys, listBookFiles, loadEntry } from '@/lib/offline/store'

describe('offline store when IndexedDB fails to open', () => {
  it('resolves to undefined and retries the open next time', async () => {
    const open = vi.fn(() => {
      const req: { error: null; onerror?: () => void } = { error: null }
      setTimeout(() => req.onerror?.())
      return req
    })
    Object.defineProperty(globalThis, 'indexedDB', { value: { open }, configurable: true })

    expect(await loadEntry('k')).toBeUndefined()
    expect(await loadEntry('k')).toBeUndefined()
    expect(open).toHaveBeenCalledTimes(2)
    expect(await listBookFiles()).toEqual([])
    expect(await listBookFileKeys()).toEqual([])
  })
})
