import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/actions/active-association'
import { getConversations } from '@/lib/actions/messages'
import { getTasks } from '@/lib/actions/tasks'
import { getDashboardStats } from '@/lib/actions/dashboard'
import { getEventBudgets } from '@/lib/actions/budgets'
import { DashboardClient } from '@/features/dashboard/dashboard-client'
import type { RoleLabels } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const [{ data: { user } }, activeMembership] = await Promise.all([
    supabase.auth.getUser(),
    getActiveMembership(),
  ])
  if (!user) redirect('/login')
  if (!activeMembership) redirect('/onboarding')

  const [stats, conversations, tasks, budgets] = await Promise.all([
    getDashboardStats(activeMembership.association_id),
    getConversations(activeMembership.association_id),
    getTasks(activeMembership.association_id),
    getEventBudgets(activeMembership.association_id),
  ])

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()
  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  const { data: association } = await supabase
    .from('associations')
    .select('id, name, description, accent_color, created_at, logo_url, role_labels, is_public')
    .eq('id', activeMembership.association_id)
    .single()

  const customRoleLabels = (association?.role_labels as RoleLabels | null) ?? null

  const { data: rolesRows } = await supabase
    .from('association_memberships')
    .select('role')
    .eq('association_id', activeMembership.association_id)
    .eq('is_active', true)

  const roleCounts = {
    president: rolesRows?.filter(r => r.role === 'president').length ?? 0,
    treasurer: rolesRows?.filter(r => r.role === 'treasurer').length ?? 0,
    secretary: rolesRows?.filter(r => r.role === 'secretary').length ?? 0,
    member: rolesRows?.filter(r => r.role === 'member').length ?? 0,
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const today = new Date().toLocaleDateString('fr-CH', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <DashboardClient
      data={{
        firstName,
        greeting,
        today,
        isPresident: activeMembership.role === 'president',
        association: {
          id: association?.id ?? activeMembership.association_id,
          name: association?.name ?? '',
          description: association?.description ?? null,
          logo_url: association?.logo_url ?? null,
          accent_color: association?.accent_color ?? '#6366f1',
          role_labels: customRoleLabels,
          created_at: association?.created_at ?? new Date().toISOString(),
          is_public: association?.is_public ?? false,
        },
        stats,
        roleCounts,
        tasks,
        budgets,
        conversations,
        userId: user.id,
        associationId: activeMembership.association_id,
        callerRole: activeMembership.role,
        customRoleLabels,
      }}
    />
  )
}
