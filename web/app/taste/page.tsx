import TasteClient from '@/components/taste/TasteClient'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'

export default function TastePage() {
  return (
    <PageContainer>
      <PageHeader title="Taste" />
      <TasteClient />
    </PageContainer>
  )
}
