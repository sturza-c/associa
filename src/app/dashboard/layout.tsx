import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { AssociationProvider } from '@/contexts/association-context'
import { AppSidebar } from '@/components/app-sidebar'
import { CommandPalette } from '@/components/command-palette'
import { SWRProvider } from '@/components/swr-provider'
import type { UserProfile, MembershipWithAssociation } from '@/types/database'

// ── Cached data fetchers (admin client = no JWT roundtrip, 60 s TTL) ──────────

const getCachedMemberships = unstable_cache(
  async (userId: string): Promise<MembershipWithAssociation[]> => {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('association_memberships')
      .select('*, associations(*)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('joined_at', { ascending: true })
    if (error) return []
    return data as MembershipWithAssociation[]
  },
  ['layout-memberships'],
  { revalidate: 60, tags: ['memberships'] }
)

const getCachedProfile = unstable_cache(
  async (userId: string): Promise<UserProfile | null> => {
    const admin = createAdminClient()
    const { data } = await admin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return data as UserProfile | null
  },
  ['layout-profile'],
  { revalidate: 60, tags: ['user-profile'] }
)

const getCachedMemberCount = unstable_cache(
  async (associationId: string): Promise<number> => {
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

// ── Layout ────────────────────────────────────────────────────────────────────

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // userId is stamped by middleware after validating the JWT — no auth.getUser() needed here
  const headerStore = await headers()
  const userId = headerStore.get('x-user-id')
  if (!userId) redirect('/login')

  // Read the active association cookie to find the default selection
  const cookieStore = await cookies()
  const activeAssocId = cookieStore.get('associa_active_id')?.value ?? null

  const [memberships, profile] = await Promise.all([
    getCachedMemberships(userId),
    getCachedProfile(userId),
  ])

  if (memberships.length === 0) redirect('/onboarding')
  if (!profile) redirect('/login')

  const activeMembership =
    (activeAssocId ? memberships.find(m => m.association_id === activeAssocId) : null)
    ?? memberships[0]

  const memberCount = activeMembership
    ? await getCachedMemberCount(activeMembership.association_id)
    : 0

  return (
    <SWRProvider>
      <AssociationProvider memberships={memberships} defaultAssociationId={activeMembership?.association_id}>
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
