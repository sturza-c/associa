import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserMemberships } from '@/lib/actions/associations'
import { getActiveMembership } from '@/lib/actions/active-association'
import { AssociationProvider } from '@/contexts/association-context'
import { AppSidebar } from '@/components/app-sidebar'
import { CommandPalette } from '@/components/command-palette'
import type { UserProfile } from '@/types/database'

async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError && !user) redirect('/login')
  if (!user) redirect('/login')

  const [memberships, profile, activeMembership] = await Promise.all([
    getUserMemberships(),
    getUserProfile(user.id),
    getActiveMembership(),
  ])

  if (memberships.length === 0) redirect('/onboarding')
  if (!profile) redirect('/login')

  // Get member count for the active association
  let memberCount = 0
  if (activeMembership) {
    const { count } = await supabase
      .from('association_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('association_id', activeMembership.association_id)
      .eq('is_active', true)
    memberCount = count ?? 0
  }

  return (
    <AssociationProvider memberships={memberships}>
      <div className="flex h-screen overflow-hidden bg-background">
        <AppSidebar profile={profile} memberCount={memberCount} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <CommandPalette />
      </div>
    </AssociationProvider>
  )
}
