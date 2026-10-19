export {}

const mockSentryInit = vi.fn()
const mockPostHogInit = vi.fn()

vi.mock('@sentry/react', () => ({
  init: mockSentryInit,
  captureRouterTransitionStart: vi.fn()
}))

vi.mock('posthog-js', () => ({
  __esModule: true,
  default: { init: mockPostHogInit }
}))

vi.mock('@/lib/env', () => ({
  getSentryDsn: vi.fn(() => 'https://example@sentry.io/123'),
  getRelease: vi.fn(() => 'v1.0.0'),
  getPostHogKey: vi.fn(),
  getPostHogHost: vi.fn(() => 'https://eu.i.posthog.com')
}))

describe('instrumentation-client', () => {
  beforeEach(() => {
    vi.resetModules()
    mockSentryInit.mockClear()
    mockPostHogInit.mockClear()
  })

  it('always initializes Sentry', () => {
    require('../instrumentation-client')

    expect(mockSentryInit).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: 'https://example@sentry.io/123', release: 'v1.0.0' })
    )
  })

  it('initializes PostHog when a key is configured', () => {
    vi.mocked(require('@/lib/env').getPostHogKey).mockReturnValue('phc_abc123')

    require('../instrumentation-client')

    expect(mockPostHogInit).toHaveBeenCalledWith('phc_abc123', {
      api_host: 'https://eu.i.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: 'history_change',
      capture_pageleave: true,
      autocapture: true,
      capture_dead_clicks: true,
      before_send: expect.any(Function)
    })
  })

  it('skips PostHog initialization when no key is configured', () => {
    vi.mocked(require('@/lib/env').getPostHogKey).mockReturnValue('')

    require('../instrumentation-client')

    expect(mockPostHogInit).not.toHaveBeenCalled()
  })
})
