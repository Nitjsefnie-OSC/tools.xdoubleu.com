import { Suspense } from 'react'
import FeedReaderClient from '@/components/feeds/FeedReaderClient'
import FeedsHeader from '@/components/feeds/FeedsHeader'
import FeedRuleSuggestionsCard from '@/components/feeds/FeedRuleSuggestionsCard'
import { PageContainer } from '@/components/ui/page-container'
import { LoadingState } from '@/components/ui/states'

export default function FeedsPage() {
  return (
    <PageContainer>
      <FeedsHeader />

      <FeedRuleSuggestionsCard className="mb-6" />

      <Suspense fallback={<LoadingState />}>
        <FeedReaderClient />
      </Suspense>
    </PageContainer>
  )
}
