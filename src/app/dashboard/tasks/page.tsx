import { redirect } from 'next/navigation'
import { getActiveMembership } from '@/lib/actions/active-association'
import { TasksView } from '@/features/tasks/tasks-view'

export default async function TasksPage() {
  const activeMembership = await getActiveMembership()
  if (!activeMembership) redirect('/onboarding')

  return (
    <TasksView
      associationId={activeMembership.association_id}
      callerRole={activeMembership.role}
      currentUserId={activeMembership.user_id}
      initialData={undefined}
    />
  )
}
