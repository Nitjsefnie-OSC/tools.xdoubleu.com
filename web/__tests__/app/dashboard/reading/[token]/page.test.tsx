import React from 'react'
import { render, screen } from '@testing-library/react'
import { create } from '@bufbuild/protobuf'
import {
  GetSharedLibraryResponseSchema,
  type GetSharedLibraryResponse
} from '@/lib/gen/dashboard/v1/reading_pb'

vi.mock('@/components/dashboard/ReadingDashboardPublicClient', () => () => (
  <div data-testid="reading-dashboard-public" />
))

const mockFetchOrNull = vi.fn<Promise<GetSharedLibraryResponse | null>, [unknown]>(
  async () => null
)

vi.mock('@/lib/server/client', () => ({
  createServerClient: vi.fn(async () => ({}))
}))

vi.mock('@/lib/server/fetchers', () => ({
  fetchOrNull: (fn: () => unknown) => mockFetchOrNull(fn)
}))

vi.mock('@/components/SWRFallback', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

import ReadingDashboardPublicPage, { metadata } from '@/app/dashboard/reading/[token]/page'

describe('ReadingDashboardPublicPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders a generic heading and client component when the link is invalid', async () => {
    mockFetchOrNull.mockResolvedValue(null)
    render(await ReadingDashboardPublicPage({ params: Promise.resolve({ token: 'tok-1' }) }))
    expect(screen.getByRole('heading', { name: 'Shared reading' })).toBeInTheDocument()
    expect(screen.getByTestId('reading-dashboard-public')).toBeInTheDocument()
  })

  it("renders the owner's display name in the heading", async () => {
    mockFetchOrNull.mockResolvedValue(
      create(GetSharedLibraryResponseSchema, { displayName: 'Alice' })
    )
    render(await ReadingDashboardPublicPage({ params: Promise.resolve({ token: 'tok-1' }) }))
    expect(screen.getByRole('heading', { name: "Alice's reading" })).toBeInTheDocument()
  })

  it('is excluded from search indexing', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false })
  })
})
