import '@testing-library/jest-dom/vitest'
import { TextEncoder, TextDecoder as NodeTextDecoder } from 'util'

globalThis.TextEncoder = TextEncoder
Object.defineProperty(globalThis, 'TextDecoder', {
  value: NodeTextDecoder,
  writable: true,
  configurable: true
})

// Components render <Link> outside a router in unit tests, so every test gets
// a plain anchor; __tests__/components/ui/link.test.tsx unmocks the real one.
vi.mock('@/components/ui/link', () => ({
  Link: ({ href, children, ...rest }: { href: string; children?: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  useLinkPending: () => false
}))

// Components read router state through @/hooks/navigation; unit tests render
// them without a router, so every test gets an empty location.
// __tests__/hooks/navigation.test.tsx unmocks the real hooks.
vi.mock('@/hooks/navigation', () => {
  const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn() }
  return {
    useRouter: vi.fn(() => router),
    usePathname: vi.fn(() => '/'),
    useSearchParams: vi.fn(() => new URLSearchParams()),
    useRouteParams: vi.fn(() => ({}))
  }
})

// Testing Library's waitFor/findBy only advance fake timers when it sees
// Jest's global; Vitest's clock is compatible with the same call.
Object.assign(globalThis, { jest: { advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms) } })
