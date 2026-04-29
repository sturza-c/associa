'use client'

import useSWR from 'swr'
import { useAssociation } from '@/contexts/association-context'
import { MessagesClient } from './messages-client'
import MessagesLoading from '@/app/dashboard/messages/loading'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function MessagesView() {
  const { activeMembership } = useAssociation()
  const { data, isLoading } = useSWR(
    activeMembership ? `/api/messages?associationId=${activeMembership.association_id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  if (!activeMembership || isLoading || !data) return <MessagesLoading />

  return (
    <MessagesClient
      conversations={data.conversations}
      members={data.members}
      associationId={activeMembership.association_id}
      currentUserId={activeMembership.user_id}
      callerRole={activeMembership.role}
    />
  )
}
