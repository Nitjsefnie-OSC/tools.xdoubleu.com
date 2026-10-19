import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ConsentForm from '@/app/oauth/consent/ConsentForm'
import { decideAuthorization } from '@/lib/oauth2as/consentClient'

vi.mock('@/lib/oauth2as/consentClient', () => ({ decideAuthorization: vi.fn() }))

const assign = vi.fn()

describe('ConsentForm', () => {
  beforeEach(() => {
    vi.mocked(decideAuthorization).mockReset().mockResolvedValue('https://cb?code=1')
    assign.mockReset()
    vi.stubGlobal('location', { ...window.location, assign })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the client name and human-readable scopes', () => {
    render(
      <ConsentForm
        consentToken="tok"
        requestQuery="client_id=c1"
        clientName="Claude CLI"
        scope="openid email"
      />
    )
    expect(screen.getByText('Authorize Claude CLI')).toBeInTheDocument()
    expect(screen.getByText('Verify your identity')).toBeInTheDocument()
    expect(screen.getByText('Read your email address')).toBeInTheDocument()
  })

  it('shows unknown scopes verbatim', () => {
    render(
      <ConsentForm
        consentToken="tok"
        requestQuery="client_id=c1"
        clientName="X"
        scope="custom:scope"
      />
    )
    expect(screen.getByText('custom:scope')).toBeInTheDocument()
  })

  it('approves with the original request query and consent token, then follows the redirect', async () => {
    render(
      <ConsentForm
        consentToken="tok"
        requestQuery="client_id=c1&scope=openid"
        clientName="X"
        scope="openid"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }))

    await waitFor(() => expect(assign).toHaveBeenCalledWith('https://cb?code=1'))
    const [query, decision, token] = vi.mocked(decideAuthorization).mock.calls[0]
    expect(query.toString()).toBe('client_id=c1&scope=openid')
    expect([decision, token]).toEqual(['allow', 'tok'])
  })

  it('denies with the original request query and no consent token', async () => {
    render(
      <ConsentForm
        consentToken="tok"
        requestQuery="client_id=c1&scope=openid"
        clientName="X"
        scope="openid"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Deny' }))

    await waitFor(() => expect(assign).toHaveBeenCalled())
    const [query, decision, token] = vi.mocked(decideAuthorization).mock.calls[0]
    expect(query.toString()).toBe('client_id=c1&scope=openid')
    expect([decision, token]).toEqual(['deny', undefined])
  })

  it('surfaces an error and re-enables the buttons when the decision fails', async () => {
    vi.mocked(decideAuthorization).mockRejectedValue(new Error('boom'))
    render(
      <ConsentForm consentToken="tok" requestQuery="client_id=c1" clientName="X" scope="openid" />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }))

    await waitFor(() =>
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
    )
    expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled()
    expect(assign).not.toHaveBeenCalled()
  })
})
