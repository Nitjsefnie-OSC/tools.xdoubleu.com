import { useRouteParams } from '@/hooks/navigation'
import MealPlanClient from './MealPlanClient'

export default function MealPlanPage() {
  const { id } = useRouteParams<{ id: string }>()

  return <MealPlanClient id={id} />
}
