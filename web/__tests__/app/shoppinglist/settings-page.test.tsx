import React from 'react'
import { render, screen } from '@testing-library/react'

const listCategories = vi.fn().mockResolvedValue({})
const listItemNames = vi.fn().mockResolvedValue({})
const listItemCategories = vi.fn().mockResolvedValue({})
const listStores = vi.fn().mockResolvedValue({})

vi.mock('@/lib/server/client', () => ({
  createServerClient: vi.fn(async () => ({
    listCategories: (...args: unknown[]) => listCategories(...args),
    listItemNames: (...args: unknown[]) => listItemNames(...args),
    listItemCategories: (...args: unknown[]) => listItemCategories(...args),
    listStores: (...args: unknown[]) => listStores(...args)
  }))
}))

vi.mock('@/lib/server/fetchers', () => ({
  fetchOrNull: (fn: () => Promise<unknown>) => fn()
}))

vi.mock('@/components/SWRFallback', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

vi.mock('@/components/shoppinglist/CategoryManager', () => ({
  __esModule: true,
  default: () => <div data-testid="client" />
}))
vi.mock('@/components/shoppinglist/ItemCatalog', () => ({
  __esModule: true,
  default: () => <div data-testid="item-catalog" />
}))
vi.mock('@/components/shoppinglist/StoreManager', () => ({
  __esModule: true,
  default: () => <div data-testid="store-manager" />
}))

import Page from '@/app/shoppinglist/settings/page'

describe('ShoppingListSettingsPage', () => {
  it('renders with server-fetched data', async () => {
    render(await Page())
    expect(screen.getByTestId('client')).toBeInTheDocument()
    expect(listCategories).toHaveBeenCalledWith({})
  })

  it('renders when the server fetch returns null', async () => {
    listCategories.mockResolvedValueOnce(null)
    listItemNames.mockResolvedValueOnce(null)
    listItemCategories.mockResolvedValueOnce(null)
    listStores.mockResolvedValueOnce(null)
    render(await Page())
    expect(screen.getByTestId('client')).toBeInTheDocument()
  })
})
