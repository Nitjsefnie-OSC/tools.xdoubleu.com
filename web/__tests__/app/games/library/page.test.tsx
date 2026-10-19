vi.mock('@/lib/server/client', () => ({
  createServerClient: vi.fn(async () => ({}))
}))

vi.mock('@/lib/server/fetchers', () => ({
  fetchOrNull: vi.fn(async () => null)
}))

import React from 'react'
import { render, screen } from '@testing-library/react'

vi.mock('@/components/games/GamesLibrary', () => () => <div data-testid="games-library" />)

import BacklogGamesLibraryPage from '@/app/games/library/page'

describe('BacklogGamesLibraryPage', () => {
  it('renders the Library heading', async () => {
    render(await BacklogGamesLibraryPage())
    expect(screen.getByRole('heading', { name: 'Library' })).toBeInTheDocument()
  })

  it('renders a breadcrumb link back to /dashboard/games', async () => {
    render(await BacklogGamesLibraryPage())
    expect(screen.getByRole('link', { name: 'Games' })).toHaveAttribute('href', '/dashboard/games')
  })

  it('renders the GamesLibrary', async () => {
    render(await BacklogGamesLibraryPage())
    expect(screen.getByTestId('games-library')).toBeInTheDocument()
  })
})
