import { render } from '@testing-library/react'
import { useRouteParams } from '@/hooks/navigation'

vi.mock('@/app/watchparty/[id]/presenter/PresenterClient', () => ({
  __esModule: true,
  default: ({ id }: { id: string }) => <div data-testid="presenter-client">{id}</div>
}))

import PresenterPage from '@/app/watchparty/[id]/presenter/page'

describe('PresenterPage', () => {
  it('renders without throwing', () => {
    vi.mocked(useRouteParams).mockReturnValue({ id: 'session-123' })
    const { getByTestId } = render(<PresenterPage />)
    expect(getByTestId('presenter-client')).toBeInTheDocument()
  })

  it('passes the id from params to PresenterClient', () => {
    vi.mocked(useRouteParams).mockReturnValue({ id: 'my-session-id' })
    const { getByText } = render(<PresenterPage />)
    expect(getByText('my-session-id')).toBeInTheDocument()
  })
})
