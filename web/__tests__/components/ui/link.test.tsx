import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { useLinkPending } from '@/components/ui/link'

vi.unmock('@/components/ui/link')
const { Link } =
  await vi.importActual<typeof import('@/components/ui/link')>('@/components/ui/link')

function Pending() {
  return <span data-testid="pending">{String(useLinkPending())}</span>
}

function renderLink(element: React.ReactNode, routes: string[] = ['/']) {
  const router = createMemoryRouter(
    [
      { path: '/', element },
      { path: '/slow', element: <div>slow page</div>, loader: () => new Promise(() => {}) },
      { path: '/fast', element: <div>fast page</div> }
    ],
    { initialEntries: routes }
  )
  render(<RouterProvider router={router} />)
  return router
}

describe('Link', () => {
  it('renders an in-app href as a router link', () => {
    renderLink(<Link href="/fast?x=1">Fast</Link>)

    expect(screen.getByRole('link', { name: 'Fast' })).toHaveAttribute('href', '/fast?x=1')
  })

  it.each(['https://example.com/x', 'mailto:a@b.c', '//cdn.example.com/x'])(
    'renders %s as a plain anchor',
    (href) => {
      renderLink(
        <Link href={href} target="_blank" rel="noreferrer">
          Out
        </Link>
      )

      const link = screen.getByRole('link', { name: 'Out' })
      expect(link).toHaveAttribute('href', href)
      expect(link).toHaveAttribute('target', '_blank')
    }
  )

  it('is pending only while its own navigation loads', async () => {
    renderLink(
      <>
        <Link href="/slow">
          Slow <Pending />
        </Link>
        <Link href="/fast">
          Fast <Pending />
        </Link>
      </>
    )
    const [slow, fast] = screen.getAllByTestId('pending')
    expect(slow).toHaveTextContent('false')

    fireEvent.click(screen.getByRole('link', { name: /Slow/ }))

    await waitFor(() => expect(slow).toHaveTextContent('true'))
    expect(fast).toHaveTextContent('false')
  })

  it('is not pending outside a link', () => {
    render(<Pending />)

    expect(screen.getByTestId('pending')).toHaveTextContent('false')
  })
})
