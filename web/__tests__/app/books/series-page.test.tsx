import React from 'react'
import { render, screen } from '@testing-library/react'

const fetchOrNull = vi.fn()
const fallbackProps = vi.fn()
const mockGetSeries = vi.fn()

vi.mock('@/lib/server/client', () => ({
  createServerClient: vi.fn(async () => ({ getSeries: mockGetSeries }))
}))

vi.mock('@/lib/server/fetchers', () => ({
  fetchOrNull: (fn: () => Promise<unknown>) => fetchOrNull(fn)
}))

vi.mock('@/components/SWRFallback', () => ({
  __esModule: true,
  default: ({ children, keyed }: { children: React.ReactNode; keyed: unknown }) => {
    fallbackProps(keyed)
    return <>{children}</>
  }
}))

vi.mock('@/components/books/SeriesBooksClient', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => <div data-testid="client">{name}</div>
}))

import Page from '@/app/books/series/[name]/page'

describe('SeriesPage', () => {
  beforeEach(() => fallbackProps.mockReset())

  it('decodes the name and seeds the series key', async () => {
    const data = { name: 'Discworld' }
    mockGetSeries.mockResolvedValue(data)
    fetchOrNull.mockImplementation((fn: () => Promise<unknown>) => fn())
    render(await Page({ params: Promise.resolve({ name: 'Disc%20world' }) }))
    expect(mockGetSeries).toHaveBeenCalledWith({ name: 'Disc world' })
    expect(screen.getByTestId('client')).toHaveTextContent('Disc world')
    expect(fallbackProps).toHaveBeenCalledWith([[['/books/series', 'Disc world'], data]])
  })

  it('renders without a fallback when the fetch fails', async () => {
    fetchOrNull.mockResolvedValue(null)
    render(await Page({ params: Promise.resolve({ name: 'Discworld' }) }))
    expect(screen.getByTestId('client')).toBeInTheDocument()
    expect(fallbackProps).toHaveBeenCalledWith([])
  })
})
