'use client'

import useSWR from 'swr'
import { MessagesClient } from './messages-client'
import { MessagesSkeleton } from '@/components/ui/skeleton-layouts'
import type { Role } from '@/types/database'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Props {
  associationId: string
  callerRole: Role
  currentUserId: string
  initialData?: Record<string, unknown>
}

export function MessagesView({ associationId, callerRole, currentUserId, initialData }: Props) {
  const { data } = useSWR(
    `/api/messages?associationId=${associationId}`,
    fetcher,
    { fallbackData: initialData },
  )

  if (!data) return <MessagesSkeleton />

  return (
    <MessagesClient
      conversations={data.conversations}
      members={data.members}
      associationId={associationId}
      currentUserId={currentUserId}
      callerRole={callerRole}
    />
  )
}
