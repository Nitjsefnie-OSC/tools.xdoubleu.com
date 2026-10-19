import { render } from '@testing-library/react'
import { usePathname } from '@/hooks/navigation'
import ServiceWorkerRegistrar from '@/components/offline/ServiceWorkerRegistrar'
import { registerServiceWorker, savePageForOffline } from '@/lib/offline/session'

vi.mock('@/hooks/navigation', () => ({ usePathname: vi.fn() }))
vi.mock('@/lib/offline/session', () => ({
  registerServiceWorker: vi.fn(),
  savePageForOffline: vi.fn()
}))

describe('ServiceWorkerRegistrar', () => {
  it('registers once and saves each visited page', () => {
    vi.mocked(usePathname).mockReturnValue('/feeds')
    const { rerender } = render(<ServiceWorkerRegistrar />)

    vi.mocked(usePathname).mockReturnValue('/recipes')
    rerender(<ServiceWorkerRegistrar />)

    expect(registerServiceWorker).toHaveBeenCalledTimes(1)
    expect(savePageForOffline).toHaveBeenCalledTimes(2)
    expect(savePageForOffline).toHaveBeenLastCalledWith(window.location.href)
  })
})
