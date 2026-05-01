import { redirect } from 'next/navigation'
import { getActiveMembership } from '@/lib/actions/active-association'
import { getTasks } from '@/lib/actions/tasks'
import { getMembers } from '@/lib/actions/members'
import { getTaskGroups } from '@/lib/actions/task-groups'
import { TasksView } from '@/features/tasks/tasks-view'

export default async function TasksPage() {
  const activeMembership = await getActiveMembership()
  if (!activeMembership) redirect('/onboarding')

  const associationId = activeMembership.association_id
  const [tasks, members, groups] = await Promise.all([
    getTasks(associationId),
    getMembers(associationId),
    getTaskGroups(associationId),
  ])

  return (
    <TasksView
      associationId={associationId}
      callerRole={activeMembership.role}
      currentUserId={activeMembership.user_id}
      initialData={{ tasks, members, groups }}
    />
  )
}
