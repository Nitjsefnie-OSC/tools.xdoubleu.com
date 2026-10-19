import { useRouteParams } from '@/hooks/navigation'
import SteamGameClient from './SteamGameClient'

export default function SteamGamePage() {
  const { id } = useRouteParams<{ id: string }>()

  return <SteamGameClient id={id} />
}
