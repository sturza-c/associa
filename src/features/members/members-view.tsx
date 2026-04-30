'use client'

import useSWR from 'swr'
import { useAssociation } from '@/contexts/association-context'
import { MembersClient } from './members-client'
import MembersLoading from '@/app/dashboard/members/loading'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function MembersView() {
  const { activeMembership, activeAssociation } = useAssociation()
  const { data, mutate } = useSWR(
    activeMembership ? `/api/members?associationId=${activeMembership.association_id}` : null,
    fetcher,
  )

  if (!activeMembership || !data) return <MembersLoading />

  return (
    <MembersClient
      members={data.members}
      invitations={data.invitations}
      associationId={activeMembership.association_id}
      associationName={activeAssociation?.name ?? ''}
      callerRole={activeMembership.role}
      currentUserId={activeMembership.user_id}
      titles={data.titles}
      memberTitleMap={data.memberTitleMap}
      onRefresh={() => mutate()}
    />
  )
}
