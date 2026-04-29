'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Role } from '@/types/database'

export interface PendingInvitation {
  id: string
  email: string
  role: Role
  created_at: string
  expires_at: string
  invited_by: string | null
  inviter_name?: string | null
  share_url?: string
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

async function getOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }
  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'http'
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  return `${proto}://${host}`
}

export async function inviteByEmail(
  associationId: string,
  email: string,
  role: Role
): Promise<{ error?: string; success?: true; share_url?: string }> {
  const callerRole = await getCallerRole(associationId)
  if (!['president', 'secretary'].includes(callerRole ?? '')) {
    return { error: 'Vous n\'avez pas les droits pour inviter des membres' }
  }

  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { error: 'Adresse e-mail invalide' }
  }

  const supabase = await createClient()
  const { data: { user: caller } } = await supabase.auth.getUser()

  const admin = createAdminClient()

  // If a profile already exists for this email and they're already an active member, short-circuit.
  const { data: profile } = await admin
    .from('user_profiles')
    .select('id')
    .eq('email', cleanEmail)
    .maybeSingle()

  if (profile) {
    const { data: existing } = await admin
      .from('association_memberships')
      .select('id, is_active')
      .eq('association_id', associationId)
      .eq('user_id', profile.id)
      .maybeSingle()

    if (existing?.is_active) {
      return { error: 'Cette personne est déjà membre' }
    }
  }

  // Cancel any previous pending invite for this email/association.
  await admin
    .from('association_invitations')
    .delete()
    .eq('association_id', associationId)
    .eq('email', cleanEmail)
    .is('accepted_at', null)

  const { data: inv, error: insertError } = await admin
    .from('association_invitations')
    .insert({
      association_id: associationId,
      email: cleanEmail,
      role,
      invited_by: caller?.id ?? null,
    })
    .select('token')
    .single()

  if (insertError || !inv) {
    if (insertError?.code === '42P01') {
      return { error: 'Table manquante — exécute sql/association_invitations.sql' }
    }
    console.error('inviteByEmail insert error:', insertError?.message)
    return { error: 'Erreur lors de la création de l\'invitation' }
  }

  const origin = await getOrigin()
  const acceptUrl = `${origin}/invite/${inv.token}`

  // Best-effort email via Supabase magic-link, redirecting to our accept page.
  // If SMTP isn't configured this can fail silently — we always return the
  // share URL so the inviter can copy/paste it manually.
  try {
    await admin.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: acceptUrl,
        shouldCreateUser: true,
      },
    })
  } catch (e) {
    console.warn('inviteByEmail magic-link send failed:', e)
  }

  revalidatePath('/dashboard/members')
  return { success: true, share_url: acceptUrl }
}

export async function getPendingInvitations(associationId: string): Promise<PendingInvitation[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('association_invitations')
    .select('id, email, role, created_at, expires_at, invited_by, token')
    .eq('association_id', associationId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') return []
    console.error('getPendingInvitations error:', error.message)
    return []
  }

  const inviterIds = Array.from(new Set((data ?? []).map(i => i.invited_by).filter(Boolean))) as string[]
  let inviterMap: Record<string, string | null> = {}
  if (inviterIds.length > 0) {
    const admin = createAdminClient()
    const { data: profiles } = await admin
      .from('user_profiles')
      .select('id, full_name')
      .in('id', inviterIds)
    inviterMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.full_name]))
  }

  const origin = await getOrigin()

  return (data ?? []).map((row: { id: string; email: string; role: string; created_at: string; expires_at: string; invited_by: string | null; token: string }) => ({
    id: row.id,
    email: row.email,
    role: row.role as Role,
    created_at: row.created_at,
    expires_at: row.expires_at,
    invited_by: row.invited_by,
    inviter_name: row.invited_by ? inviterMap[row.invited_by] ?? null : null,
    share_url: `${origin}/invite/${row.token}`,
  }))
}

export async function revokeInvitation(invitationId: string, associationId: string) {
  const callerRole = await getCallerRole(associationId)
  if (!['president', 'secretary'].includes(callerRole ?? '')) {
    return { error: 'Permission refusée' }
  }
  const admin = createAdminClient()
  const { error } = await admin
    .from('association_invitations')
    .delete()
    .eq('id', invitationId)
    .eq('association_id', associationId)
  if (error) return { error: 'Erreur lors de la suppression' }
  revalidatePath('/dashboard/members')
  return { success: true }
}

export async function resendInvitation(invitationId: string, associationId: string) {
  const callerRole = await getCallerRole(associationId)
  if (!['president', 'secretary'].includes(callerRole ?? '')) {
    return { error: 'Permission refusée' }
  }

  const admin = createAdminClient()
  const { data: inv } = await admin
    .from('association_invitations')
    .select('email, token')
    .eq('id', invitationId)
    .eq('association_id', associationId)
    .single()

  if (!inv) return { error: 'Invitation introuvable' }

  const origin = await getOrigin()
  const acceptUrl = `${origin}/invite/${inv.token}`

  // Bump expires_at by another 14 days
  await admin
    .from('association_invitations')
    .update({ expires_at: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString() })
    .eq('id', invitationId)

  try {
    await admin.auth.signInWithOtp({
      email: inv.email,
      options: { emailRedirectTo: acceptUrl, shouldCreateUser: true },
    })
  } catch (e) {
    console.warn('resendInvitation send failed:', e)
  }

  revalidatePath('/dashboard/members')
  return { success: true, share_url: acceptUrl }
}

export async function acceptInvitation(token: string): Promise<{ error?: string; success?: true; association_id?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Vous devez être connecté pour accepter' }

  const admin = createAdminClient()

  const { data: inv, error: invError } = await admin
    .from('association_invitations')
    .select('id, association_id, email, role, accepted_at, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (invError || !inv) return { error: 'Invitation introuvable' }
  if (inv.accepted_at) return { error: 'Cette invitation a déjà été utilisée' }
  if (new Date(inv.expires_at).getTime() < Date.now()) {
    return { error: 'Cette invitation a expiré' }
  }

  const userEmail = (user.email ?? '').toLowerCase()
  if (userEmail !== inv.email.toLowerCase()) {
    return { error: `Cette invitation a été envoyée à ${inv.email}. Connecte-toi avec ce compte pour l'accepter.` }
  }

  // Activate or create membership.
  const { data: existing } = await admin
    .from('association_memberships')
    .select('id, is_active')
    .eq('association_id', inv.association_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    if (!existing.is_active) {
      const { error } = await admin
        .from('association_memberships')
        .update({ is_active: true, role: inv.role })
        .eq('id', existing.id)
      if (error) return { error: 'Erreur lors de l\'activation' }
    }
  } else {
    const { error } = await admin
      .from('association_memberships')
      .insert({
        association_id: inv.association_id,
        user_id: user.id,
        role: inv.role,
      })
    if (error) return { error: 'Erreur lors de l\'ajout' }
  }

  await admin
    .from('association_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', inv.id)

  return { success: true, association_id: inv.association_id }
}
