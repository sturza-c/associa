import { redirect } from 'next/navigation'
import { getActiveMembership } from '@/lib/actions/active-association'
import { MessagesView } from '@/features/messages/messages-view'

export default async function MessagesPage() {
  const activeMembership = await getActiveMembership()
  if (!activeMembership) redirect('/onboarding')

  return (
    <MessagesView
      associationId={activeMembership.association_id}
      callerRole={activeMembership.role}
      currentUserId={activeMembership.user_id}
      initialData={undefined}
    />
  )
}
