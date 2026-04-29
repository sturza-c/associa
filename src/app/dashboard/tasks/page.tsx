import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/actions/active-association'
import { getTasks } from '@/lib/actions/tasks'
import { getMembers } from '@/lib/actions/members'
import { TasksClient } from '@/features/tasks/tasks-client'

export default async function TasksPage() {
  const supabase = await createClient()
  const [{ data: { user } }, activeMembership] = await Promise.all([
    supabase.auth.getUser(),
    getActiveMembership(),
  ])
  if (!user) redirect('/login')
  if (!activeMembership) redirect('/onboarding')

  const [tasks, members] = await Promise.all([
    getTasks(activeMembership.association_id),
    getMembers(activeMembership.association_id),
  ])

  return (
    <TasksClient
      tasks={tasks}
      members={members}
      associationId={activeMembership.association_id}
      callerRole={activeMembership.role}
      currentUserId={user.id}
    />
  )
}
