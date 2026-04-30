'use client'

import useSWR from 'swr'
import { useAssociation } from '@/contexts/association-context'
import { DocumentsClient } from './documents-client'
import DocumentsLoading from '@/app/dashboard/documents/loading'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function DocumentsView() {
  const { activeMembership } = useAssociation()
  const { data, isLoading, mutate } = useSWR(
    activeMembership ? `/api/documents?associationId=${activeMembership.association_id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  if (!activeMembership || isLoading || !data) return <DocumentsLoading />

  return (
    <DocumentsClient
      documents={data.documents}
      folders={data.folders}
      uploaders={data.uploaders}
      associationId={activeMembership.association_id}
      callerRole={activeMembership.role}
      currentUserId={activeMembership.user_id}
      onRefresh={() => mutate()}
    />
  )
}
