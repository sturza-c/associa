'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface CalendarItem {
  id: string
  kind: 'event' | 'task'
  date: string // YYYY-MM-DD
  title: string
  subtitle?: string | null
  href: string
  color?: string | null
}

export async function getCalendarItems(
  associationId: string,
  rangeStart: string, // YYYY-MM-DD inclusive
  rangeEnd: string   // YYYY-MM-DD inclusive
): Promise<CalendarItem[]> {
  const supabase = await createClient()

  const [eventsRes, tasksRes] = await Promise.all([
    supabase
      .from('event_budgets')
      .select('id, name, event_date, status')
      .eq('association_id', associationId)
      .not('event_date', 'is', null)
      .gte('event_date', rangeStart)
      .lte('event_date', rangeEnd),
    supabase
      .from('tasks')
      .select('id, title, due_date, status, priority')
      .eq('association_id', associationId)
      .not('due_date', 'is', null)
      .gte('due_date', rangeStart)
      .lte('due_date', rangeEnd),
  ])

  const items: CalendarItem[] = []

  for (const e of eventsRes.data ?? []) {
    if (!e.event_date) continue
    items.push({
      id: `event-${e.id}`,
      kind: 'event',
      date: e.event_date,
      title: e.name,
      subtitle: e.status,
      href: '/dashboard/events',
      color: '#6366f1',
    })
  }

  for (const t of tasksRes.data ?? []) {
    if (!t.due_date) continue
    if (t.status === 'done') continue
    items.push({
      id: `task-${t.id}`,
      kind: 'task',
      date: t.due_date,
      title: t.title,
      subtitle: t.priority,
      href: '/dashboard/tasks',
      color: t.priority === 'high' ? '#ef4444' : t.priority === 'medium' ? '#f59e0b' : '#94a3b8',
    })
  }

  return items.sort((a, b) => a.date.localeCompare(b.date))
}

export async function getCalendarToken(associationId: string): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('associations')
    .select('calendar_token')
    .eq('id', associationId)
    .single()

  if (error) {
    if (error.code === '42703') return null // column missing
    return null
  }
  return data?.calendar_token ?? null
}

export async function regenerateCalendarToken(associationId: string) {
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

  if (membership?.role !== 'president') {
    return { error: 'Seul le président peut régénérer le lien' }
  }

  const admin = createAdminClient()
  const newToken = crypto.randomUUID()
  const { error } = await admin
    .from('associations')
    .update({ calendar_token: newToken })
    .eq('id', associationId)

  if (error) {
    if (error.code === '42703') {
      return { error: 'Colonne calendar_token manquante — exécute sql/calendar_token.sql' }
    }
    return { error: 'Erreur lors de la régénération' }
  }

  revalidatePath('/dashboard/calendar')
  return { success: true, token: newToken }
}
