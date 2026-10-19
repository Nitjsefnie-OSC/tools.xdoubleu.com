import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@sentry/react', () => ({
  captureException: vi.fn()
}))

import * as Sentry from '@sentry/react'
import GlobalError from '@/app/global-error'

const mockCaptureException = vi.mocked(Sentry.captureException)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GlobalError', () => {
  it('renders error UI with message', () => {
    const testError = new Error('Test error message')
    const mockReset = vi.fn()

    render(<GlobalError error={testError} reset={mockReset} />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error message')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Try again/ })).toBeInTheDocument()
  })

  it('calls captureException on mount with the error', async () => {
    const testError = new Error('Specific test error')
    const mockReset = vi.fn()

    render(<GlobalError error={testError} reset={mockReset} />)

    await waitFor(() => {
      expect(mockCaptureException).toHaveBeenCalledTimes(1)
      expect(mockCaptureException).toHaveBeenCalledWith(testError)
    })
  })

  it('re-calls captureException when error changes', async () => {
    const initialError = new Error('Initial error')
    const mockReset = vi.fn()

    const { rerender } = render(<GlobalError error={initialError} reset={mockReset} />)

    await waitFor(() => {
      expect(mockCaptureException).toHaveBeenCalledWith(initialError)
    })

    const updatedError = new Error('Updated error')
    rerender(<GlobalError error={updatedError} reset={mockReset} />)

    await waitFor(() => {
      expect(mockCaptureException).toHaveBeenCalledTimes(2)
      expect(mockCaptureException).toHaveBeenLastCalledWith(updatedError)
    })
  })

  it('does not call reset when retry button is clicked', () => {
    // reset() doesn't re-run the root layout's failed fetch, so retry must
    // reload. jsdom can't spy on reload(); assert reset() isn't used.
    const testError = new Error('Test error')
    const mockReset = vi.fn()

    render(<GlobalError error={testError} reset={mockReset} />)

    const retryButton = screen.getByRole('button', { name: /Try again/ })
    expect(() => fireEvent.click(retryButton)).not.toThrow()

    expect(mockReset).not.toHaveBeenCalled()
  })
})
