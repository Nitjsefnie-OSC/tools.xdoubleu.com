import { useRouteParams } from '@/hooks/navigation'
import AuthorBooksClient from '@/components/books/AuthorBooksClient'

export default function AuthorBooksPage() {
  const { name } = useRouteParams<{ name: string }>()
  const decoded = decodeURIComponent(name)
  return <AuthorBooksClient name={decoded} />
}
