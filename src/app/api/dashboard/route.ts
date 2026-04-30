import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveMembership } from '@/lib/actions/active-association'
import { getDashboardStats } from '@/lib/actions/dashboard'
import { getConversations } from '@/lib/actions/messages'
import { getTasks } from '@/lib/actions/tasks'
import { getEventBudgets } from '@/lib/actions/budgets'
import type { RoleLabels } from '@/types/database'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const activeMembership = await getActiveMembership()
  if (!activeMembership) return NextResponse.json({ error: 'No membership' }, { status: 403 })

  const associationId = activeMembership.association_id
  const admin = createAdminClient()

  const [stats, conversations, tasks, budgets, profileRow, associationRow, rolesRows] =
    await Promise.all([
      getDashboardStats(associationId),
      getConversations(associationId),
      getTasks(associationId),
      getEventBudgets(associationId),
      admin.from('user_profiles').select('full_name').eq('id', user.id).single(),
      admin.from('associations')
        .select('id, name, description, accent_color, created_at, logo_url, role_labels, is_public')
        .eq('id', associationId).single(),
      admin.from('association_memberships')
        .select('role').eq('association_id', associationId).eq('is_active', true),
    ])

  const firstName = profileRow.data?.full_name?.split(' ')[0] ?? ''
  const association = associationRow.data
  const customRoleLabels = (association?.role_labels as RoleLabels | null) ?? null
  const roles = rolesRows.data ?? []

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const today = new Date().toLocaleDateString('fr-CH', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return NextResponse.json({
    firstName,
    greeting,
    today,
    isPresident: activeMembership.role === 'president',
    association: {
      id: association?.id ?? associationId,
      name: association?.name ?? '',
      description: association?.description ?? null,
      logo_url: association?.logo_url ?? null,
      accent_color: association?.accent_color ?? '#6366f1',
      role_labels: customRoleLabels,
      created_at: association?.created_at ?? new Date().toISOString(),
      is_public: association?.is_public ?? false,
    },
    stats,
    roleCounts: {
      president: roles.filter(r => r.role === 'president').length,
      treasurer: roles.filter(r => r.role === 'treasurer').length,
      secretary: roles.filter(r => r.role === 'secretary').length,
      member: roles.filter(r => r.role === 'member').length,
    },
    tasks,
    budgets,
    conversations,
    userId: user.id,
    associationId,
    callerRole: activeMembership.role,
    customRoleLabels,
  })
}
