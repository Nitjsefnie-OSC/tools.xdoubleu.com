import OfflineBooksSync from '@/components/books/OfflineBooksSync'
import DeployNotification from '@/components/DeployNotification'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import OfflineBanner from '@/components/offline/OfflineBanner'
import OutboxSync from '@/components/offline/OutboxSync'
import ServiceWorkerRegistrar from '@/components/offline/ServiceWorkerRegistrar'
import SWRProvider, { useSessionEffects } from '@/components/SWRProvider'
import { useCurrentUser } from '@/hooks/useAuth'

function Shell({ children }: { children: React.ReactNode }) {
  const { data: currentUser } = useCurrentUser()
  useSessionEffects(currentUser?.userId)

  const booksAccess =
    currentUser !== undefined &&
    (currentUser.role === 'admin' || currentUser.appAccess.includes('books'))

  return (
    <>
      <Navbar />
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10">
        <div className="w-full">
          <OfflineBanner />
          {children}
        </div>
      </main>
      <Footer />
      <DeployNotification />
      <ServiceWorkerRegistrar />
      <OutboxSync />
      {booksAccess && <OfflineBooksSync />}
    </>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SWRProvider>
      <Shell>{children}</Shell>
    </SWRProvider>
  )
}
