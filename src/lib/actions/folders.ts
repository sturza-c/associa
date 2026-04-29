'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { DocumentFolder, Role } from '@/types/database'

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

function canManage(role: Role | null): boolean {
  return role === 'president' || role === 'secretary'
}

export async function getFolders(associationId: string): Promise<DocumentFolder[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('document_folders')
    .select('*')
    .eq('association_id', associationId)
    .order('position', { ascending: true })

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') return []
    console.error('getFolders error:', error.message)
    return []
  }
  return data as DocumentFolder[]
}

export async function createFolder(
  associationId: string,
  payload: { name: string; color?: string }
) {
  const role = await getCallerRole(associationId)
  if (!canManage(role)) return { error: 'Vous n\'avez pas les droits' }

  const name = payload.name.trim()
  if (!name) return { error: 'Le nom est requis' }
  const color = payload.color && /^#[0-9a-fA-F]{6}$/.test(payload.color)
    ? payload.color.toLowerCase()
    : '#94a3b8'

  const admin = createAdminClient()
  const { data: maxRow } = await admin
    .from('document_folders')
    .select('position')
    .eq('association_id', associationId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextPosition = (maxRow?.position ?? -1) + 1

  const { data, error } = await admin
    .from('document_folders')
    .insert({
      association_id: associationId,
      name: name.slice(0, 60),
      color,
      position: nextPosition,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '42P01') {
      return { error: 'Table manquante — exécute sql/document_folders.sql' }
    }
    console.error('createFolder error:', error.message)
    return { error: 'Erreur lors de la création' }
  }

  revalidatePath('/dashboard/documents')
  return { success: true as const, folder: data as DocumentFolder }
}

export async function updateFolder(
  folderId: string,
  associationId: string,
  payload: { name?: string; color?: string }
) {
  const role = await getCallerRole(associationId)
  if (!canManage(role)) return { error: 'Vous n\'avez pas les droits' }

  const update: Record<string, unknown> = {}
  if (payload.name !== undefined) {
    const n = payload.name.trim()
    if (!n) return { error: 'Le nom est requis' }
    update.name = n.slice(0, 60)
  }
  if (payload.color !== undefined) {
    if (!/^#[0-9a-fA-F]{6}$/.test(payload.color)) return { error: 'Couleur invalide' }
    update.color = payload.color.toLowerCase()
  }
  if (Object.keys(update).length === 0) return { success: true as const }

  const admin = createAdminClient()
  const { error } = await admin
    .from('document_folders')
    .update(update)
    .eq('id', folderId)
    .eq('association_id', associationId)

  if (error) return { error: 'Erreur lors de la mise à jour' }
  revalidatePath('/dashboard/documents')
  return { success: true as const }
}

export async function deleteFolder(folderId: string, associationId: string) {
  const role = await getCallerRole(associationId)
  if (!canManage(role)) return { error: 'Vous n\'avez pas les droits' }

  const admin = createAdminClient()

  // Documents in this folder fall back to "no folder" (folder_id becomes null
  // automatically thanks to ON DELETE SET NULL). They're not deleted.
  const { error } = await admin
    .from('document_folders')
    .delete()
    .eq('id', folderId)
    .eq('association_id', associationId)

  if (error) return { error: 'Erreur lors de la suppression' }
  revalidatePath('/dashboard/documents')
  return { success: true as const }
}
