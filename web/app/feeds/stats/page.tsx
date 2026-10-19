import { Suspense } from 'react'
import FeedStatsClient from '@/components/feeds/FeedStatsClient'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { LoadingState } from '@/components/ui/states'

export default function FeedStatsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Feed Stats"
        breadcrumb={[{ label: 'Feeds', href: '/feeds' }, { label: 'Stats' }]}
      />

      <Suspense fallback={<LoadingState />}>
        <FeedStatsClient />
      </Suspense>
    </PageContainer>
  )
}
