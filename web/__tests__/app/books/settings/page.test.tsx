import { render, screen } from '@testing-library/react'

vi.mock('@/lib/server/client', () => ({
  createServerClient: vi.fn(async () => ({}))
}))

vi.mock('@/lib/server/fetchers', () => ({
  fetchOrNull: vi.fn(async () => null)
}))

vi.mock('@/components/books/BooksSettingsClient', () => () => (
  <div data-testid="books-settings-client" />
))

import BacklogBooksSettingsPage from '@/app/books/settings/page'

describe('BacklogBooksSettingsPage', () => {
  it('server-fetches kobo devices and renders the client component', async () => {
    render(await BacklogBooksSettingsPage())
    expect(screen.getByTestId('books-settings-client')).toBeInTheDocument()
  })
})
