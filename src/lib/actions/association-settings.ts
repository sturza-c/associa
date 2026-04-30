'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { Role, RoleLabels } from '@/types/database'

const BUCKET = 'logos'
const MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

const VALID_ROLES: Role[] = ['president', 'treasurer', 'secretary', 'member']

async function assertPresident(associationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' as const }

  const { data: membership } = await supabase
    .from('association_memberships')
    .select('role')
    .eq('association_id', associationId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (membership?.role !== 'president') {
    return { error: 'Seul le président peut modifier les paramètres' as const }
  }
  return { user }
}

export async function uploadAssociationLogo(formData: FormData, associationId: string) {
  const auth = await assertPresident(associationId)
  if ('error' in auth) return { error: auth.error }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { error: 'Aucun fichier' }
  if (file.size > MAX_BYTES) return { error: 'Fichier trop volumineux (max 2 Mo)' }
  if (!ALLOWED.includes(file.type)) return { error: 'Format non supporté (PNG, JPG, WEBP ou SVG)' }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const path = `${associationId}/logo_${Date.now()}.${ext}`

  const admin = createAdminClient()

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    console.error('uploadAssociationLogo upload error:', uploadError.message)
    if (uploadError.message?.toLowerCase().includes('bucket') || uploadError.message?.includes('not found')) {
      return { error: 'Bucket logos manquant — exécute sql/association_logos.sql' }
    }
    return { error: 'Erreur lors de l\'upload' }
  }

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path)
  const publicUrl = pub.publicUrl

  // remove previous logo (best effort)
  const { data: prev } = await admin
    .from('associations')
    .select('logo_url')
    .eq('id', associationId)
    .single()

  if (prev?.logo_url) {
    const prevPath = prev.logo_url.split(`/${BUCKET}/`)[1]
    if (prevPath && prevPath !== path) {
      admin.storage.from(BUCKET).remove([prevPath]).catch(() => {})
    }
  }

  const { error: updateError } = await admin
    .from('associations')
    .update({ logo_url: publicUrl })
    .eq('id', associationId)

  if (updateError) {
    console.error('uploadAssociationLogo update error:', updateError.message)
    return { error: 'Erreur lors de la mise à jour' }
  }

  revalidatePath('/dashboard')
  return { success: true, logo_url: publicUrl }
}

