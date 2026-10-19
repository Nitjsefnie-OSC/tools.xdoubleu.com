import React from 'react'
import { render, screen } from '@testing-library/react'

const fetchOrNull = vi.fn()
const swrFallback = vi.fn()
const serverClient = {
  getProfile: vi.fn(),
  listRecommendations: vi.fn(),
  getStats: vi.fn(),
  listEvents: vi.fn()
}

vi.mock('@/lib/server/client', () => ({
  createServerClient: vi.fn(async () => serverClient)
}))

// Runs the fetch so the request arguments are checked.
vi.mock('@/lib/server/fetchers', () => ({
  fetchOrNull: async (fn: () => Promise<unknown>) => {
    await fn()
    return fetchOrNull(fn)
  }
}))

vi.mock('@/components/SWRFallback', () => ({
  __esModule: true,
  default: (props: { children: React.ReactNode }) => {
    swrFallback(props)
    return <>{props.children}</>
  }
}))

vi.mock('@/components/taste/TasteClient', () => ({
  __esModule: true,
  default: () => <div data-testid="taste-client" />
}))

import TastePage from '@/app/taste/page'

beforeEach(() => vi.clearAllMocks())

describe('TastePage', () => {
  it('seeds the profile, the stats and the first log page', async () => {
    const profile = { configured: true }
    const picks = { recommendations: [] }
    const stats = { domains: [] }
    const events = { events: [] }
    fetchOrNull
      .mockResolvedValueOnce(profile)
      .mockResolvedValueOnce(picks)
      .mockResolvedValueOnce(stats)
      .mockResolvedValueOnce(events)
    render(await TastePage({ searchParams: Promise.resolve({}) }))
    expect(screen.getByTestId('taste-client')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Taste' })).toBeInTheDocument()
    expect(serverClient.getProfile).toHaveBeenCalledWith({})
    expect(serverClient.listRecommendations).toHaveBeenCalledWith({ domain: '', track: 'more' })
    expect(serverClient.getStats).toHaveBeenCalledWith({})
    expect(serverClient.listEvents).toHaveBeenCalledWith({ domain: '', limit: 50 })
    expect(swrFallback).toHaveBeenCalledWith(
      expect.objectContaining({
        fallback: { '/taste/profile': profile, '/taste/stats': stats },
        keyed: [
          [['/taste/recommendations', '', 'more'], picks],
          [['/taste/events', ''], events]
        ]
      })
    )
  })

  it('reads the shared taste for ?list=shared', async () => {
    fetchOrNull.mockResolvedValue(null)
    render(await TastePage({ searchParams: Promise.resolve({ list: 'shared' }) }))
    expect(serverClient.getProfile).toHaveBeenCalledWith({ shared: true })
    expect(serverClient.listEvents).toHaveBeenCalledWith({
      domain: '',
      limit: 50,
      shared: true
    })
  })

  it('renders without seeding when the fetches fail', async () => {
    fetchOrNull.mockResolvedValue(null)
    render(await TastePage({ searchParams: Promise.resolve({}) }))
    expect(swrFallback).toHaveBeenCalledWith(expect.objectContaining({ fallback: {}, keyed: [] }))
  })
})
