'use client'

import useSWR from 'swr'
import { DashboardClient } from './dashboard-client'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Props {
  initialData: Record<string, unknown>
}

export function DashboardView({ initialData }: Props) {
  // fallbackData = server-rendered data → renders instantly, no loading spinner.
  // SWR revalidates in the background to keep data fresh.
  const { data, mutate } = useSWR('/api/dashboard', fetcher, {
    fallbackData: initialData,
  })

  return <DashboardClient data={data} onRefresh={() => mutate()} />
}
