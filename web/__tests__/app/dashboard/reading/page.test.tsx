import React from 'react'
import { render, screen } from '@testing-library/react'

vi.mock('@/components/dashboard/ReadingDashboard', () => () => (
  <div data-testid="reading-dashboard" />
))

vi.mock('@/lib/server/client', () => ({
  createServerClient: vi.fn(async () => ({}))
}))

vi.mock('@/lib/server/fetchers', () => ({
  fetchOrNull: vi.fn(async () => null)
}))

vi.mock('@/components/SWRFallback', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

import ReadingDashboardPage from '@/app/dashboard/reading/page'

describe('ReadingDashboardPage', () => {
  it('renders the Books heading', async () => {
    render(await ReadingDashboardPage())
    expect(screen.getByRole('heading', { name: 'Books' })).toBeInTheDocument()
  })

  it('renders a settings link pointing to /books/settings', async () => {
    render(await ReadingDashboardPage())
    const link = screen.getByRole('link', { name: /settings/i })
    expect(link).toHaveAttribute('href', '/books/settings')
  })

  it('renders the ReadingDashboard', async () => {
    render(await ReadingDashboardPage())
    expect(screen.getByTestId('reading-dashboard')).toBeInTheDocument()
  })
})
