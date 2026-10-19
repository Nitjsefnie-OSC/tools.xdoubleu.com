import { useRouteParams } from '@/hooks/navigation'
import PathClient from './PathClient'

export default function LearningPathPage() {
  const { id } = useRouteParams<{ id: string }>()

  return <PathClient id={id} />
}
