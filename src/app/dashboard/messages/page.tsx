import { redirect } from 'next/navigation'
import { getActiveMembership } from '@/lib/actions/active-association'
import { getConversations } from '@/lib/actions/messages'
import { getMembers } from '@/lib/actions/members'
import { MessagesView } from '@/features/messages/messages-view'

export default async function MessagesPage() {
  const activeMembership = await getActiveMembership()
  if (!activeMembership) redirect('/onboarding')

  const associationId = activeMembership.association_id
  const [conversations, members] = await Promise.all([
    getConversations(associationId),
    getMembers(associationId),
  ])

  return (
    <MessagesView
      associationId={associationId}
      callerRole={activeMembership.role}
      currentUserId={activeMembership.user_id}
      initialData={{ conversations, members }}
    />
  )
}
