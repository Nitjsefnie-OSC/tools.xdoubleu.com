import { useRouteParams } from '@/hooks/navigation'
import QuizClient from './QuizClient'

export default function ModuleQuizPage() {
  const { id, moduleId } = useRouteParams<{ id: string; moduleId: string }>()

  return <QuizClient id={id} moduleId={moduleId} />
}
