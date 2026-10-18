'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'event-photos'
const MAX_BYTES = 15 * 1024 * 1024

async function getMember(associationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' as const }
  const { data } = await supabase
    .from('association_memberships')
    .select('role')
    .eq('association_id', associationId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()
  if (!data) return { error: 'Membre introuvable' as const }
  return { user, role: data.role as string }
}

async function eventBelongs(eventId: string, associationId: string) {
  const admin = createAdminClient()
  const { data } = await admin.from('events').select('id').eq('id', eventId).eq('association_id', associationId).single()
  return !!data
}

/** Any active member can add photos to an event of their association. */
export async function getEventPhotoUploadUrl(eventId: string, associationId: string, fileName: string, size: number) {
  const caller = await getMember(associationId)
  if ('error' in caller) return { error: caller.error }
  if (size > MAX_BYTES) return { error: 'Photo trop lourde (15 Mo max.)' }
  if (!(await eventBelongs(eventId, associationId))) return { error: 'Événement introuvable' }

  const ext = (fileName.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${associationId}/${eventId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

  const admin = createAdminClient()
  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path)
  if (error) {
    console.error('getEventPhotoUploadUrl error:', error)
    return { error: 'Stockage photos indisponible — exécute sql/event_signup_photos.sql' }
  }
  return { signedUrl: data.signedUrl, path }
}

export async function saveEventPhoto(params: {
  eventId: string
  associationId: string
  filePath: string
  width: number | null
  height: number | null
}) {
  const caller = await getMember(params.associationId)
  if ('error' in caller) return { error: caller.error }
  if (!params.filePath.startsWith(`${params.associationId}/${params.eventId}/`)) return { error: 'Chemin invalide' }
  if (!(await eventBelongs(params.eventId, params.associationId))) return { error: 'Événement introuvable' }

  const admin = createAdminClient()
  const { error } = await admin.from('event_photos').insert({
    event_id: params.eventId,
    association_id: params.associationId,
    file_path: params.filePath,
    width: params.width,
    height: params.height,
    uploaded_by: caller.user.id,
  })
  if (error) {
    console.error('saveEventPhoto error:', error)
    return { error: 'Erreur lors de l\'enregistrement de la photo' }
  }
  return { success: true }
}

/** The uploader, or the president / secretary, can remove a photo. */
export async function deleteEventPhoto(photoId: string, associationId: string) {
  const caller = await getMember(associationId)
  if ('error' in caller) return { error: caller.error }

  const admin = createAdminClient()
  const { data: photo } = await admin
    .from('event_photos')
    .select('id, file_path, uploaded_by')
    .eq('id', photoId)
    .eq('association_id', associationId)
    .single()
  if (!photo) return { error: 'Photo introuvable' }

  const canDelete = photo.uploaded_by === caller.user.id || ['president', 'secretary'].includes(caller.role)
  if (!canDelete) return { error: 'Vous ne pouvez pas supprimer cette photo' }

  await admin.storage.from(BUCKET).remove([photo.file_path])
  const { error } = await admin.from('event_photos').delete().eq('id', photoId)
  if (error) return { error: 'Erreur lors de la suppression' }
  return { success: true }
}
