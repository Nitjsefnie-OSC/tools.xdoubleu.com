import { render, screen } from '@testing-library/react'

vi.mock('@/lib/server/client', () => ({
  createServerClient: vi.fn(async () => ({}))
}))

vi.mock('@/lib/server/fetchers', () => ({
  fetchOrNull: vi.fn(async () => null)
}))

vi.mock(
  '@/app/games/distribution/[bucket]/SteamDistributionClient',
  () => (props: { bucket: string }) => <div data-testid="distribution-client">{props.bucket}</div>
)

import Page from '@/app/games/distribution/[bucket]/page'

describe('SteamDistributionPage', () => {
  it('awaits params and renders the client with the bucket', async () => {
    render(await Page({ params: Promise.resolve({ bucket: '80' }) }))
    expect(screen.getByTestId('distribution-client')).toHaveTextContent('80')
  })
})
