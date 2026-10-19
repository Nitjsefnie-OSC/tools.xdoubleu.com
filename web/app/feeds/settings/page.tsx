import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import FeedFilterRulesCard from '@/components/feeds/FeedFilterRulesCard'
import FeedsNotificationSettingsCard from '@/components/feeds/FeedsNotificationSettingsCard'

export default function FeedsSettingsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Feed Settings"
        breadcrumb={[{ label: 'Feeds', href: '/feeds' }, { label: 'Settings' }]}
      />

      <div className="space-y-6">
        <FeedFilterRulesCard />
        <FeedsNotificationSettingsCard />
      </div>
    </PageContainer>
  )
}
