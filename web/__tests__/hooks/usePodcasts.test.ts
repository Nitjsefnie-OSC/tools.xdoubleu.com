import { renderHook } from '@testing-library/react'

const sampleKeys = [
  '/podcasts/favourites',
  ['/podcasts/search', 'x'],
  '/movies/settings',
  undefined
]
let revalidated: unknown[] = []
const mockMutate = vi.fn(async (match: (key: unknown) => boolean) => {
  revalidated = sampleKeys.filter(match)
})
vi.mock('swr', () => ({
  __esModule: true,
  default: vi.fn(),
  useSWRConfig: () => ({ mutate: mockMutate })
}))
const mockClient = {
  listFavourites: vi.fn().mockResolvedValue({ favourites: [] }),
  searchShows: vi.fn().mockResolvedValue({ results: [] }),
  addFavourite: vi.fn().mockResolvedValue({}),
  removeFavourite: vi.fn().mockResolvedValue({})
}
vi.mock('@/lib/client', () => ({
  createServiceClient: vi.fn(() => mockClient)
}))
vi.mock('@/lib/gen/podcasts/v1/podcasts_pb', () => ({ PodcastsService: {} }))

import useSWR from 'swr'
import { usePodcastActions, usePodcastFavourites, usePodcastSearch } from '@/hooks/usePodcasts'

beforeEach(() => {
  vi.clearAllMocks()
  revalidated = []
})

const mockUseSWR = vi.mocked(useSWR)

beforeEach(() => {
  // Runs the fetcher for a non-null key, like SWR would.
  // @ts-expect-error -- mock returns partial SWRResponse for test purposes
  mockUseSWR.mockImplementation((key: unknown, fetcher: unknown) => {
    if (key !== null && typeof fetcher === 'function') void fetcher()
    return { data: undefined, isLoading: false, error: undefined }
  })
})

describe('usePodcastFavourites', () => {
  it('fetches the favourites', () => {
    renderHook(() => usePodcastFavourites())
    expect(mockUseSWR).toHaveBeenCalledWith('/podcasts/favourites', expect.any(Function))
    expect(mockClient.listFavourites).toHaveBeenCalledWith({})
  })
})

describe('usePodcastSearch', () => {
  it('searches from two characters', () => {
    renderHook(() => usePodcastSearch(' hi '))
    expect(mockUseSWR).toHaveBeenCalledWith(['/podcasts/search', 'hi'], expect.any(Function), {
      keepPreviousData: true
    })
    expect(mockClient.searchShows).toHaveBeenCalledWith({ query: 'hi' })
  })

  it('does not fetch for a short query', () => {
    renderHook(() => usePodcastSearch(' h '))
    expect(mockUseSWR).toHaveBeenCalledWith(null, expect.any(Function), expect.anything())
    expect(mockClient.searchShows).not.toHaveBeenCalled()
  })
})

describe('usePodcastActions', () => {
  it('adds and revalidates only podcasts keys', async () => {
    const { result } = renderHook(() => usePodcastActions())
    await result.current.add(7n)
    expect(mockClient.addFavourite).toHaveBeenCalledWith({ itunesId: 7n })
    expect(revalidated).toEqual(['/podcasts/favourites', ['/podcasts/search', 'x']])
  })

  it('removes and revalidates', async () => {
    const { result } = renderHook(() => usePodcastActions())
    await result.current.remove('f-1')
    expect(mockClient.removeFavourite).toHaveBeenCalledWith({ id: 'f-1' })
    expect(revalidated).toHaveLength(2)
  })
})
