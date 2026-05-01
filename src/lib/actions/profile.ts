'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const BUCKET = 'logos'           // reuse existing storage bucket
const MAX_BYTES = 2 * 1024 * 1024  // 2 MB
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp']

export async function uploadProfileAvatar(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const file = formData.get('file') as File | null
    if (!file || file.size === 0) return { error: 'Aucun fichier' }
    if (file.size > MAX_BYTES)    return { error: 'Fichier trop volumineux (max 2 Mo)' }
    if (!ALLOWED.includes(file.type)) return { error: 'Format non supporté (PNG, JPG, WEBP)' }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `avatars/${user.id}/avatar_${Date.now()}.${ext}`

    const admin = createAdminClient()

    // Convert to Uint8Array (more compatible than Buffer in some runtimes)
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: true })

    if (uploadError) {
      console.error('Avatar upload error:', uploadError.message)
      if (uploadError.message?.toLowerCase().includes('bucket') || uploadError.message?.includes('not found')) {
        return { error: 'Bucket de stockage manquant — vérifie que le bucket "logos" existe dans Supabase Storage' }
      }
      return { error: `Erreur lors de l'upload : ${uploadError.message}` }
    }

    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path)
    const publicUrl = pub.publicUrl

    // Remove previous avatar from storage (best-effort)
    try {
      const { data: prev } = await admin
        .from('user_profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single()

      if (prev?.avatar_url) {
        const prevPath = prev.avatar_url.split(`/${BUCKET}/`)[1]
        if (prevPath && prevPath !== path && prevPath.startsWith('avatars/')) {
          admin.storage.from(BUCKET).remove([prevPath]).catch(() => {})
        }
      }
    } catch {
      // Non-critical — ignore cleanup errors
    }

    const { error: updateError } = await admin
      .from('user_profiles')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (updateError) return { error: 'Erreur lors de la mise à jour du profil' }

    revalidatePath('/dashboard/settings')
    return { success: true, avatar_url: publicUrl }
  } catch (err) {
    console.error('uploadProfileAvatar unexpected error:', err)
    return { error: 'Une erreur inattendue s\'est produite' }
  }
}

export async function updateProfileName(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const trimmed = name.trim()
  if (!trimmed) return { error: 'Le nom ne peut pas être vide' }
  if (trimmed.length > 80) return { error: 'Nom trop long (80 caractères max)' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('user_profiles')
    .update({ full_name: trimmed, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return { success: true }
}
