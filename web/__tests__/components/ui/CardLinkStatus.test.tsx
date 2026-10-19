import { render } from '@testing-library/react'
import { CardLinkStatus } from '@/components/ui/CardLinkStatus'

let pending = false
vi.mock('@/components/ui/link', () => ({ useLinkPending: () => pending }))

describe('CardLinkStatus', () => {
  it('renders a spinner when the link navigation is pending', () => {
    pending = true
    const { container } = render(<CardLinkStatus />)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders nothing when the link is not pending', () => {
    pending = false
    const { container } = render(<CardLinkStatus />)
    expect(container.firstChild).toBeNull()
  })
})
