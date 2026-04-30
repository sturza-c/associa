'use client'

import useSWR from 'swr'
import { DashboardClient } from '@/features/dashboard/dashboard-client'
import DashboardLoading from './loading'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function DashboardPage() {
  const { data, isLoading } = useSWR('/api/dashboard', fetcher)

  if (isLoading || !data) return <DashboardLoading />

  return <DashboardClient data={data} />
}
