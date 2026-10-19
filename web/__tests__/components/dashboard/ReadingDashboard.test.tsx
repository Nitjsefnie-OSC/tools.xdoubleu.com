import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mockUpdateProgress = vi.fn()
const mockUpdateBookStatus = vi.fn()

vi.mock('@/hooks/useBooks', () => ({
  useLibrary: vi.fn(),
  useBooksProgress: vi.fn(),
  useUpdateProgress: () => mockUpdateProgress,
  useUpdateBookStatus: () => mockUpdateBookStatus
}))

vi.mock('@/components/books/BookSearchBar', () => {
  return {
    default: function MockBookSearchBar() {
      return <div data-testid="book-search-bar" />
    }
  }
})

vi.mock('@/components/books/BooksProgressChart', () => {
  return {
    default: function MockBooksProgressChart() {
      return <div data-testid="books-progress-chart" />
    }
  }
})

vi.mock('@/components/dashboard/DashboardShareButton', () => {
  return {
    default: function MockDashboardShareButton() {
      return <div data-testid="dashboard-share-button" />
    }
  }
})

vi.mock('swr', () => ({ mutate: vi.fn() }))
vi.mock('@/hooks/usePhysicalCopy', () => ({
  usePhysicalCopy: () => ({ data: undefined }),
  useUpdatePhysicalCopy: () => vi.fn()
}))
vi.mock('@/hooks/useReadingState', () => ({
  useReadingState: () => ({ data: undefined })
}))

import ReadingDashboard from '@/components/dashboard/ReadingDashboard'
import { useLibrary, useBooksProgress } from '@/hooks/useBooks'
import { create } from '@bufbuild/protobuf'
import {
  UserBookSchema,
  BookSchema,
  LibraryResponseSchema,
  GetLibraryResponseSchema
} from '@/lib/gen/books/v1/library_pb'

const mockUseBacklogLibrary = vi.mocked(useLibrary)
const mockUseBooksProgress = vi.mocked(useBooksProgress)

const readingBook = create(UserBookSchema, {
  id: '1',
  bookId: 'book-1',
  status: 'currently-reading',
  formats: ['epub'],
  progressMode: 'pages',
  currentPage: 100,
  book: create(BookSchema, {
    title: 'Dune',
    authors: ['Frank Herbert'],
    coverUrl: 'http://example.com/dune.png',
    pageCount: 400
  })
})

function mockLibrary(reading = [readingBook]) {
  // @ts-expect-error -- mock returns partial SWRResponse for test purposes
  mockUseBacklogLibrary.mockReturnValue({
    data: create(GetLibraryResponseSchema, {
      library: create(LibraryResponseSchema, {
        reading,
        finished: [create(UserBookSchema, { id: '2', status: 'read' })],
        wishlist: [create(UserBookSchema, { id: '3', status: 'to-read' })]
      })
    }),
    error: undefined,
    isLoading: false
  })
  // @ts-expect-error -- mock returns partial SWRResponse for test purposes
  mockUseBooksProgress.mockReturnValue({ data: undefined })
}

