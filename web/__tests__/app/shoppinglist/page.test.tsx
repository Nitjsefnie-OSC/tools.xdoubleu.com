import React from 'react'
import { render, screen } from '@testing-library/react'

const getCustomList = vi.fn().mockResolvedValue({})
const listCategories = vi.fn().mockResolvedValue({})

vi.mock('@/lib/server/client', () => ({
  createServerClient: vi.fn(async () => ({
    getCustomList: (...args: unknown[]) => getCustomList(...args),
    listCategories: (...args: unknown[]) => listCategories(...args)
  }))
}))

vi.mock('@/lib/server/fetchers', () => ({
  fetchOrNull: (fn: () => Promise<unknown>) => fn()
}))

vi.mock('@/components/SWRFallback', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

vi.mock('@/components/shoppinglist/ShoppingListPageClient', () => ({
  __esModule: true,
  default: () => <div data-testid="client" />
}))

import Page from '@/app/shoppinglist/page'

describe('ShoppingListPage', () => {
  it('renders with server-fetched data', async () => {
    render(await Page())
    expect(screen.getByTestId('client')).toBeInTheDocument()
    expect(getCustomList).toHaveBeenCalledWith({})
    expect(listCategories).toHaveBeenCalledWith({})
  })

  it('renders when the server fetch returns null', async () => {
    getCustomList.mockResolvedValueOnce(null)
    listCategories.mockResolvedValueOnce(null)
    render(await Page())
    expect(screen.getByTestId('client')).toBeInTheDocument()
  })
})
