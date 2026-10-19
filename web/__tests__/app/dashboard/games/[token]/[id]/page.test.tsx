import React from 'react'
import { render, screen } from '@testing-library/react'

const mockGamesDashboardPublicGameClient = vi.fn<React.JSX.Element, [object]>(() => (
  <div data-testid="profile-game" />
))
vi.mock('@/components/dashboard/GamesDashboardPublicGameClient', () => ({
  __esModule: true,
  default: (props: object) => mockGamesDashboardPublicGameClient(props)
}))

vi.mock('@/lib/server/client', () => ({
  createServerClient: vi.fn(async () => ({}))
}))

vi.mock('@/lib/server/fetchers', () => ({
  fetchOrNull: vi.fn(async () => null)
}))

import ProfileGamePage, { metadata } from '@/app/dashboard/games/[token]/[id]/page'

describe('ProfileGamePage', () => {
  it('renders the client component with token and id', async () => {
    render(await ProfileGamePage({ params: Promise.resolve({ token: 'tok-1', id: '7' }) }))
    expect(screen.getByTestId('profile-game')).toBeInTheDocument()
    expect(mockGamesDashboardPublicGameClient).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'tok-1', id: '7' })
    )
  })

  it('is excluded from search indexing', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })
})
