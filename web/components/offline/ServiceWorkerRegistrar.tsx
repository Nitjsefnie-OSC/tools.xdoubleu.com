import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/offline/session'

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return null
}
