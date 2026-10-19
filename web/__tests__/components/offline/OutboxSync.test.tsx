import { act, render } from '@testing-library/react'
import OutboxSync from '@/components/offline/OutboxSync'
import { flushOutbox, getOutboxSnapshot } from '@/lib/offline/outbox'

vi.mock('@/lib/offline/outbox', () => ({
  flushOutbox: vi.fn(async () => {}),
  getOutboxSnapshot: vi.fn(() => ({ pending: 0, failed: [], authBlocked: false }))
}))

describe('OutboxSync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('flushes on mount and when the browser comes back online', () => {
    const { unmount } = render(<OutboxSync />)
    expect(flushOutbox).toHaveBeenCalledTimes(1)

    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(flushOutbox).toHaveBeenCalledTimes(2)

    unmount()
    window.dispatchEvent(new Event('online'))
    expect(flushOutbox).toHaveBeenCalledTimes(2)
  })

  it('retries periodically only while writes are pending', () => {
    render(<OutboxSync />)

    act(() => vi.advanceTimersByTime(30_000))
    expect(flushOutbox).toHaveBeenCalledTimes(1)

    vi.mocked(getOutboxSnapshot).mockReturnValue({ pending: 2, failed: [], authBlocked: false })
    act(() => vi.advanceTimersByTime(30_000))
    expect(flushOutbox).toHaveBeenCalledTimes(2)
  })
})
