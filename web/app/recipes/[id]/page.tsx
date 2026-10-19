import { useRouteParams } from '@/hooks/navigation'
import RecipeClient from './RecipeClient'

export default function RecipePage() {
  const { id } = useRouteParams<{ id: string }>()

  return <RecipeClient id={id} />
}
