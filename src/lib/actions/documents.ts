'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { Document, Role } from '@/types/database'

const BUCKET = 'documents'

export async function getDocuments(associationId: string): Promise<Document[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('association_id', associationId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getDocuments error:', error)
    return []
  }
  return data as Document[]
}

export async function getSignedUploadUrl(associationId: string, folderSlug: string, fileName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const slug = (folderSlug || 'general').replace(/[^a-z0-9_-]/gi, '_').toLowerCase()
  const path = `${associationId}/${slug}/${Date.now()}_${sanitized}`

  const admin = createAdminClient()
  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path)

  if (error) {
    console.error('getSignedUploadUrl error:', error)
    return { error: 'Impossible de générer l\'URL d\'upload' }
  }

  return { signedUrl: data.signedUrl, path }
}

export async function saveDocument(params: {
  associationId: string
  name: string
  filePath: string
  fileSize: number
  mimeType: string
  folder: string
  folderId?: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()
  const { error } = await admin.from('documents').insert({
    association_id: params.associationId,
    uploaded_by: user.id,
    name: params.name,
    file_path: params.filePath,
    file_size: params.fileSize,
    mime_type: params.mimeType,
    folder: params.folder,
    folder_id: params.folderId ?? null,
  })

  if (error) {
    console.error('saveDocument error:', error)
    return { error: 'Erreur lors de l\'enregistrement' }
  }

  revalidatePath('/dashboard/documents')
  return { success: true }
}

export async function getSignedViewUrl(filePath: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 3600) // 1 hour

  if (error) return null
  return data.signedUrl
}

export async function deleteDocument(documentId: string, filePath: string, associationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: membership } = await supabase
    .from('association_memberships')
    .select('role')
    .eq('association_id', associationId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  const callerRole = membership?.role as Role | undefined
  const canDelete = ['president', 'secretary'].includes(callerRole ?? '')

  const { data: doc } = await supabase
    .from('documents')
    .select('uploaded_by')
    .eq('id', documentId)
    .single()

  if (!canDelete && doc?.uploaded_by !== user.id) {
    return { error: 'Vous ne pouvez pas supprimer ce document' }
  }

  const admin = createAdminClient()

  await admin.storage.from(BUCKET).remove([filePath])

  const { error } = await admin.from('documents').delete().eq('id', documentId)
  if (error) return { error: 'Erreur lors de la suppression' }

  revalidatePath('/dashboard/documents')
  return { success: true }
}
