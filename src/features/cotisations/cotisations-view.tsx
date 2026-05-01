'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useAssociation } from '@/contexts/association-context'
import { CotisationsClient } from './cotisations-client'
import type { Role } from '@/types/database'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Props {
  associationId: string
  callerRole: Role
  initialData: Record<string, unknown>
}

export function CotisationsView({ associationId, callerRole, initialData }: Props) {
  const { activeAssociation } = useAssociation()
  const [yearOverride, setYearOverride] = useState<number | null>(null)

  const { data, mutate } = useSWR(
    `/api/cotisations?associationId=${associationId}${yearOverride ? `&year=${yearOverride}` : ''}`,
    fetcher,
    // Only use fallbackData when no year override — year changes always need a fresh fetch
    { fallbackData: yearOverride ? undefined : initialData },
  )

  if (!data) return (
    <div className="h-full flex items-center justify-center">
      <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  )

  return (
    <CotisationsClient
      years={data.years}
      activeYear={data.activeYear}
      members={data.members}
      cotisations={data.cotisations}
      callerRole={callerRole}
      associationId={associationId}
      associationName={activeAssociation?.name ?? ''}
      onYearChange={setYearOverride}
      onRefresh={() => mutate()}
    />
  )
}