describe('ReadingDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateBookStatus.mockResolvedValue({})
  })

  it('renders the stat cards derived from the library', () => {
    mockLibrary()
    render(<ReadingDashboard />)
    expect(screen.getByText('Total books')).toBeInTheDocument()
    expect(screen.getAllByText('Currently reading').length).toBeGreaterThan(0)
    expect(screen.getByText('Read')).toBeInTheDocument()
    expect(screen.getByText('Read this year')).toBeInTheDocument()
    expect(screen.getByText('Want to read')).toBeInTheDocument()
  })

  it('renders currently reading cards with a progress bar', () => {
    mockLibrary()
    render(<ReadingDashboard />)
    expect(screen.getByText('Dune')).toBeInTheDocument()
    expect(screen.getByText('100 / 400 pages')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
  })

  it('links reading cards to the book detail page', () => {
    mockLibrary()
    const { container } = render(<ReadingDashboard />)
    expect(container.querySelector('a[href="/books/1"]')).toBeInTheDocument()
  })

  it('links a Continue reading button straight to the reader', () => {
    mockLibrary()
    const { container } = render(<ReadingDashboard />)
    expect(screen.getByRole('link', { name: 'Continue reading' })).toHaveAttribute(
      'href',
      '/books/1/read'
    )
    expect(container.querySelector('a[href="/books/1"]')).not.toContainElement(
      screen.getByRole('link', { name: 'Continue reading' })
    )
  })

  it('hides Continue reading for a book with no readable file', () => {
    mockLibrary([create(UserBookSchema, { ...readingBook, formats: [] })])
    render(<ReadingDashboard />)
    expect(screen.getByText('Dune')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Continue reading' })).not.toBeInTheDocument()
  })

  it('opens the progress sheet from a visible button outside the card link', async () => {
    mockLibrary()
    const { container } = render(<ReadingDashboard />)

    const update = screen.getByRole('button', { name: /Update progress/ })
    expect(container.querySelector('a[href="/books/1"]')).not.toContainElement(update)
    fireEvent.click(update)
    expect(await screen.findByLabelText('Current page')).toBeInTheDocument()
  })

  it('does not show quick-step buttons on currently-reading cards', () => {
    mockLibrary()
    render(<ReadingDashboard />)
    expect(screen.queryByLabelText(/Increase progress/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Decrease progress/)).not.toBeInTheDocument()
  })

  it('marks a book as completed from the card without leaving the dashboard', async () => {
    mockLibrary()
    render(<ReadingDashboard />)

    fireEvent.click(screen.getByRole('button', { name: 'Mark as completed' }))
    // Radix makes the rest of the page inert while the dialog is open.
    fireEvent.click(await screen.findByRole('button', { name: 'Mark as completed' }))

    await waitFor(() =>
      expect(mockUpdateBookStatus).toHaveBeenCalledWith(
        expect.objectContaining({ bookId: 'book-1', status: 'read' })
      )
    )
  })

  it('shows an empty message when nothing is in progress', () => {
    mockLibrary([])
    render(<ReadingDashboard />)
    expect(screen.getByText('No books in progress.')).toBeInTheDocument()
  })

  it('links to the full library', () => {
    mockLibrary()
    render(<ReadingDashboard />)
    expect(screen.getByText('Browse full library').closest('a')).toHaveAttribute(
      'href',
      '/books/library'
    )
  })

  it('shows YTD chart by default and reveals date inputs when All time is selected', () => {
    mockLibrary()
    render(<ReadingDashboard />)
    expect(screen.queryByLabelText('From')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'All time' }))
    const from = screen.getByLabelText('From')
    fireEvent.change(from, { target: { value: '2026-01-01' } })
    expect(from).toHaveValue('2026-01-01')
  })

  it('shows a loading state', () => {
    // @ts-expect-error -- mock returns partial SWRResponse for test purposes
    mockUseBacklogLibrary.mockReturnValue({ data: undefined, error: undefined, isLoading: true })
    // @ts-expect-error -- mock returns partial SWRResponse for test purposes
    mockUseBooksProgress.mockReturnValue({ data: undefined })
    render(<ReadingDashboard />)
    expect(screen.getByText('Loading dashboard…')).toBeInTheDocument()
  })

  it('shows an error state', () => {
    // @ts-expect-error -- mock returns partial SWRResponse for test purposes
    mockUseBacklogLibrary.mockReturnValue({
      data: undefined,
      error: new Error('boom'),
      isLoading: false
    })
    // @ts-expect-error -- mock returns partial SWRResponse for test purposes
    mockUseBooksProgress.mockReturnValue({ data: undefined })
    render(<ReadingDashboard />)
    expect(screen.getByText('Failed to load books.')).toBeInTheDocument()
  })
})
