'use client'

import useSWR from 'swr'
import { useAssociation } from '@/contexts/association-context'
import { FinancesShell } from './finances-shell'
import type { Role } from '@/types/database'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface Props {
  associationId: string
  callerRole: Role
  initialData: Record<string, unknown>
}

export function FinancesView({ associationId, callerRole, initialData }: Props) {
  const { activeAssociation } = useAssociation()

  const { data, mutate } = useSWR(
    `/api/finances?associationId=${associationId}`,
    fetcher,
    { fallbackData: initialData },
  )

  return (
    <FinancesShell
      finances={data.finances}
      budgets={data.budgets}
      categories={data.categories}
      associationId={associationId}
      callerRole={callerRole}
      associationName={activeAssociation?.name ?? ''}
      onRefresh={() => mutate()}
    />
  )
}
