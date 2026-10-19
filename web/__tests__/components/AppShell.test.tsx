import React from 'react'
import { render, screen } from '@testing-library/react'

vi.mock('@/hooks/useAuth', () => ({ useCurrentUser: vi.fn() }))

vi.mock('@/components/SWRProvider', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="swr-provider">{children}</div>
  ),
  useSessionEffects: vi.fn()
}))

vi.mock('@/components/Navbar', () => ({
  __esModule: true,
  default: () => <div data-testid="navbar" />
}))

vi.mock('@/components/Footer', () => ({
  __esModule: true,
  default: () => <div data-testid="footer" />
}))

vi.mock('@/components/offline/OfflineBanner', () => ({
  __esModule: true,
  default: () => <div data-testid="offline-banner" />
}))

vi.mock('@/components/offline/OutboxSync', () => ({
  __esModule: true,
  default: () => <div data-testid="outbox-sync" />
}))

vi.mock('@/components/offline/ServiceWorkerRegistrar', () => ({
  __esModule: true,
  default: () => <div data-testid="sw-registrar" />
}))

vi.mock('@/components/DeployNotification', () => ({
  __esModule: true,
  default: () => <div data-testid="deploy-notification" />
}))

vi.mock('@/components/books/OfflineBooksSync', () => ({
  __esModule: true,
  default: () => <div data-testid="offline-books-sync" />
}))

import AppShell from '@/components/AppShell'
import { useCurrentUser } from '@/hooks/useAuth'
import { useSessionEffects } from '@/components/SWRProvider'

function signedInAs(user: { userId?: string; role: string; appAccess: string[] } | undefined) {
  vi.mocked(useCurrentUser).mockReturnValue({ data: user } as never)
}

describe('AppShell', () => {
  it('renders the app chrome and children', () => {
    signedInAs({ role: 'user', appAccess: [] })
    render(
      <AppShell>
        <div data-testid="child">content</div>
      </AppShell>
    )

    expect(screen.getByTestId('swr-provider')).toBeInTheDocument()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
    expect(screen.getByTestId('deploy-notification')).toBeInTheDocument()
    expect(screen.getByTestId('offline-banner')).toBeInTheDocument()
    expect(screen.getByTestId('sw-registrar')).toBeInTheDocument()
    expect(screen.getByTestId('outbox-sync')).toBeInTheDocument()
    expect(screen.getByTestId('child')).toHaveTextContent('content')
  })

  it('passes the signed-in user to the session effects', () => {
    signedInAs({ userId: 'u1', role: 'user', appAccess: [] })
    render(<AppShell>{null}</AppShell>)

    expect(useSessionEffects).toHaveBeenCalledWith('u1')
  })

  it.each([
    ['a user with books access', { role: 'user', appAccess: ['books'] }, true],
    ['an admin', { role: 'admin', appAccess: [] }, true],
    ['a user without books access', { role: 'user', appAccess: ['games'] }, false]
  ])('keeps books downloaded for offline only for %s', (_, user, synced) => {
    signedInAs(user)
    render(<AppShell>{null}</AppShell>)

    expect(screen.queryByTestId('offline-books-sync') !== null).toBe(synced)
  })

  it('keeps no books offline when signed out', () => {
    signedInAs(undefined)
    render(<AppShell>{null}</AppShell>)

    expect(screen.queryByTestId('offline-books-sync')).not.toBeInTheDocument()
  })
})
