'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { EventStatus, EventRsvp, FinanceType } from '@/types/database'

// ── Auth helper ───────────────────────────────────────────────────────────────

async function getCallerForAssoc(associationId: string) {
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

function canManageEvents(role: string) {
  return ['president', 'treasurer', 'secretary'].includes(role)
}

// ── Events CRUD ───────────────────────────────────────────────────────────────

export interface EventInput {
  name: string
  description?: string | null
  event_date?: string | null
  start_time?: string | null
  end_time?: string | null
  location?: string | null
  status?: EventStatus
  max_participants?: number | null
}

export async function createEvent(associationId: string, input: EventInput) {
  const caller = await getCallerForAssoc(associationId)
  if ('error' in caller) return { error: caller.error }
  if (!canManageEvents(caller.role)) return { error: 'Permissions insuffisantes' }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('events')
    .insert({ ...input, association_id: associationId, created_by: caller.user.id })
    .select()
    .single()

  if (error) {
    if (error.code === '42P01') return { error: 'Table events manquante — exécute sql/events.sql' }
    return { error: error.message }
  }
  return { event: data }
}

export async function updateEvent(id: string, associationId: string, patch: Partial<EventInput>) {
  const caller = await getCallerForAssoc(associationId)
  if ('error' in caller) return { error: caller.error }
  if (!canManageEvents(caller.role)) return { error: 'Permissions insuffisantes' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('events')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('association_id', associationId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteEvent(id: string, associationId: string) {
  const caller = await getCallerForAssoc(associationId)
  if ('error' in caller) return { error: caller.error }
  if (!['president', 'treasurer'].includes(caller.role)) return { error: 'Permissions insuffisantes' }

  const admin = createAdminClient()
  const { error } = await admin.from('events').delete().eq('id', id).eq('association_id', associationId)
  if (error) return { error: error.message }
  return { success: true }
}

// ── RSVP ─────────────────────────────────────────────────────────────────────

export async function upsertRsvp(eventId: string, response: EventRsvp) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Use admin to bypass RLS for the upsert
  const admin = createAdminClient()
  const { error } = await admin
    .from('event_participants')
    .upsert({ event_id: eventId, user_id: user.id, response }, { onConflict: 'event_id,user_id' })

  if (error) return { error: error.message }
  return { success: true }
}

export async function removeRsvp(eventId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('event_participants')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

// ── Budget items ──────────────────────────────────────────────────────────────

export interface BudgetItemInput {
  type: FinanceType
  label: string
  planned_amount: number
  actual_amount?: number
  notes?: string | null
}

export async function addEventBudgetItem(eventId: string, associationId: string, input: BudgetItemInput) {
  const caller = await getCallerForAssoc(associationId)
  if ('error' in caller) return { error: caller.error }
  if (!canManageEvents(caller.role)) return { error: 'Permissions insuffisantes' }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('event_budget_items')
    .insert({ event_id: eventId, ...input, actual_amount: input.actual_amount ?? 0 })
    .select()
    .single()

  if (error) return { error: error.message }
  return { item: data }
}

export async function updateEventBudgetItem(id: string, associationId: string, patch: Partial<BudgetItemInput>) {
  const caller = await getCallerForAssoc(associationId)
  if ('error' in caller) return { error: caller.error }
  if (!canManageEvents(caller.role)) return { error: 'Permissions insuffisantes' }

  const admin = createAdminClient()
  const { error } = await admin.from('event_budget_items').update(patch).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteEventBudgetItem(id: string, associationId: string) {
  const caller = await getCallerForAssoc(associationId)
  if ('error' in caller) return { error: caller.error }
  if (!canManageEvents(caller.role)) return { error: 'Permissions insuffisantes' }

  const admin = createAdminClient()
  const { error } = await admin.from('event_budget_items').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

// ── Event tasks ───────────────────────────────────────────────────────────────

export async function addEventTask(
  eventId: string,
  associationId: string,
  input: { title: string; assigned_to?: string | null; due_date?: string | null; position?: number }
) {
  const caller = await getCallerForAssoc(associationId)
  if ('error' in caller) return { error: caller.error }
  if (!canManageEvents(caller.role)) return { error: 'Permissions insuffisantes' }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('event_tasks')
    .insert({ event_id: eventId, ...input })
    .select()
    .single()

  if (error) return { error: error.message }
  return { task: data }
}

export async function toggleEventTask(id: string, associationId: string, done: boolean) {
  const caller = await getCallerForAssoc(associationId)
  if ('error' in caller) return { error: caller.error }

  const admin = createAdminClient()
  const { error } = await admin.from('event_tasks').update({ done }).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateEventTask(
  id: string,
  associationId: string,
  patch: { title?: string; assigned_to?: string | null; due_date?: string | null }
) {
  const caller = await getCallerForAssoc(associationId)
  if ('error' in caller) return { error: caller.error }
  if (!canManageEvents(caller.role)) return { error: 'Permissions insuffisantes' }

  const admin = createAdminClient()
  const { error } = await admin.from('event_tasks').update(patch).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteEventTask(id: string, associationId: string) {
  const caller = await getCallerForAssoc(associationId)
  if ('error' in caller) return { error: caller.error }
  if (!canManageEvents(caller.role)) return { error: 'Permissions insuffisantes' }

  const admin = createAdminClient()
  const { error } = await admin.from('event_tasks').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}
