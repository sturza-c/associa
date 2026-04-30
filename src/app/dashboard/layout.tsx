import { redirect } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserMemberships } from '@/lib/actions/associations'
import { getActiveMembership } from '@/lib/actions/active-association'
import { AssociationProvider } from '@/contexts/association-context'
import { AppSidebar } from '@/components/app-sidebar'
import { CommandPalette } from '@/components/command-palette'
import { SWRProvider } from '@/components/swr-provider'
import type { UserProfile } from '@/types/database'

// Cache member count per association — revalidates every 60s or on revalidatePath
const getCachedMemberCount = unstable_cache(
  async (associationId: string) => {
    const admin = createAdminClient()
    const { count } = await admin
      .from('association_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('association_id', associationId)
      .eq('is_active', true)
    return count ?? 0
  },
  ['member-count'],
  { revalidate: 60, tags: ['member-count'] }
)

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

  const memberCount = activeMembership
    ? await getCachedMemberCount(activeMembership.association_id)
    : 0

  return (
    <SWRProvider>
      <AssociationProvider memberships={memberships}>
        <div className="flex h-screen overflow-hidden bg-background">
          <AppSidebar profile={profile} memberCount={memberCount} />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
          <CommandPalette />
        </div>
      </AssociationProvider>
    </SWRProvider>
  )
}
