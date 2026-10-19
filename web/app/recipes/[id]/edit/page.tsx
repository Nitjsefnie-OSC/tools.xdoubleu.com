import { useRouteParams } from '@/hooks/navigation'
import EditRecipeClient from './EditRecipeClient'

export default function EditRecipePage() {
  const { id } = useRouteParams<{ id: string }>()

  return <EditRecipeClient id={id} />
}
