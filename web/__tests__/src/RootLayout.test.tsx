import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import RootLayout from '@/src/RootLayout'
import { usePathname } from '@/hooks/navigation'

vi.mock('@/components/AppShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="shell">{children}</div>
  )
}))
vi.mock('@/src/WebVitals', () => ({ WebVitals: () => <i data-testid="vitals" /> }))

function mount() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<p>home page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('RootLayout', () => {
  beforeEach(() => {
    document.head.innerHTML =
      '<link id="app-icon" rel="icon" href="/icon.svg"><link id="app-apple-icon" rel="apple-touch-icon" href="/apple-icon.png">'
  })

  it('renders the matched page inside the app shell', () => {
    vi.mocked(usePathname).mockReturnValue('/')
    mount()

    expect(screen.getByTestId('shell')).toHaveTextContent('home page')
    expect(screen.getByTestId('vitals')).toBeInTheDocument()
  })

  it("uses an app's own icons under its path", () => {
    vi.mocked(usePathname).mockReturnValue('/books/library')
    mount()

    expect(document.getElementById('app-icon')).toHaveAttribute('href', '/icons/books.svg')
    expect(document.getElementById('app-apple-icon')).toHaveAttribute(
      'href',
      '/icons/books-apple.png'
    )
  })

  it('uses the suite icons elsewhere', () => {
    vi.mocked(usePathname).mockReturnValue('/trains')
    mount()

    expect(document.getElementById('app-icon')).toHaveAttribute('href', '/icon.svg')
    expect(document.getElementById('app-apple-icon')).toHaveAttribute('href', '/apple-icon.png')
  })
})
