import { render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import ReadingFeedPage from '@/app/books/feed/page'

function Where() {
  return <div data-testid="where">{useLocation().pathname}</div>
}

describe('ReadingFeedPage', () => {
  it('redirects to /feeds', () => {
    render(
      <MemoryRouter initialEntries={['/books/feed']}>
        <ReadingFeedPage />
        <Where />
      </MemoryRouter>
    )
    expect(screen.getByTestId('where')).toHaveTextContent('/feeds')
  })
})
