import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/actions/active-association'
import { CotisationsView } from '@/features/cotisations/cotisations-view'

export default async function CotisationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const activeMembership = await getActiveMembership()
  if (!activeMembership) redirect('/onboarding')

  return <CotisationsView />
}
