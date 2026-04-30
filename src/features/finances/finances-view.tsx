'use client'

import useSWR from 'swr'
import { useAssociation } from '@/contexts/association-context'
import { FinancesShell } from './finances-shell'
import FinancesLoading from '@/app/dashboard/finances/loading'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function FinancesView() {
  const { activeMembership, activeAssociation } = useAssociation()
  const { data, isLoading, mutate } = useSWR(
    activeMembership ? `/api/finances?associationId=${activeMembership.association_id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  if (!activeMembership || isLoading || !data) return <FinancesLoading />

  return (
    <FinancesShell
      finances={data.finances}
      budgets={data.budgets}
      categories={data.categories}
      associationId={activeMembership.association_id}
      callerRole={activeMembership.role}
      associationName={activeAssociation?.name ?? ''}
      onRefresh={() => mutate()}
    />
  )
}
