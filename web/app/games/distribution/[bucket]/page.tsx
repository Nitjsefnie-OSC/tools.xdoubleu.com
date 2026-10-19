import { useRouteParams } from '@/hooks/navigation'
import SteamDistributionClient from './SteamDistributionClient'

export default function Page() {
  const { bucket } = useRouteParams<{ bucket: string }>()

  return <SteamDistributionClient bucket={bucket} />
}
