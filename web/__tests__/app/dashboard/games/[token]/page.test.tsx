import React from 'react'
import { render, screen } from '@testing-library/react'
import { create } from '@bufbuild/protobuf'
import { GetSharedSteamResponseSchema } from '@/lib/gen/dashboard/v1/games_pb'

vi.mock('@/components/dashboard/GamesDashboardPublicClient', () => () => (
  <div data-testid="profile-games" />
))

const mockFetchOrNull = vi.fn<Promise<unknown>, [unknown]>(async () => null)

vi.mock('@/lib/server/client', () => ({
  createServerClient: vi.fn(async () => ({}))
}))

vi.mock('@/lib/server/fetchers', () => ({
  fetchOrNull: (fn: () => unknown) => mockFetchOrNull(fn)
}))

vi.mock('@/components/SWRFallback', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

import ProfileGamesPage, { metadata } from '@/app/dashboard/games/[token]/page'

describe('ProfileGamesPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders a generic heading and client component when the link is invalid', async () => {
    mockFetchOrNull.mockResolvedValue(null)
    render(await ProfileGamesPage({ params: Promise.resolve({ token: 'tok-1' }) }))
    expect(screen.getByRole('heading', { name: 'Shared games' })).toBeInTheDocument()
    expect(screen.getByTestId('profile-games')).toBeInTheDocument()
  })

  it("renders the owner's display name in the heading", async () => {
    mockFetchOrNull.mockResolvedValue(create(GetSharedSteamResponseSchema, { displayName: 'Bob' }))
    render(await ProfileGamesPage({ params: Promise.resolve({ token: 'tok-1' }) }))
    expect(screen.getByRole('heading', { name: "Bob's games" })).toBeInTheDocument()
  })

  it('is excluded from search indexing', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })
})
