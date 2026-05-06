import { redirect } from 'next/navigation'
import { getActiveMembership } from '@/lib/actions/active-association'
import { CotisationsView } from '@/features/cotisations/cotisations-view'

export default async function CotisationsPage() {
  const activeMembership = await getActiveMembership()
  if (!activeMembership) redirect('/onboarding')

  return (
    <CotisationsView
      associationId={activeMembership.association_id}
      callerRole={activeMembership.role}
      initialData={undefined}
    />
  )
}
