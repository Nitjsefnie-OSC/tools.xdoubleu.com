import * as Sentry from '@sentry/react'
import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { NotFound, RouteError } from '@/src/RouteStates'

vi.mock('@sentry/react', () => ({ captureException: vi.fn() }))

function Boom(): never {
  throw new Error('kaboom')
}

function renderAt(path: string, routes: Parameters<typeof createMemoryRouter>[0]) {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />)
}

describe('NotFound', () => {
  it('says the page does not exist', () => {
    renderAt('/nope', [{ path: '*', Component: NotFound }])

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})

describe('RouteError', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('reports a render error to Sentry and offers a reload', () => {
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })
    renderAt('/', [{ path: '/', Component: Boom, ErrorBoundary: RouteError }])

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'kaboom' })
    )

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(reload).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('does not report an HTTP-style route response', () => {
    renderAt('/', [
      {
        path: '/',
        loader: () => {
          throw new Response('gone', { status: 410 })
        },
        Component: () => null,
        ErrorBoundary: RouteError
      }
    ])

    expect(Sentry.captureException).not.toHaveBeenCalled()
  })
})
