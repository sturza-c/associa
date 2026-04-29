import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/actions/active-association'
import { getMembers } from '@/lib/actions/members'
import { getPendingInvitations } from '@/lib/actions/invitations'
import { MembersClient } from '@/features/members/members-client'
import type { AssociationTitle } from '@/types/database'

export default async function MembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const activeMembership = await getActiveMembership()
  if (!activeMembership) redirect('/onboarding')

  const associationId = activeMembership.association_id

  const [members, invitations] = await Promise.all([
    getMembers(associationId),
    getPendingInvitations(associationId),
  ])

  // Fetch custom postes
  let titles: AssociationTitle[] = []
  const { data: titlesRows, error: titlesError } = await supabase
    .from('association_titles')
    .select('*')
    .eq('association_id', associationId)
    .order('position', { ascending: true })

  if (!titlesError && titlesRows) {
    titles = titlesRows as AssociationTitle[]
  }

  // Fetch title assignments for all members
  const memberTitleMap: Record<string, string[]> = {}
  const memberIds = members.map(m => m.id)
  if (memberIds.length > 0 && titles.length > 0) {
    const { data: assignments } = await supabase
      .from('membership_titles')
      .select('membership_id, title_id')
      .in('membership_id', memberIds)
    for (const a of assignments ?? []) {
      if (!memberTitleMap[a.membership_id]) memberTitleMap[a.membership_id] = []
      memberTitleMap[a.membership_id].push(a.title_id)
    }
  }

  return (
    <MembersClient
      members={members}
      invitations={invitations}
      associationId={associationId}
      callerRole={activeMembership.role}
      currentUserId={user.id}
      titles={titles}
      memberTitleMap={memberTitleMap}
    />
  )
}
