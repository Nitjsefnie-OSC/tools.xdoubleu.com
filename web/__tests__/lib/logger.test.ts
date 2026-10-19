const mockFetch = vi.fn()
// The logger keeps its queue and timer at module level, so each test loads a fresh one.
let logger: typeof import('@/lib/logger').logger

describe('logger', () => {
  beforeEach(async () => {
    vi.resetModules()
    ;({ logger } = await import('@/lib/logger'))
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

  it('batches entries into one debounced POST with their level and message', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    logger.info('hello', { foo: 'bar' })
    logger.info('again')
    expect(mockFetch).not.toHaveBeenCalled()

    vi.advanceTimersByTime(2000)
    await Promise.resolve()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const init = mockFetch.mock.calls[0][1] as RequestInit
    const body = JSON.parse(String(init.body)) as { entries: Record<string, unknown>[] }
    expect(body.entries).toHaveLength(2)
    expect(body.entries[0]).toMatchObject({
      level: 'info',
      message: 'hello',
      attrs: { foo: 'bar' }
    })
    infoSpy.mockRestore()
  })

  it.each(['debug', 'warn', 'error'] as const)(
    'logs %s to the matching console method',
    (level) => {
      const spy = vi.spyOn(console, level).mockImplementation(() => {})

      logger[level]('msg', { a: 1 })
      logger[level]('plain')

      expect(spy).toHaveBeenCalledWith('msg', { a: 1 })
      expect(spy).toHaveBeenCalledWith('plain')
      spy.mockRestore()
    }
  )

  it('swallows a failed upload', async () => {
    mockFetch.mockRejectedValue(new Error('network down'))
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    logger.warn('uh oh')
    vi.advanceTimersByTime(2000)
    await Promise.resolve()
    await Promise.resolve()

    expect(mockFetch).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('flushes immediately once the batch reaches its max size', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})

    for (let i = 0; i < 25; i++) logger.debug(`entry ${i}`)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    debugSpy.mockRestore()
  })
})
