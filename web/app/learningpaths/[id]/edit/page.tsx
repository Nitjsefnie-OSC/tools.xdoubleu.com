import { useRouteParams } from '@/hooks/navigation'
import EditLearningPathClient from './EditLearningPathClient'

export default function EditLearningPathPage() {
  const { id } = useRouteParams<{ id: string }>()

  return <EditLearningPathClient id={id} />
}
