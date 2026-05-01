'use client'

import useSWR from 'swr'
import { TasksClient } from './tasks-client'
import type { Role, TaskGroupWithMembers } from '@/types/database'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Props {
  associationId: string
  callerRole: Role
  currentUserId: string
  initialData: Record<string, unknown>
}

export function TasksView({ associationId, callerRole, currentUserId, initialData }: Props) {
  const { data, mutate } = useSWR(
    `/api/tasks?associationId=${associationId}`,
    fetcher,
    { fallbackData: initialData },
  )

  return (
    <TasksClient
      tasks={data.tasks}
      members={data.members}
      groups={(data.groups ?? []) as TaskGroupWithMembers[]}
      associationId={associationId}
      callerRole={callerRole}
      currentUserId={currentUserId}
      onRefresh={() => mutate()}
    />
  )
}
