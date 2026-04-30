'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useAssociation } from '@/contexts/association-context'
import { CotisationsClient } from './cotisations-client'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function CotisationsView() {
  const { activeMembership, activeAssociation } = useAssociation()
  const [yearOverride, setYearOverride] = useState<number | null>(null)

  const { data, isLoading, mutate } = useSWR(
    activeMembership
      ? `/api/cotisations?associationId=${activeMembership.association_id}${yearOverride ? `&year=${yearOverride}` : ''}`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  if (!activeMembership || isLoading || !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <CotisationsClient
      years={data.years}
      activeYear={data.activeYear}
      members={data.members}
      cotisations={data.cotisations}
      callerRole={data.callerRole}
      associationId={activeMembership.association_id}
      associationName={activeAssociation?.name ?? ''}
      onYearChange={setYearOverride}
      onRefresh={() => mutate()}
    />
  )
}
