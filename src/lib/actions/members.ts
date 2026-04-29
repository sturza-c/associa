'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { MembershipWithProfile, Role } from '@/types/database'

export async function getMembers(associationId: string): Promise<MembershipWithProfile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('association_memberships')
    .select('*, user_profiles(*)')
    .eq('association_id', associationId)
    .eq('is_active', true)
    .order('joined_at', { ascending: true })

  if (error) {
    console.error('getMembers error:', error)
    return []
  }
  return data as MembershipWithProfile[]
}

async function getCallerRole(associationId: string): Promise<Role | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('association_memberships')
    .select('role')
    .eq('association_id', associationId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  return (data?.role as Role) ?? null
}

export async function updateMemberRole(
  membershipId: string,
  associationId: string,
  newRole: Role
) {
  const callerRole = await getCallerRole(associationId)
  if (callerRole !== 'president') return { error: 'Seul le président peut modifier les rôles' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Prevent president from demoting themselves if they're the only president
  const { data: membership } = await supabase
    .from('association_memberships')
    .select('user_id')
    .eq('id', membershipId)
    .single()

  if (membership?.user_id === user?.id && newRole !== 'president') {
    const { count } = await supabase
      .from('association_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('association_id', associationId)
      .eq('role', 'president')
      .eq('is_active', true)

    if ((count ?? 0) <= 1) {
      return { error: 'Vous ne pouvez pas vous rétrograder : vous êtes le seul président' }
    }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('association_memberships')
    .update({ role: newRole })
    .eq('id', membershipId)

  if (error) return { error: 'Erreur lors de la mise à jour du rôle' }

  revalidatePath('/dashboard/members')
  return { success: true }
}

export async function deactivateMember(membershipId: string, associationId: string) {
  const callerRole = await getCallerRole(associationId)
  if (callerRole !== 'president') return { error: 'Seul le président peut retirer des membres' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: membership } = await supabase
    .from('association_memberships')
    .select('user_id')
    .eq('id', membershipId)
    .single()

  if (membership?.user_id === user?.id) {
    return { error: 'Vous ne pouvez pas vous retirer vous-même' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('association_memberships')
    .update({ is_active: false })
    .eq('id', membershipId)

  if (error) return { error: 'Erreur lors de la désactivation' }

  revalidatePath('/dashboard/members')
  return { success: true }
}

export async function inviteMember(associationId: string, email: string, role: Role) {
  const callerRole = await getCallerRole(associationId)
  if (!['president', 'secretary'].includes(callerRole ?? '')) {
    return { error: 'Vous n\'avez pas les droits pour inviter des membres' }
  }

  const supabase = await createClient()

  // Check if user exists
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (!profile) {
    return { error: 'Aucun compte trouvé avec cet e-mail. L\'utilisateur doit d\'abord créer un compte.' }
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from('association_memberships')
    .select('id, is_active')
    .eq('association_id', associationId)
    .eq('user_id', profile.id)
    .single()

  if (existing?.is_active) {
    return { error: 'Cet utilisateur est déjà membre de l\'association' }
  }

  const admin = createAdminClient()

  if (existing && !existing.is_active) {
    // Reactivate
    const { error } = await admin
      .from('association_memberships')
      .update({ is_active: true, role })
      .eq('id', existing.id)
    if (error) return { error: 'Erreur lors de la réactivation du membre' }
  } else {
    const { error } = await admin
      .from('association_memberships')
      .insert({ association_id: associationId, user_id: profile.id, role })
    if (error) return { error: 'Erreur lors de l\'ajout du membre' }
  }

  revalidatePath('/dashboard/members')
  return { success: true }
}
