import { useRouteParams } from '@/hooks/navigation'
import EditPlanClient from './EditPlanClient'

export default function EditPlanPage() {
  const { id } = useRouteParams<{ id: string }>()

  return <EditPlanClient id={id} />
}
