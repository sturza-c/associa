'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { Note, NoteFolder } from '@/types/database'

// ─── Helper ───────────────────────────────────────────────────────────────────

async function assertMember(associationId: string): Promise<{ userId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: membership } = await supabase
    .from('association_memberships')
    .select('id')
    .eq('association_id', associationId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership) return { error: 'Accès refusé' }
  return { userId: user.id }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getNotes(associationId: string): Promise<{ notes: Note[]; folders: NoteFolder[] }> {
  const supabase = await createClient()

  const [notesResult, foldersResult] = await Promise.all([
    supabase
      .from('notes')
      .select('*')
      .eq('association_id', associationId)
      .order('updated_at', { ascending: false }),
    supabase
      .from('note_folders')
      .select('*')
      .eq('association_id', associationId)
      .order('position', { ascending: true }),
  ])

  // Gracefully handle table-missing errors (42P01 / PGRST205)
  if (notesResult.error) {
    const code = (notesResult.error as { code?: string }).code
    if (code === '42P01' || code === 'PGRST205') return { notes: [], folders: [] }
    console.error('getNotes error:', notesResult.error)
    return { notes: [], folders: [] }
  }

  if (foldersResult.error) {
    const code = (foldersResult.error as { code?: string }).code
    if (code === '42P01' || code === 'PGRST205') return { notes: notesResult.data as Note[], folders: [] }
    console.error('getFolders error:', foldersResult.error)
    return { notes: notesResult.data as Note[], folders: [] }
  }

  return {
    notes: notesResult.data as Note[],
    folders: foldersResult.data as NoteFolder[],
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createNote(
  associationId: string,
  folderId: string | null,
): Promise<{ note?: Note; error?: string }> {
  const result = await assertMember(associationId)
  if ('error' in result) return { error: result.error }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('notes')
    .insert({
      association_id: associationId,
      folder_id: folderId,
      created_by: result.userId,
      title: '',
      content: '',
    })
    .select()
    .single()

  if (error) {
    console.error('createNote error:', error)
    return { error: 'Erreur lors de la création de la note' }
  }

  revalidatePath('/dashboard/notes')
  return { note: data as Note }
}

export async function updateNote(
  noteId: string,
  associationId: string,
  patch: { title?: string; content?: string; folderId?: string | null },
): Promise<{ error?: string }> {
  const result = await assertMember(associationId)
  if ('error' in result) return { error: result.error }

  const update: Record<string, unknown> = {}
  if (patch.title !== undefined) update.title = patch.title
  if (patch.content !== undefined) update.content = patch.content
  if (patch.folderId !== undefined) update.folder_id = patch.folderId

  const admin = createAdminClient()
  const { error } = await admin
    .from('notes')
    .update(update)
    .eq('id', noteId)
    .eq('association_id', associationId)

  if (error) {
    console.error('updateNote error:', error)
    return { error: 'Erreur lors de la mise à jour de la note' }
  }

  revalidatePath('/dashboard/notes')
  return {}
}

export async function deleteNote(
  noteId: string,
  associationId: string,
): Promise<{ error?: string }> {
  const result = await assertMember(associationId)
  if ('error' in result) return { error: result.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('association_id', associationId)

  if (error) {
    console.error('deleteNote error:', error)
    return { error: 'Erreur lors de la suppression de la note' }
  }

  revalidatePath('/dashboard/notes')
  return {}
}

export async function createNoteFolder(
  associationId: string,
  name: string,
  color: string,
): Promise<{ folder?: NoteFolder; error?: string }> {
  const result = await assertMember(associationId)
  if ('error' in result) return { error: result.error }

  const admin = createAdminClient()

  // Get max position
  const { data: existing } = await admin
    .from('note_folders')
    .select('position')
    .eq('association_id', associationId)
    .order('position', { ascending: false })
    .limit(1)

  const maxPos = existing && existing.length > 0 ? existing[0].position : -1

  const { data, error } = await admin
    .from('note_folders')
    .insert({
      association_id: associationId,
      created_by: result.userId,
      name: name.trim(),
      color,
      position: maxPos + 1,
    })
    .select()
    .single()

  if (error) {
    console.error('createNoteFolder error:', error)
    return { error: 'Erreur lors de la création du dossier' }
  }

  revalidatePath('/dashboard/notes')
  return { folder: data as NoteFolder }
}

export async function deleteNoteFolder(
  folderId: string,
  associationId: string,
): Promise<{ error?: string }> {
  const result = await assertMember(associationId)
  if ('error' in result) return { error: result.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('note_folders')
    .delete()
    .eq('id', folderId)
    .eq('association_id', associationId)

  if (error) {
    console.error('deleteNoteFolder error:', error)
    return { error: 'Erreur lors de la suppression du dossier' }
  }

  revalidatePath('/dashboard/notes')
  return {}
}
