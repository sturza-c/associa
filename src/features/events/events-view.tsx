'use client'

import useSWR from 'swr'
import { EventsShell } from './events-shell'
import type { Role } from '@/types/database'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Props {
  associationId: string
  callerRole: Role
  currentUserId: string
  initialData: Record<string, unknown>
}

export function EventsView({ associationId, callerRole, currentUserId, initialData }: Props) {
  const { data, mutate } = useSWR(
    `/api/events?associationId=${associationId}`,
    fetcher,
    { fallbackData: initialData },
  )

  return (
    <EventsShell
      events={data.events ?? []}
      members={data.members ?? []}
      associationId={associationId}
      callerRole={callerRole}
      currentUserId={currentUserId}
      migrationNeeded={data.migrationNeeded ?? false}
      onRefresh={() => mutate()}
    />
  )
}
