import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/actions/active-association'
import { SettingsClient } from '@/features/settings/settings-client'
import type {
  Association,
  AssociationTitle,
  RoleLabels,
  Role,
} from '@/types/database'

interface MemberWithTitles {
  membership_id: string
  user_id: string
  role: Role
  full_name: string | null
  email: string
  avatar_url: string | null
  title_ids: string[]
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const activeMembership = await getActiveMembership()
  if (!activeMembership) redirect('/onboarding')

  // Identity
  const { data: associationRow } = await supabase
    .from('associations')
    .select('id, name, description, logo_url, accent_color, role_labels, slug, is_public, created_at, updated_at')
    .eq('id', activeMembership.association_id)
    .single()

  const association: Association = {
    id: associationRow?.id ?? activeMembership.association_id,
    name: associationRow?.name ?? '',
    description: associationRow?.description ?? null,
    logo_url: associationRow?.logo_url ?? null,
    accent_color: associationRow?.accent_color ?? '#6366f1',
    role_labels: (associationRow?.role_labels as RoleLabels | null) ?? null,
    slug: associationRow?.slug ?? null,
    is_public: associationRow?.is_public ?? false,
    created_at: associationRow?.created_at ?? new Date().toISOString(),
    updated_at: associationRow?.updated_at ?? new Date().toISOString(),
  }

  // Titles
  let titles: AssociationTitle[] = []
  const { data: titlesRows, error: titlesError } = await supabase
    .from('association_titles')
    .select('*')
    .eq('association_id', activeMembership.association_id)
    .order('position', { ascending: true })

  if (!titlesError && titlesRows) {
    titles = titlesRows as AssociationTitle[]
  } else if (titlesError && titlesError.code !== '42P01' && titlesError.code !== 'PGRST205') {
    console.error('settings titles error:', titlesError.message)
  }

  // Current user's own profile (for avatar + name editing)
  const { data: currentProfile } = await supabase
    .from('user_profiles')
    .select('full_name, avatar_url, email')
    .eq('id', user.id)
    .single()

  // Members + assigned titles
  const { data: memberships } = await supabase
    .from('association_memberships')
    .select('id, user_id, role, user_profiles(full_name, email, avatar_url)')
    .eq('association_id', activeMembership.association_id)
    .eq('is_active', true)

  const membershipIds = (memberships ?? []).map(m => m.id)
  const titleAssignments: Record<string, string[]> = {}

  if (membershipIds.length > 0 && titles.length > 0) {
    const { data: assignments } = await supabase
      .from('membership_titles')
      .select('membership_id, title_id')
      .in('membership_id', membershipIds)
    for (const a of assignments ?? []) {
      if (!titleAssignments[a.membership_id]) titleAssignments[a.membership_id] = []
      titleAssignments[a.membership_id].push(a.title_id)
    }
  }

  const members: MemberWithTitles[] = (memberships ?? []).map(m => {
    const profile = Array.isArray(m.user_profiles) ? m.user_profiles[0] : m.user_profiles
    return {
      membership_id: m.id,
      user_id: m.user_id,
      role: m.role as Role,
      full_name: profile?.full_name ?? null,
      email: profile?.email ?? '',
      avatar_url: profile?.avatar_url ?? null,
      title_ids: titleAssignments[m.id] ?? [],
    }
  })

  return (
    <SettingsClient
      association={association}
      titles={titles}
      members={members}
      currentUserId={user.id}
      currentUserProfile={{
        full_name: currentProfile?.full_name ?? null,
        avatar_url: currentProfile?.avatar_url ?? null,
        email: currentProfile?.email ?? user.email ?? '',
      }}
      callerRole={activeMembership.role}
    />
  )
}
