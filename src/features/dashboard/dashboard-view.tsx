'use client'

import useSWR from 'swr'
import { useAssociation } from '@/contexts/association-context'
import { DashboardClient } from './dashboard-client'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Props {
  initialData: Record<string, unknown>
}

export function DashboardView({ initialData }: Props) {
  const { activeMembership } = useAssociation()
  // Include associationId in the SWR key so switching association triggers a refetch
  const associationId = activeMembership?.association_id ?? (initialData.associationId as string)
  const { data, mutate } = useSWR(
    `/api/dashboard?associationId=${associationId}`,
    fetcher,
    { fallbackData: initialData },
  )

  return <DashboardClient data={data} onRefresh={() => mutate()} />
}
