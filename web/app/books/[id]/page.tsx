import { useRouteParams } from '@/hooks/navigation'
import { Suspense } from 'react'
import BookDetailClient from './BookDetailClient'
import { LoadingState } from '@/components/ui/states'

export default function BookDetailPage() {
  const { id } = useRouteParams<{ id: string }>()
  return (
    <Suspense fallback={<LoadingState className="p-6" />}>
      <BookDetailClient id={id} />
    </Suspense>
  )
}
