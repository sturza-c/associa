'use client'

import useSWR from 'swr'
import { useAssociation } from '@/contexts/association-context'
import { DashboardSkeleton } from '@/components/ui/skeleton-layouts'
import { DashboardClient } from './dashboard-client'

// Throw on non-2xx so SWR keeps the last good data instead of replacing it
// with an `{ error }` payload that DashboardClient can't render.
const fetcher = async (url: string) => {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`GET ${url} → ${r.status}`)
  return r.json()
}

interface Props {
  initialData: Record<string, unknown>
}

export function DashboardView({ initialData }: Props) {
  const { activeMembership, activeAssociation } = useAssociation()
  const associationId = activeMembership?.association_id ?? (initialData.associationId as string)
  const initialId = initialData.associationId as string

  // Only use SSR fallback when we're still on the same association that was
  // server-rendered. For any other association we'd show stale logo / data
  // from the wrong association until the fetch resolves.
  const { data, mutate } = useSWR(
    `/api/dashboard?associationId=${associationId}`,
    fetcher,
    { fallbackData: associationId === initialId ? initialData : undefined },
  )

  // While the new association's data is loading, patch in the correct logo
  // from the context (which switches synchronously) to avoid showing the
  // previous association's photo.
  const patchedData = data
    ? {
        ...data,
        association: {
          ...(data.association as Record<string, unknown> ?? {}),
          logo_url: activeAssociation?.logo_url
            ?? (data.association as Record<string, unknown>)?.logo_url
            ?? null,
        },
      }
    : undefined

  // No data yet (e.g. just switched association, no SSR fallback): show the
  // skeleton rather than rendering DashboardClient with undefined props.
  if (!patchedData) return <DashboardSkeleton />

  return <DashboardClient data={patchedData} onRefresh={() => mutate()} />
}
