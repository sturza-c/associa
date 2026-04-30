'use client'

import useSWR from 'swr'
import { useAssociation } from '@/contexts/association-context'
import { EventsShell } from './events-shell'
import EventsLoading from '@/app/dashboard/events/loading'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function EventsView() {
  const { activeMembership } = useAssociation()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null))
  }, [])

  const { data, isLoading, mutate } = useSWR(
    activeMembership ? `/api/events?associationId=${activeMembership.association_id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  if (!activeMembership || isLoading || !data || !currentUserId) return <EventsLoading />

  return (
    <EventsShell
      events={data.events ?? []}
      members={data.members ?? []}
      associationId={activeMembership.association_id}
      callerRole={activeMembership.role}
      currentUserId={currentUserId}
      migrationNeeded={data.migrationNeeded ?? false}
      onRefresh={() => mutate()}
    />
  )
}
