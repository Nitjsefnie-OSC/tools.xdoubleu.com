import { renderHook } from '@testing-library/react'

vi.mock('swr', () => ({ __esModule: true, default: vi.fn() }))
vi.mock('@/lib/books/gatewayClient', () => ({
  probeGateway: vi.fn()
}))

import useSWR from 'swr'
import { useGatewayStatus } from '@/hooks/useKoboGateway'
import { swrKeys } from '@/lib/swrKeys'

const mockUseSWR = vi.mocked(useSWR)

beforeEach(() => {
  // @ts-expect-error -- mock returns partial SWRResponse for test purposes
  mockUseSWR.mockReturnValue({ data: undefined, isLoading: false, error: undefined })
  mockUseSWR.mockClear()
})

describe('useGatewayStatus', () => {
  it('polls the gateway status key on a fixed interval', () => {
    renderHook(() => useGatewayStatus())

    expect(mockUseSWR).toHaveBeenCalledWith(
      swrKeys.gatewayStatus,
      expect.any(Function),
      expect.objectContaining({ refreshInterval: 2000 })
    )
  })
})
