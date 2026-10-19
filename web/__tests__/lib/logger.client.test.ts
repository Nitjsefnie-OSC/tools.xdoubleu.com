import { logger } from '@/lib/logger'

const mockFetch = vi.fn()

describe('logger (client)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockFetch.mockReset()
    mockFetch.mockResolvedValue({ ok: true })
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    global.fetch = mockFetch as unknown as typeof fetch
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('posts to the local /logs route instead of the api directly', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

    logger.info('from the browser')
    vi.advanceTimersByTime(2000)
    await Promise.resolve()
    await Promise.resolve()

    expect(mockFetch).toHaveBeenCalledWith('/logs', expect.objectContaining({ method: 'POST' }))
    infoSpy.mockRestore()
  })
})
