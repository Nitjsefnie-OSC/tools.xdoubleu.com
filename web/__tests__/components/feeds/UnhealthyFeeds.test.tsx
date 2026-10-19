import React from 'react'
import { render, screen } from '@testing-library/react'
import UnhealthyFeeds from '@/components/feeds/UnhealthyFeeds'

const mockUseCurrentUser = vi.fn()
const mockUseUnhealthyFeeds = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useCurrentUser: () => mockUseCurrentUser()
}))
vi.mock('@/hooks/useFeeds', () => ({
  useUnhealthyFeeds: (enabled: boolean) => mockUseUnhealthyFeeds(enabled)
}))

describe('UnhealthyFeeds', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseUnhealthyFeeds.mockReturnValue({ data: undefined })
  })

  it('renders nothing for a non-admin viewer, and fetches nothing', () => {
    mockUseCurrentUser.mockReturnValue({ data: { role: 'user' } })
    const { container } = render(<UnhealthyFeeds />)
    expect(container).toBeEmptyDOMElement()
    expect(mockUseUnhealthyFeeds).toHaveBeenCalledWith(false)
  })

  it('renders nothing while the current user is unknown', () => {
    mockUseCurrentUser.mockReturnValue({ data: undefined })
    const { container } = render(<UnhealthyFeeds />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the card and fetches for an admin viewer', () => {
    mockUseCurrentUser.mockReturnValue({ data: { role: 'admin' } })
    mockUseUnhealthyFeeds.mockReturnValue({ data: { feeds: [] } })
    render(<UnhealthyFeeds />)
    expect(screen.getByText('Unhealthy feeds')).toBeInTheDocument()
    expect(mockUseUnhealthyFeeds).toHaveBeenCalledWith(true)
  })
})
