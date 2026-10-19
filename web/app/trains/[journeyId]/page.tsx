import { useRouteParams } from '@/hooks/navigation'
import JourneyDetailClient from '@/components/trains/JourneyDetailClient'

export default function JourneyDetailPage() {
  const { journeyId } = useRouteParams<{ journeyId: string }>()

  return <JourneyDetailClient journeyId={journeyId} />
}
