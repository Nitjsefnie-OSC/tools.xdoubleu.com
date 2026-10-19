import { useRouteParams } from '@/hooks/navigation'
import ExternalBookDetailClient from './ExternalBookDetailClient'

export default function ExternalBookDetailPage() {
  const { provider, providerId } = useRouteParams<{ provider: string; providerId: string }>()

  return <ExternalBookDetailClient provider={provider} providerId={providerId} />
}
