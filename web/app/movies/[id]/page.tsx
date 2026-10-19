import { useRouteParams } from '@/hooks/navigation'
import MovieTitleClient from '@/components/movies/MovieTitleClient'

export default function MovieTitlePage() {
  const { id } = useRouteParams<{ id: string }>()

  return <MovieTitleClient id={id} />
}
