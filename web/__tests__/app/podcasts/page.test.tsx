import React from 'react'
import { render, screen } from '@testing-library/react'

const fetchOrNull = vi.fn()
const swrFallback = vi.fn()
const serverClient = { listFavourites: vi.fn() }

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
  default: (props: { children: React.ReactNode; fallback?: unknown }) => {
    swrFallback(props)
    return <>{props.children}</>
  }
}))

vi.mock('@/components/podcasts/PodcastsClient', () => ({
  __esModule: true,
  default: () => <div data-testid="podcasts-client" />
}))

import PodcastsPage from '@/app/podcasts/page'

beforeEach(() => vi.clearAllMocks())

describe('PodcastsPage', () => {
  it('seeds the favourites key', async () => {
    const favourites = { favourites: [] }
    fetchOrNull.mockResolvedValueOnce(favourites)
    render(await PodcastsPage())
    expect(screen.getByTestId('podcasts-client')).toBeInTheDocument()
    expect(serverClient.listFavourites).toHaveBeenCalledWith({})
    expect(swrFallback).toHaveBeenCalledWith(
      expect.objectContaining({ fallback: { '/podcasts/favourites': favourites } })
    )
  })

  it('renders without seeding when the fetch fails', async () => {
    fetchOrNull.mockResolvedValue(null)
    render(await PodcastsPage())
    expect(swrFallback).toHaveBeenCalledWith(expect.objectContaining({ fallback: {} }))
  })
})
