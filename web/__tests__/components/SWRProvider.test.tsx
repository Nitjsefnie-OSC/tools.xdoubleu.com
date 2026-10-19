import { render, renderHook, screen } from '@testing-library/react'
import posthog from 'posthog-js'
import useSWR from 'swr'
import { persistMiddleware } from '@/lib/offline/persist'
import SWRProvider, { useSessionEffects } from '@/components/SWRProvider'
import { claimOfflineData } from '@/lib/offline/session'

vi.mock('@/lib/offline/session', () => ({
  claimOfflineData: vi.fn(async () => {})
}))

vi.mock('@/lib/offline/persist', () => ({
  persistMiddleware: vi.fn((useSWRNext: unknown) => useSWRNext)
}))

vi.mock('posthog-js', () => ({
  default: { identify: vi.fn(), get_distinct_id: vi.fn(() => 'anon-id') }
}))

describe('SWRProvider', () => {
  it('saves responses for offline use', () => {
    function Probe() {
      const { data } = useSWR('/probe', () => 'live')
      return <span>{data ?? 'loading'}</span>
    }

    render(
      <SWRProvider>
        <Probe />
      </SWRProvider>
    )

    expect(screen.getByText('loading')).toBeInTheDocument()
    expect(persistMiddleware).toHaveBeenCalled()
  })
})

describe('useSessionEffects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(posthog.get_distinct_id).mockReturnValue('anon-id')
  })

  it('identifies the PostHog distinct_id and claims the offline data', () => {
    renderHook(() => useSessionEffects('user-123'))

    expect(posthog.identify).toHaveBeenCalledWith('user-123')
    expect(claimOfflineData).toHaveBeenCalledWith('user-123')
  })

  it('does not re-identify when already identified as the current user', () => {
    vi.mocked(posthog.get_distinct_id).mockReturnValue('user-123')

    renderHook(() => useSessionEffects('user-123'))

    expect(posthog.identify).not.toHaveBeenCalled()
  })

  it('re-identifies when the user id changes', () => {
    const { rerender } = renderHook(({ id }) => useSessionEffects(id), {
      initialProps: { id: 'user-a' }
    })
    expect(posthog.identify).toHaveBeenCalledWith('user-a')

    vi.mocked(posthog.get_distinct_id).mockReturnValue('user-a')
    rerender({ id: 'user-b' })
    expect(posthog.identify).toHaveBeenCalledWith('user-b')
  })

  it('does nothing without a current user', () => {
    renderHook(() => useSessionEffects(undefined))

    expect(posthog.identify).not.toHaveBeenCalled()
    expect(claimOfflineData).not.toHaveBeenCalled()
  })
})
