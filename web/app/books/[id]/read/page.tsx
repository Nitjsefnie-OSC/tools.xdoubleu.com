import { useRouteParams } from '@/hooks/navigation'
import { Suspense } from 'react'
import ReadBookClient from './ReadBookClient'
import { LoadingState } from '@/components/ui/states'

export default function ReadBookPage() {
  const { id } = useRouteParams<{ id: string }>()
  return (
    <Suspense fallback={<LoadingState className="p-6" />}>
      <ReadBookClient id={id} />
    </Suspense>
  )
}
