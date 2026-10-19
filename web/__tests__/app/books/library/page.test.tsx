import React from 'react'
import { render, screen } from '@testing-library/react'

vi.mock('@/components/books/BooksSection', () => () => <div data-testid="books-section" />)

vi.mock('@/lib/server/client', () => ({
  createServerClient: vi.fn(async () => ({}))
}))

vi.mock('@/lib/server/fetchers', () => ({
  fetchOrNull: vi.fn(async () => null)
}))

vi.mock('@/components/SWRFallback', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

vi.mock('@/hooks/useAuth', () => ({
  useCurrentUser: vi.fn()
}))

import { useCurrentUser } from '@/hooks/useAuth'
import BacklogBooksLibraryPage from '@/app/books/library/page'

const mockUseCurrentUser = vi.mocked(useCurrentUser)

describe('BacklogBooksLibraryPage', () => {
  beforeEach(() => {
    // @ts-expect-error -- partial mock
    mockUseCurrentUser.mockReturnValue({ data: { role: 'user' }, isLoading: false })
  })

  it('renders the Library heading', async () => {
    render(await BacklogBooksLibraryPage())
    expect(screen.getByRole('heading', { name: 'Library' })).toBeInTheDocument()
  })

  it('renders a breadcrumb link back to /dashboard/reading', async () => {
    render(await BacklogBooksLibraryPage())
    expect(screen.getByRole('link', { name: 'Books' })).toHaveAttribute(
      'href',
      '/dashboard/reading'
    )
  })

  it('renders the BooksSection', async () => {
    render(await BacklogBooksLibraryPage())
    expect(screen.getByTestId('books-section')).toBeInTheDocument()
  })

  it('renders a settings link', async () => {
    render(await BacklogBooksLibraryPage())
    expect(screen.getByRole('link', { name: /settings/i })).toHaveAttribute(
      'href',
      '/books/settings'
    )
  })

  it('shows an Admin tools link for admin users', async () => {
    // @ts-expect-error -- partial mock
    mockUseCurrentUser.mockReturnValue({ data: { role: 'admin' }, isLoading: false })
    render(await BacklogBooksLibraryPage())
    expect(screen.getByRole('link', { name: 'Admin tools' })).toHaveAttribute(
      'href',
      '/books/admin'
    )
  })

  it('hides the Admin tools link for non-admin users', async () => {
    render(await BacklogBooksLibraryPage())
    expect(screen.queryByRole('link', { name: 'Admin tools' })).not.toBeInTheDocument()
  })
})
