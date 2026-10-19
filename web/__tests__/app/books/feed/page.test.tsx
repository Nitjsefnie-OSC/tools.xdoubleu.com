vi.mock('@/hooks/navigation', () => ({
  redirect: vi.fn()
}))

import { redirect } from '@/hooks/navigation'
import ReadingFeedPage from '@/app/books/feed/page'

describe('ReadingFeedPage', () => {
  it('redirects to /feeds', () => {
    ReadingFeedPage()
    expect(redirect).toHaveBeenCalledWith('/feeds')
  })
})
