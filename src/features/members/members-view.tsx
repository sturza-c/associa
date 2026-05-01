'use client'

import useSWR from 'swr'
import { MembersClient } from './members-client'
import type { AssociationTitle, Role } from '@/types/database'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Props {
  associationId: string
  callerRole: Role
  currentUserId: string
  initialData: Record<string, unknown>
}

export function MembersView({ associationId, callerRole, currentUserId, initialData }: Props) {
  const { data, mutate } = useSWR(
    `/api/members?associationId=${associationId}`,
    fetcher,
    { fallbackData: initialData },
  )

  return (
    <MembersClient
      members={data.members}
      invitations={data.invitations}
      associationId={associationId}
      associationName={''}
      callerRole={callerRole}
      currentUserId={currentUserId}
      titles={data.titles as AssociationTitle[]}
      memberTitleMap={data.memberTitleMap}
      onRefresh={() => mutate()}
    />
  )
}
