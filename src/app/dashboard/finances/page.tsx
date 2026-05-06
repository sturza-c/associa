import { redirect } from 'next/navigation'
import { getActiveMembership } from '@/lib/actions/active-association'
import { FinancesView } from '@/features/finances/finances-view'

export default async function FinancesPage() {
  const activeMembership = await getActiveMembership()
  if (!activeMembership) redirect('/onboarding')

  return (
    <FinancesView
      associationId={activeMembership.association_id}
      callerRole={activeMembership.role}
      initialData={undefined}
    />
  )
}
