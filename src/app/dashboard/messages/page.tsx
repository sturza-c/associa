import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/actions/active-association'
import { getConversations } from '@/lib/actions/messages'
import { getMembers } from '@/lib/actions/members'
import { MessagesClient } from '@/features/messages/messages-client'

export default async function MessagesPage() {
  const supabase = await createClient()
  const [{ data: { user } }, activeMembership] = await Promise.all([
    supabase.auth.getUser(),
    getActiveMembership(),
  ])
  if (!user) redirect('/login')
  if (!activeMembership) redirect('/onboarding')

  const [conversations, members] = await Promise.all([
    getConversations(activeMembership.association_id),
    getMembers(activeMembership.association_id),
  ])

  return (
    <MessagesClient
      conversations={conversations}
      members={members}
      associationId={activeMembership.association_id}
      currentUserId={user.id}
      callerRole={activeMembership.role}
    />
  )
}
