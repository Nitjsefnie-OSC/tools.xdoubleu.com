import { render } from '@testing-library/react'
import ServiceWorkerRegistrar from '@/components/offline/ServiceWorkerRegistrar'
import { registerServiceWorker } from '@/lib/offline/session'

vi.mock('@/lib/offline/session', () => ({ registerServiceWorker: vi.fn() }))

describe('ServiceWorkerRegistrar', () => {
  it('registers the worker once', () => {
    const { rerender } = render(<ServiceWorkerRegistrar />)
    rerender(<ServiceWorkerRegistrar />)

    expect(registerServiceWorker).toHaveBeenCalledTimes(1)
  })
})
