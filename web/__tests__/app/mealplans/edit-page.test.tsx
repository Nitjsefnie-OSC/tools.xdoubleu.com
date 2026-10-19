import React from 'react'
import { render, screen } from '@testing-library/react'

const fetchOrNull = vi.fn()

vi.mock('@/lib/server/client', () => ({
  createServerClient: vi.fn(async () => ({}))
}))

vi.mock('@/lib/server/fetchers', () => ({
  fetchOrNull: (fn: () => Promise<unknown>) => fetchOrNull(fn)
}))

vi.mock('@/components/SWRFallback', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

vi.mock('@/app/mealplans/[id]/edit/EditPlanClient', () => ({
  __esModule: true,
  default: () => <div data-testid="client" />
}))

import Page from '@/app/mealplans/[id]/edit/page'

describe('EditPlanPage', () => {
  it('renders with server-fetched data', async () => {
    fetchOrNull.mockResolvedValue({})
    render(await Page({ params: Promise.resolve({ id: 'p1' }) }))
    expect(screen.getByTestId('client')).toBeInTheDocument()
  })

  it('renders when the server fetch returns null', async () => {
    fetchOrNull.mockResolvedValue(null)
    render(await Page({ params: Promise.resolve({ id: 'p1' }) }))
    expect(screen.getByTestId('client')).toBeInTheDocument()
  })
})
