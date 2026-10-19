import { useRouteParams } from '@/hooks/navigation'
import ViewerClient from './ViewerClient'

export default function ViewerPage() {
  const { id } = useRouteParams<{ id: string }>()
  return <ViewerClient id={id} />
}
