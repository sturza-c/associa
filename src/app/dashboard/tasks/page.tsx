import { redirect } from 'next/navigation'
import { getActiveMembership } from '@/lib/actions/active-association'
import { getTasks } from '@/lib/actions/tasks'
import { getMembers } from '@/lib/actions/members'
import { TasksView } from '@/features/tasks/tasks-view'

export default async function TasksPage() {
  const activeMembership = await getActiveMembership()
  if (!activeMembership) redirect('/onboarding')

  const associationId = activeMembership.association_id
  const [tasks, members] = await Promise.all([
    getTasks(associationId),
    getMembers(associationId),
  ])

  return (
    <TasksView
      associationId={associationId}
      callerRole={activeMembership.role}
      currentUserId={activeMembership.user_id}
      initialData={{ tasks, members }}
    />
  )
}
