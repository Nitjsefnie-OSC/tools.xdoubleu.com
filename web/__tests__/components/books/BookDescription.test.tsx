import { render, screen } from '@testing-library/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import BookDescription from '@/components/books/BookDescription'

vi.mock('react-markdown', () => ({
  __esModule: true,
  default: vi.fn(({ children }: { children: string }) => <div>{children}</div>)
}))

describe('BookDescription', () => {
  it('renders the description as GFM Markdown in prose styling', () => {
    render(<BookDescription id="desc" description="**Bold** text" className="extra" />)
    const root = screen.getByText('**Bold** text').parentElement
    expect(root).toHaveAttribute('id', 'desc')
    expect(root).toHaveClass('prose', 'prose-sm', 'max-w-none', 'text-fg', 'extra')
    expect(vi.mocked(ReactMarkdown).mock.calls[0][0]).toMatchObject({
      remarkPlugins: [remarkGfm]
    })
  })
})
