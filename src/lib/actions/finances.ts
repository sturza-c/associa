'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { Finance, FinanceType } from '@/types/database'

export async function getFinances(associationId: string): Promise<Finance[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('finances')
    .select('*')
    .eq('association_id', associationId)
    .order('date', { ascending: false })

  if (error) {
    console.error('getFinances error:', error)
    return []
  }
  return data as Finance[]
}

export async function createFinanceEntry(formData: FormData, associationId: string) {
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

  if (!['president', 'treasurer'].includes(membership?.role ?? '')) {
    return { error: 'Seul le président ou le trésorier peut gérer les finances' }
  }

  const type = formData.get('type') as FinanceType
  const label = formData.get('label') as string
  const amount = parseFloat(formData.get('amount') as string)
  const description = formData.get('description') as string
  const date = formData.get('date') as string
  const categoryId = (formData.get('category_id') as string) || null

  if (!label?.trim()) return { error: 'Le libellé est requis' }
  if (isNaN(amount) || amount <= 0) return { error: 'Montant invalide' }

  const admin = createAdminClient()
  const { error } = await admin.from('finances').insert({
    association_id: associationId,
    created_by: user.id,
    type,
    label: label.trim(),
    amount,
    description: description?.trim() || null,
    date: date || new Date().toISOString().split('T')[0],
    category_id: categoryId,
  })

  if (error) {
    console.error('createFinanceEntry error:', error)
    return { error: 'Erreur lors de la création' }
  }

  revalidatePath('/dashboard/finances')
  return { success: true }
}

export async function deleteFinanceEntry(entryId: string, associationId: string) {
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

  if (!['president', 'treasurer'].includes(membership?.role ?? '')) {
    return { error: 'Accès refusé' }
  }

  const admin = createAdminClient()
  const { error } = await admin.from('finances').delete().eq('id', entryId)
  if (error) return { error: 'Erreur lors de la suppression' }

  revalidatePath('/dashboard/finances')
  return { success: true }
}
