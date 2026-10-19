import { useRouteParams } from '@/hooks/navigation'
import SeriesBooksClient from '@/components/books/SeriesBooksClient'

export default function SeriesPage() {
  const { name } = useRouteParams<{ name: string }>()
  const decoded = decodeURIComponent(name)
  return <SeriesBooksClient name={decoded} />
}
