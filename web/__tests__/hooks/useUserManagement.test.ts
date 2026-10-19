import { renderHook } from '@testing-library/react'

vi.mock('swr', () => ({ __esModule: true, default: vi.fn() }))
vi.mock('@/lib/client', () => ({
  createServiceClient: vi.fn(() => ({
    listUsers: vi.fn(),
    setRole: vi.fn(),
    setAppAccess: vi.fn()
  }))
}))
vi.mock('@/lib/gen/access/v1/access_pb', () => ({
  AccessService: {}
}))

import useSWR from 'swr'
import { createServiceClient } from '@/lib/client'
import { useUsers, useSetRole, useSetAppAccess } from '@/hooks/useUserManagement'

const mockUseSWR = vi.mocked(useSWR)
const mockCreateServiceClient = vi.mocked(createServiceClient)

beforeEach(() => {
  mockUseSWR.mockReturnValue(
    // @ts-expect-error -- mock returns a partial SWRResponse for test purposes
    { data: undefined, isLoading: false, error: undefined }
  )
  mockUseSWR.mockClear()
})

describe('useUsers', () => {
  it('uses /user-management/users as key', () => {
    renderHook(() => useUsers())
    expect(mockUseSWR).toHaveBeenCalledWith('/user-management/users', expect.any(Function))
  })

  it('returns SWR result', () => {
    const mockData = { users: [{ id: '1', email: 'a@b.com', role: 'user' }] }
    mockUseSWR.mockReturnValueOnce(
      // @ts-expect-error -- mock returns a partial SWRResponse for test purposes
      { data: mockData, isLoading: false, error: undefined }
    )
    const { result } = renderHook(() => useUsers())
    expect(result.current.data).toEqual(mockData)
  })
})

describe('useSetRole', () => {
  it('returns a function that calls client.setRole', () => {
    const mockSetRole = vi.fn().mockResolvedValue({})
    // @ts-expect-error -- mock client returns partial shape
    mockCreateServiceClient.mockReturnValue({ setRole: mockSetRole })

    const { result } = renderHook(() => useSetRole())
    result.current('user-1', 'admin')
    expect(mockSetRole).toHaveBeenCalledWith({ userId: 'user-1', role: 'admin' })
  })
})

describe('useSetAppAccess', () => {
  it('returns a function that calls client.setAppAccess', () => {
    const mockSetAppAccess = vi.fn().mockResolvedValue({})
    // @ts-expect-error -- mock client returns partial shape
    mockCreateServiceClient.mockReturnValue({ setAppAccess: mockSetAppAccess })

    const { result } = renderHook(() => useSetAppAccess())
    result.current('user-1', 'backlog', true)
    expect(mockSetAppAccess).toHaveBeenCalledWith({
      userId: 'user-1',
      appName: 'backlog',
      grant: true
    })
  })
})
