import { useRouteParams } from '@/hooks/navigation'
import GamesDashboardPublicGameClient from '@/components/dashboard/GamesDashboardPublicGameClient'

export default function GamesDashboardPublicGamePage() {
  const { token, id } = useRouteParams<{ token: string; id: string }>()

  return <GamesDashboardPublicGameClient token={token} id={id} />
}
