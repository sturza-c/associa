import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/actions/active-association'
import { EventsView } from '@/features/events/events-view'

export default async function EventsPage() {
  const activeMembership = await getActiveMembership()
  if (!activeMembership) redirect('/onboarding')

  const associationId = activeMembership.association_id
  const supabase = await createClient()

  const [eventsRes, membersRes] = await Promise.all([
    supabase.from('events')
      .select(`*, participants:event_participants(*, user_profiles(id, full_name, email, avatar_url)), budget_items:event_budget_items(*), tasks:event_tasks(*)`)
      .eq('association_id', associationId)
      .order('event_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase.from('association_memberships')
      .select('user_id, role, user_profiles(id, full_name, email, avatar_url)')
      .eq('association_id', associationId).eq('is_active', true),
  ])

  const migrationNeeded = eventsRes.error?.code === '42P01'

  return (
    <EventsView
      associationId={associationId}
      callerRole={activeMembership.role}
      currentUserId={activeMembership.user_id}
      initialData={{
        events: migrationNeeded ? [] : (eventsRes.data ?? []),
        members: membersRes.data ?? [],
        migrationNeeded,
      }}
    />
  )
}
