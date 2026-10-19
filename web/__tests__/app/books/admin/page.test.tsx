import { render, screen } from '@testing-library/react'

vi.mock('@/lib/server/client', () => ({
  createServerClient: vi.fn(async () => ({}))
}))

vi.mock('@/lib/server/fetchers', () => ({
  fetchOrNull: vi.fn(async () => null)
}))

vi.mock('@/components/books/BooksAdminClient', () => () => (
  <div data-testid="books-admin-client" />
))

import BacklogBooksAdminPage from '@/app/books/admin/page'

describe('BacklogBooksAdminPage', () => {
  it('server-fetches the catalog and renders the client component', async () => {
    render(await BacklogBooksAdminPage())
    expect(screen.getByTestId('books-admin-client')).toBeInTheDocument()
  })
})
