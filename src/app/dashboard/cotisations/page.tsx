import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveMembership } from '@/lib/actions/active-association'
import { CotisationsView } from '@/features/cotisations/cotisations-view'

export default async function CotisationsPage() {
  const activeMembership = await getActiveMembership()
  if (!activeMembership) redirect('/onboarding')

  const associationId = activeMembership.association_id
  const admin = createAdminClient()

  const { data: yearsData } = await admin
    .from('cotisations').select('year').eq('association_id', associationId).order('year', { ascending: false })

  const years: number[] = [...new Set((yearsData ?? []).map(r => r.year as number))]
  const activeYear = years[0] ?? new Date().getFullYear()

  const [membersRes, cotisationsRes] = await Promise.all([
    admin.from('association_memberships')
      .select('id, user_id, role, joined_at, user_profiles(full_name, email, avatar_url)')
      .eq('association_id', associationId).eq('is_active', true),
    years.length > 0
      ? admin.from('cotisations')
          .select('id, membership_id, external_name, external_email, year, amount_due, amount_paid, paid_at, payment_method, notes, updated_at')
          .eq('association_id', associationId).eq('year', activeYear)
      : Promise.resolve({ data: [] as unknown[] }),
  ])

  return (
    <CotisationsView
      associationId={associationId}
      callerRole={activeMembership.role}
      initialData={{
        years,
        activeYear,
        members: membersRes.data ?? [],
        cotisations: cotisationsRes.data ?? [],
        callerRole: activeMembership.role,
      }}
    />
  )
}
