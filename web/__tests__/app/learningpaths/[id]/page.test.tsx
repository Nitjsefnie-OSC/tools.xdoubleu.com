import React from 'react'
vi.mock('@/lib/server/client', () => ({
  createServerClient: vi.fn(async () => ({}))
}))

const fetchOrNull = vi.fn()

vi.mock('@/lib/server/fetchers', () => ({
  fetchOrNull: (fn: () => Promise<unknown>) => fetchOrNull(fn)
}))

vi.mock('@/components/SWRFallback', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

import { render } from '@testing-library/react'

vi.mock('@/app/learningpaths/[id]/PathClient', () => ({
  __esModule: true,
  default: ({ id }: { id: string }) => <div data-testid="path-client">{id}</div>
}))

import LearningPathPage from '@/app/learningpaths/[id]/page'

describe('LearningPathPage', () => {
  it('renders with server-fetched data', async () => {
    fetchOrNull.mockResolvedValue({ learningPath: { id: 'path-123' } })
    const params = Promise.resolve({ id: 'path-123' })
    const { getByTestId } = render(await LearningPathPage({ params }))
    expect(getByTestId('path-client')).toBeInTheDocument()
  })

  it('renders when the server fetch returns null', async () => {
    fetchOrNull.mockResolvedValue(null)
    const params = Promise.resolve({ id: 'path-123' })
    const { getByTestId } = render(await LearningPathPage({ params }))
    expect(getByTestId('path-client')).toBeInTheDocument()
  })

  it('passes the id from params to PathClient', async () => {
    fetchOrNull.mockResolvedValue(null)
    const params = Promise.resolve({ id: 'my-path-id' })
    const { getByText } = render(await LearningPathPage({ params }))
    expect(getByText('my-path-id')).toBeInTheDocument()
  })
})
