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
