import { render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import LearningPathsPage from '@/app/learningpaths/page'

function Where() {
  return <div data-testid="where">{useLocation().pathname}</div>
}

describe('LearningPathsPage', () => {
  it('redirects to /learningpaths/list', () => {
    render(
      <MemoryRouter initialEntries={['/learningpaths']}>
        <LearningPathsPage />
        <Where />
      </MemoryRouter>
    )
    expect(screen.getByTestId('where')).toHaveTextContent('/learningpaths/list')
  })
})
