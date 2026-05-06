import { redirect } from 'next/navigation'
import { getActiveMembership } from '@/lib/actions/active-association'
import { MembersView } from '@/features/members/members-view'

export default async function MembersPage() {
  const activeMembership = await getActiveMembership()
  if (!activeMembership) redirect('/onboarding')

  return (
    <MembersView
      associationId={activeMembership.association_id}
      callerRole={activeMembership.role}
      currentUserId={activeMembership.user_id}
      initialData={undefined}
    />
  )
}
