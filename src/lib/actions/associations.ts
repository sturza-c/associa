'use server'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { MembershipWithAssociation } from '@/types/database'

// cache() deduplicates within a single React render pass —
// layout.tsx + page.tsx both call this, but only one DB query fires.
export const getUserMemberships = cache(async (): Promise<MembershipWithAssociation[]> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('association_memberships')
    .select('*, associations(*)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('joined_at', { ascending: true })

  if (error) {
    console.error('getUserMemberships error:', error)
    return []
  }
  return data as MembershipWithAssociation[]
})

export async function createAssociation(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Non authentifié' }

  const name = formData.get('name') as string
  const description = formData.get('description') as string

  if (!name?.trim()) return { error: 'Le nom est requis' }

  // Use admin client to bypass RLS for the initial creation
  const admin = createAdminClient()

  const { data: association, error: assocError } = await admin
    .from('associations')
    .insert({ name: name.trim(), description: description?.trim() || null })
    .select()
    .single()

  if (assocError) {
    console.error('createAssociation error:', assocError)
    return { error: 'Erreur lors de la création de l\'association' }
  }

  const { error: memberError } = await admin
    .from('association_memberships')
    .insert({
      association_id: association.id,
      user_id: user.id,
      role: 'president',
    })

  if (memberError) {
    console.error('createMembership error:', memberError)
    return { error: 'Erreur lors de la création du membership' }
  }

  revalidatePath('/dashboard')
  return { data: association }
}
