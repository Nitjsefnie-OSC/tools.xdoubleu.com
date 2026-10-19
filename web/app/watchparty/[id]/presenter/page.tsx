import { useRouteParams } from '@/hooks/navigation'
import PresenterClient from './PresenterClient'

export default function PresenterPage() {
  const { id } = useRouteParams<{ id: string }>()
  return <PresenterClient id={id} />
}
