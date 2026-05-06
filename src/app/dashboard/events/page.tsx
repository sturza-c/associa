import { redirect } from 'next/navigation'
import { getActiveMembership } from '@/lib/actions/active-association'
import { EventsView } from '@/features/events/events-view'

export default async function EventsPage() {
  const activeMembership = await getActiveMembership()
  if (!activeMembership) redirect('/onboarding')

  return (
    <EventsView
      associationId={activeMembership.association_id}
      callerRole={activeMembership.role}
      currentUserId={activeMembership.user_id}
      initialData={undefined}
    />
  )
}