export async function removeAssociationLogo(associationId: string) {
  const auth = await assertPresident(associationId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { data: prev } = await admin
    .from('associations')
    .select('logo_url')
    .eq('id', associationId)
    .single()

  if (prev?.logo_url) {
    const prevPath = prev.logo_url.split(`/${BUCKET}/`)[1]
    if (prevPath) {
      admin.storage.from(BUCKET).remove([prevPath]).catch(() => {})
    }
  }

  const { error } = await admin
    .from('associations')
    .update({ logo_url: null })
    .eq('id', associationId)

  if (error) return { error: 'Erreur lors de la suppression' }
  revalidatePath('/dashboard')
  return { success: true }
}

// --- Identity (name / description / accent) ---

export async function updateAssociationIdentity(
  associationId: string,
  payload: { name?: string; description?: string | null; accent_color?: string }
) {
  const auth = await assertPresident(associationId)
  if ('error' in auth) return { error: auth.error }

  const update: Record<string, unknown> = {}
  if (payload.name !== undefined) {
    const name = payload.name.trim()
    if (!name) return { error: 'Le nom est requis' }
    update.name = name
  }
  if (payload.description !== undefined) {
    update.description = payload.description?.trim() || null
  }
  if (payload.accent_color !== undefined) {
    if (!/^#[0-9a-fA-F]{6}$/.test(payload.accent_color)) {
      return { error: 'Couleur invalide (format #RRGGBB)' }
    }
    update.accent_color = payload.accent_color.toLowerCase()
  }

  if (Object.keys(update).length === 0) return { success: true }

  const admin = createAdminClient()
  const { error } = await admin
    .from('associations')
    .update(update)
    .eq('id', associationId)

  if (error) {
    console.error('updateAssociationIdentity error:', error.message)
    return { error: 'Erreur lors de la mise à jour' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return { success: true }
}

// --- Role labels (rename built-in roles) ---

export async function updateRoleLabels(associationId: string, labels: RoleLabels) {
  const auth = await assertPresident(associationId)
  if ('error' in auth) return { error: auth.error }

  // Sanitize: keep only known roles, trim, drop empty.
  const clean: RoleLabels = {}
  for (const role of VALID_ROLES) {
    const v = labels[role]?.toString().trim()
    if (v) clean[role] = v.slice(0, 60)
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('associations')
    .update({ role_labels: clean })
    .eq('id', associationId)

  if (error) {
    if (error.message?.includes('role_labels') || error.code === '42703') {
      return { error: 'Colonne role_labels manquante — exécute sql/association_settings.sql' }
    }
    console.error('updateRoleLabels error:', error.message)
    return { error: 'Erreur lors de la mise à jour' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return { success: true }
}

// --- Custom titles ---

export async function createTitle(
  associationId: string,
  payload: { name: string; color?: string; description?: string | null }
) {
  const auth = await assertPresident(associationId)
  if ('error' in auth) return { error: auth.error }

  const name = payload.name.trim()
  if (!name) return { error: 'Le nom du titre est requis' }
  const color = payload.color && /^#[0-9a-fA-F]{6}$/.test(payload.color)
    ? payload.color.toLowerCase()
    : '#94a3b8'

  const admin = createAdminClient()
  const { data: maxRow } = await admin
    .from('association_titles')
    .select('position')
    .eq('association_id', associationId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextPosition = (maxRow?.position ?? -1) + 1

  const { data: inserted, error } = await admin.from('association_titles').insert({
    association_id: associationId,
    name: name.slice(0, 60),
    color,
    description: payload.description?.trim() || null,
    position: nextPosition,
  }).select().single()

  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return { error: 'Table manquante — exécute sql/association_settings.sql' }
    }
    console.error('createTitle error:', error.message)
    return { error: 'Erreur lors de la création' }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/members')
  return { success: true, title: inserted }
}

export async function updateTitle(
  titleId: string,
  associationId: string,
  payload: { name?: string; color?: string; description?: string | null }
) {
  const auth = await assertPresident(associationId)
  if ('error' in auth) return { error: auth.error }

  const update: Record<string, unknown> = {}
  if (payload.name !== undefined) {
    const n = payload.name.trim()
    if (!n) return { error: 'Le nom du titre est requis' }
    update.name = n.slice(0, 60)
  }
  if (payload.color !== undefined) {
    if (!/^#[0-9a-fA-F]{6}$/.test(payload.color)) return { error: 'Couleur invalide' }
    update.color = payload.color.toLowerCase()
  }
  if (payload.description !== undefined) {
    update.description = payload.description?.trim() || null
  }

  if (Object.keys(update).length === 0) return { success: true }

  const admin = createAdminClient()
  const { error } = await admin
    .from('association_titles')
    .update(update)
    .eq('id', titleId)
    .eq('association_id', associationId)

  if (error) {
    console.error('updateTitle error:', error.message)
    return { error: 'Erreur lors de la mise à jour' }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/members')
  return { success: true }
}

export async function deleteTitle(titleId: string, associationId: string) {
  const auth = await assertPresident(associationId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('association_titles')
    .delete()
    .eq('id', titleId)
    .eq('association_id', associationId)

  if (error) return { error: 'Erreur lors de la suppression' }
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/members')
  return { success: true }
}

// --- Title assignments ---

export async function assignTitle(membershipId: string, titleId: string, associationId: string) {
  const auth = await assertPresident(associationId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()

  // Sanity: the membership and title must belong to the association.
  const { data: m } = await admin
    .from('association_memberships')
    .select('association_id')
    .eq('id', membershipId)
    .single()
  const { data: t } = await admin
    .from('association_titles')
    .select('association_id')
    .eq('id', titleId)
    .single()

  if (m?.association_id !== associationId || t?.association_id !== associationId) {
    return { error: 'Données invalides' }
  }

  const { error } = await admin
    .from('membership_titles')
    .upsert({ membership_id: membershipId, title_id: titleId }, { onConflict: 'membership_id,title_id' })

  if (error) {
    console.error('assignTitle error:', error.message)
    return { error: 'Erreur lors de l\'attribution' }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/members')
  return { success: true }
}

export async function unassignTitle(membershipId: string, titleId: string, associationId: string) {
  const auth = await assertPresident(associationId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('membership_titles')
    .delete()
    .eq('membership_id', membershipId)
    .eq('title_id', titleId)

  if (error) return { error: 'Erreur lors du retrait' }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/members')
  return { success: true }
}

// --- Leave association (any active member) ---

export async function leaveAssociation(associationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: membership } = await supabase
    .from('association_memberships')
    .select('id, role')
    .eq('association_id', associationId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership) return { error: 'Vous n\'êtes pas membre' }

  // The last active president cannot leave without first promoting someone.
  if (membership.role === 'president') {
    const admin = createAdminClient()
    const { count } = await admin
      .from('association_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('association_id', associationId)
      .eq('role', 'president')
      .eq('is_active', true)
    if ((count ?? 0) <= 1) {
      return { error: 'Désignez un autre président avant de quitter l\'association' }
    }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('association_memberships')
    .update({ is_active: false })
    .eq('id', membership.id)

  if (error) return { error: 'Erreur lors du départ' }

  revalidatePath('/dashboard')
  revalidatePath('/select')
  return { success: true }
}

// ─── Public page (slug + visibility) ─────────────────────────────────────────

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export async function updatePublicPage(
  associationId: string,
  payload: { slug?: string; is_public?: boolean },
) {
  const auth = await assertPresident(associationId)
  if ('error' in auth) return { error: auth.error }

  const update: Record<string, unknown> = {}

  if (payload.slug !== undefined) {
    const raw = payload.slug.trim()
    if (!raw) return { error: 'Le slug ne peut pas être vide' }
    const slug = toSlug(raw)
    if (slug.length < 2) return { error: 'Slug trop court (min 2 caractères)' }
    update.slug = slug
  }

  if (payload.is_public !== undefined) {
    update.is_public = payload.is_public
  }

  if (Object.keys(update).length === 0) return { success: true }

  const admin = createAdminClient()

  // Check slug uniqueness
  if (update.slug) {
    const { data: existing } = await admin
      .from('associations')
      .select('id')
      .eq('slug', update.slug)
      .neq('id', associationId)
      .maybeSingle()
    if (existing) return { error: 'Ce slug est déjà utilisé par une autre association' }
  }

  const { error } = await admin
    .from('associations')
    .update(update)
    .eq('id', associationId)

  if (error) {
    if (error.code === '42703') return { error: 'Colonnes manquantes — exécute sql/public_page.sql' }
    if (error.code === '23505') return { error: 'Ce slug est déjà pris' }
    return { error: 'Erreur lors de la mise à jour' }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath(`/a/${update.slug ?? ''}`)
  return { success: true, slug: update.slug as string | undefined }
}

