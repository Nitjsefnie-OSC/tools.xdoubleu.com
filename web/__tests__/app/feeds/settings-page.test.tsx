import React from 'react'
import { render, screen } from '@testing-library/react'

vi.mock('@/components/feeds/FeedsNotificationSettingsCard', () => () => (
  <div data-testid="feeds-notification-settings-card" />
))

vi.mock('@/components/feeds/FeedFilterRulesCard', () => () => (
  <div data-testid="feed-filter-rules-card" />
))

vi.mock('@/lib/server/client', () => ({
  createServerClient: vi.fn(async () => ({
    getNotificationSettings: vi.fn(async () => ({ settings: [] })),
    listFeeds: vi.fn(async () => ({ feeds: [] })),
    listFilterRules: vi.fn(async () => ({ rules: [] }))
  }))
}))

vi.mock('@/lib/server/fetchers', () => ({
  fetchOrNull: vi.fn(async () => null)
}))

const mockFallback = vi.fn()
vi.mock('@/components/SWRFallback', () => ({
  __esModule: true,
  default: ({
    fallback,
    children
  }: {
    fallback: Record<string, unknown>
    children: React.ReactNode
  }) => {
    mockFallback(fallback)
    return <>{children}</>
  }
}))

import FeedsSettingsPage from '@/app/feeds/settings/page'
import { fetchOrNull } from '@/lib/server/fetchers'
import { swrKeys } from '@/lib/swrKeys'

describe('FeedsSettingsPage', () => {
  it('renders the feeds notification settings card', async () => {
    render(await FeedsSettingsPage())
    expect(screen.getByTestId('feeds-notification-settings-card')).toBeInTheDocument()
  })

  it('prefetches notification settings, feeds and filter rules into the SWR fallback', async () => {
    vi.mocked(fetchOrNull).mockImplementation(async (fn) => fn())
    render(await FeedsSettingsPage())
    expect(mockFallback).toHaveBeenCalledWith({
      [swrKeys.monitoringNotificationSettings]: { settings: [] },
      [swrKeys.feeds]: { feeds: [] },
      [swrKeys.feedFilterRules]: { rules: [] }
    })
  })

  it('leaves the fallback empty when prefetches fail', async () => {
    vi.mocked(fetchOrNull).mockResolvedValue(null)
    render(await FeedsSettingsPage())
    expect(mockFallback).toHaveBeenCalledWith({})
  })

  it('renders the filter rules card', async () => {
    render(await FeedsSettingsPage())
    expect(screen.getByTestId('feed-filter-rules-card')).toBeInTheDocument()
  })

  it('shows a breadcrumb back to /feeds', async () => {
    render(await FeedsSettingsPage())
    expect(screen.getByRole('link', { name: 'Feeds' })).toHaveAttribute('href', '/feeds')
    expect(screen.getByText('Settings')).toHaveAttribute('aria-current', 'page')
  })
})
