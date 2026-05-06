import { redirect } from 'next/navigation'
import { getActiveMembership } from '@/lib/actions/active-association'
import { DocumentsView } from '@/features/documents/documents-view'

export default async function DocumentsPage() {
  const activeMembership = await getActiveMembership()
  if (!activeMembership) redirect('/onboarding')

  return (
    <DocumentsView
      associationId={activeMembership.association_id}
      callerRole={activeMembership.role}
      currentUserId={activeMembership.user_id}
      initialData={undefined}
    />
  )
}
