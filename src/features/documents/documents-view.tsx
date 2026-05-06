'use client'

import useSWR from 'swr'
import { DocumentsClient } from './documents-client'
import { DocumentsSkeleton } from '@/components/ui/skeleton-layouts'
import type { Role } from '@/types/database'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Props {
  associationId: string
  callerRole: Role
  currentUserId: string
  initialData?: Record<string, unknown>
}

export function DocumentsView({ associationId, callerRole, currentUserId, initialData }: Props) {
  const { data, mutate } = useSWR(
    `/api/documents?associationId=${associationId}`,
    fetcher,
    { fallbackData: initialData },
  )

  if (!data) return <DocumentsSkeleton />

  return (
    <DocumentsClient
      documents={data.documents}
      folders={data.folders}
      uploaders={data.uploaders}
      associationId={associationId}
      callerRole={callerRole}
      currentUserId={currentUserId}
      onRefresh={() => mutate()}
    />
  )
}
