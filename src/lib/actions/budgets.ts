'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type {
  EventBudget,
  EventBudgetLine,
  EventBudgetStatus,
  EventBudgetWithLines,
  FinanceType,
} from '@/types/database'

async function assertTreasurer(associationId: string) {
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

  if (!['president', 'treasurer'].includes(membership?.role ?? '')) {
    return { error: 'Seul le président ou le trésorier peut gérer les budgets' as const }
  }
  return { user }
}

export async function getEventBudgets(associationId: string): Promise<EventBudgetWithLines[]> {
  const supabase = await createClient()
  const { data: budgets, error } = await supabase
    .from('event_budgets')
    .select('*')
    .eq('association_id', associationId)
    .order('event_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error || !budgets) {
    // Table missing → user hasn't run sql/event_budgets.sql yet. Stay quiet.
    if (error?.code === '42P01' || error?.code === 'PGRST205' || error?.message?.includes('does not exist')) {
      return []
    }
    console.error('getEventBudgets error:', error?.message ?? error)
    return []
  }

  if (budgets.length === 0) return []

  const { data: lines, error: linesError } = await supabase
    .from('event_budget_lines')
    .select('*')
    .in('budget_id', budgets.map(b => b.id))
    .order('created_at', { ascending: true })

  if (linesError) {
    console.error('getEventBudgetLines error:', linesError.message)
  }

  return (budgets as EventBudget[]).map(b => ({
    ...b,
    lines: ((lines ?? []) as EventBudgetLine[]).filter(l => l.budget_id === b.id),
  }))
}

export async function createEventBudget(formData: FormData, associationId: string) {
  const auth = await assertTreasurer(associationId)
  if ('error' in auth) return { error: auth.error }

  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const event_date = (formData.get('event_date') as string) || null

  if (!name) return { error: 'Le nom de l\'événement est requis' }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('event_budgets')
    .insert({
      association_id: associationId,
      created_by: auth.user.id,
      name,
      description,
      event_date,
      status: 'planned' as EventBudgetStatus,
    })
    .select()
    .single()

  if (error) {
    console.error('createEventBudget error:', error?.message ?? error, error?.code)
    if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist')) {
      return { error: 'Table event_budgets manquante — exécute sql/event_budgets.sql dans Supabase' }
    }
    return { error: 'Erreur lors de la création' }
  }

  revalidatePath('/dashboard/finances')
  return { success: true, data: data as EventBudget }
}

export async function updateBudgetStatus(budgetId: string, associationId: string, status: EventBudgetStatus) {
  const auth = await assertTreasurer(associationId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('event_budgets').update({ status }).eq('id', budgetId)
  if (error) return { error: 'Erreur lors de la mise à jour' }

  revalidatePath('/dashboard/finances')
  return { success: true }
}

export async function deleteEventBudget(budgetId: string, associationId: string) {
  const auth = await assertTreasurer(associationId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('event_budgets').delete().eq('id', budgetId)
  if (error) return { error: 'Erreur lors de la suppression' }

  revalidatePath('/dashboard/finances')
  return { success: true }
}

export async function addBudgetLine(budgetId: string, associationId: string, payload: {
  type: FinanceType
  label: string
  planned_amount: number
  actual_amount?: number
  notes?: string | null
}) {
  const auth = await assertTreasurer(associationId)
  if ('error' in auth) return { error: auth.error }

  if (!payload.label?.trim()) return { error: 'Le libellé est requis' }
  if (isNaN(payload.planned_amount) || payload.planned_amount < 0) {
    return { error: 'Montant prévu invalide' }
  }

  const admin = createAdminClient()
  const { error } = await admin.from('event_budget_lines').insert({
    budget_id: budgetId,
    type: payload.type,
    label: payload.label.trim(),
    planned_amount: payload.planned_amount,
    actual_amount: payload.actual_amount ?? 0,
    notes: payload.notes?.trim() || null,
  })

  if (error) {
    console.error('addBudgetLine error:', error)
    return { error: 'Erreur lors de l\'ajout' }
  }

  revalidatePath('/dashboard/finances')
  return { success: true }
}

export async function updateBudgetLineActual(lineId: string, associationId: string, actual_amount: number) {
  const auth = await assertTreasurer(associationId)
  if ('error' in auth) return { error: auth.error }

  if (isNaN(actual_amount) || actual_amount < 0) return { error: 'Montant invalide' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('event_budget_lines')
    .update({ actual_amount })
    .eq('id', lineId)

  if (error) return { error: 'Erreur lors de la mise à jour' }
  revalidatePath('/dashboard/finances')
  return { success: true }
}

export async function deleteBudgetLine(lineId: string, associationId: string) {
  const auth = await assertTreasurer(associationId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('event_budget_lines').delete().eq('id', lineId)
  if (error) return { error: 'Erreur lors de la suppression' }

  revalidatePath('/dashboard/finances')
  return { success: true }
}
