import { render, screen } from '@testing-library/react'

vi.mock('@/lib/server/client', () => ({
  createServerClient: vi.fn(async () => ({}))
}))

vi.mock('@/lib/server/fetchers', () => ({
  fetchOrNull: vi.fn(async () => null)
}))

vi.mock('@/components/games/GamesSettingsClient', () => () => (
  <div data-testid="games-settings-client" />
))

import BacklogGamesSettingsPage from '@/app/games/settings/page'

describe('BacklogGamesSettingsPage', () => {
  it('server-fetches integrations and renders the client component', async () => {
    render(await BacklogGamesSettingsPage())
    expect(screen.getByTestId('games-settings-client')).toBeInTheDocument()
  })
})
