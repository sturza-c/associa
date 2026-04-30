'use client'

import useSWR from 'swr'
import { useAssociation } from '@/contexts/association-context'
import { TasksClient } from './tasks-client'
import TasksLoading from '@/app/dashboard/tasks/loading'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function TasksView() {
  const { activeMembership } = useAssociation()
  const { data, isLoading } = useSWR(
    activeMembership ? `/api/tasks?associationId=${activeMembership.association_id}` : null,
    fetcher,
    {}
  )

  if (!activeMembership || !data) return <TasksLoading />

  return (
    <TasksClient
      tasks={data.tasks}
      members={data.members}
      associationId={activeMembership.association_id}
      callerRole={activeMembership.role}
      currentUserId={activeMembership.user_id}
    />
  )
}
