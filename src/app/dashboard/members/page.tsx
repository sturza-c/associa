import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/actions/active-association'
import { getMembers } from '@/lib/actions/members'
import { getPendingInvitations } from '@/lib/actions/invitations'
import { MembersView } from '@/features/members/members-view'
import type { AssociationTitle } from '@/types/database'

export default async function MembersPage() {
  const activeMembership = await getActiveMembership()
  if (!activeMembership) redirect('/onboarding')

  const associationId = activeMembership.association_id
  const supabase = await createClient()

  const [members, invitations, titlesRes] = await Promise.all([
    getMembers(associationId),
    getPendingInvitations(associationId),
    supabase.from('association_titles')
      .select('*').eq('association_id', associationId).order('position', { ascending: true }),
  ])

  const titles: AssociationTitle[] = (!titlesRes.error && titlesRes.data)
    ? titlesRes.data as AssociationTitle[]
    : []

  const memberTitleMap: Record<string, string[]> = {}
  if (members.length > 0 && titles.length > 0) {
    const { data: assignments } = await supabase
      .from('membership_titles').select('membership_id, title_id')
      .in('membership_id', members.map(m => m.id))
    for (const a of assignments ?? []) {
      if (!memberTitleMap[a.membership_id]) memberTitleMap[a.membership_id] = []
      memberTitleMap[a.membership_id].push(a.title_id)
    }
  }

  return (
    <MembersView
      associationId={associationId}
      callerRole={activeMembership.role}
      currentUserId={activeMembership.user_id}
      initialData={{ members, invitations, titles, memberTitleMap }}
    />
  )
}
