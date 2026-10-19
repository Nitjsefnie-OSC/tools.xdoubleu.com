import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const updateItem = vi.fn()
vi.mock('@/hooks/useFeeds', () => ({
  useUpdateItem: () => updateItem
}))

import FeedBookmarkButton from '@/components/feeds/FeedBookmarkButton'

describe('FeedBookmarkButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('bookmarks an item optimistically and persists it', async () => {
    updateItem.mockResolvedValue({})
    render(<FeedBookmarkButton itemId="item-1" bookmarked={false} />)

    const button = screen.getByRole('button', { name: 'Bookmark' })
    fireEvent.click(button)

    expect(screen.getByRole('button', { name: 'Remove bookmark' })).toBeInTheDocument()
    await waitFor(() => {
      expect(updateItem).toHaveBeenCalledWith('item-1', { bookmarked: true })
    })
  })

  it('reverts the optimistic update when the mutation fails', async () => {
    updateItem.mockRejectedValue(new Error('nope'))
    render(<FeedBookmarkButton itemId="item-1" bookmarked={false} />)

    fireEvent.click(screen.getByRole('button', { name: 'Bookmark' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Bookmark' })).toBeInTheDocument()
    })
  })

  it('unmarks an already-bookmarked item', async () => {
    updateItem.mockResolvedValue({})
    render(<FeedBookmarkButton itemId="item-1" bookmarked={true} />)

    fireEvent.click(screen.getByRole('button', { name: 'Remove bookmark' }))

    await waitFor(() => {
      expect(updateItem).toHaveBeenCalledWith('item-1', { bookmarked: false })
    })
  })
})
