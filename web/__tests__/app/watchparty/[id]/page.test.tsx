import { render } from '@testing-library/react'
import { useRouteParams } from '@/hooks/navigation'

vi.mock('@/app/watchparty/[id]/ViewerClient', () => ({
  __esModule: true,
  default: ({ id }: { id: string }) => <div data-testid="viewer-client">{id}</div>
}))

import ViewerPage from '@/app/watchparty/[id]/page'

describe('ViewerPage', () => {
  it('renders without throwing', () => {
    vi.mocked(useRouteParams).mockReturnValue({ id: 'session-123' })
    const { getByTestId } = render(<ViewerPage />)
    expect(getByTestId('viewer-client')).toBeInTheDocument()
  })

  it('passes the id from params to ViewerClient', () => {
    vi.mocked(useRouteParams).mockReturnValue({ id: 'my-session-id' })
    const { getByText } = render(<ViewerPage />)
    expect(getByText('my-session-id')).toBeInTheDocument()
  })
})
