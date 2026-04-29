'use server'

import { createClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/actions/active-association'

export interface SearchHit {
  type: 'member' | 'document' | 'task' | 'event' | 'conversation'
  id: string
  title: string
  subtitle?: string | null
  href: string
}

export interface SearchResults {
  members: SearchHit[]
  documents: SearchHit[]
  tasks: SearchHit[]
  events: SearchHit[]
  conversations: SearchHit[]
}

const EMPTY: SearchResults = {
  members: [],
  documents: [],
  tasks: [],
  events: [],
  conversations: [],
}

export async function searchAssociation(query: string): Promise<SearchResults> {
  const q = query.trim()
  if (!q) return EMPTY

  const active = await getActiveMembership()
  if (!active) return EMPTY

  const associationId = active.association_id
  const supabase = await createClient()
  const like = `%${q}%`

  const [membersRes, docsRes, tasksRes, eventsRes, convRes] = await Promise.all([
    supabase
      .from('association_memberships')
      .select('id, role, user_profiles(full_name, email)')
      .eq('association_id', associationId)
      .eq('is_active', true)
      .limit(20),
    supabase
      .from('documents')
      .select('id, name, folder, file_size')
      .eq('association_id', associationId)
      .ilike('name', like)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('tasks')
      .select('id, title, status, priority')
      .eq('association_id', associationId)
      .ilike('title', like)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('event_budgets')
      .select('id, name, event_date, status')
      .eq('association_id', associationId)
      .ilike('name', like)
      .order('event_date', { ascending: false, nullsFirst: false })
      .limit(8),
    supabase
      .from('conversations')
      .select('id, title, last_message_at')
      .eq('association_id', associationId)
      .ilike('title', like)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(8),
  ])

  // Filter members in memory (search across full_name and email of joined profile)
  const lower = q.toLowerCase()
  const members: SearchHit[] = []
  for (const m of (membersRes.data ?? [])) {
    const profile = Array.isArray(m.user_profiles) ? m.user_profiles[0] : m.user_profiles
    const name = profile?.full_name ?? ''
    const email = profile?.email ?? ''
    if (
      name.toLowerCase().includes(lower) ||
      email.toLowerCase().includes(lower)
    ) {
      members.push({
        type: 'member',
        id: m.id,
        title: name || email,
        subtitle: name ? email : null,
        href: '/dashboard/members',
      })
    }
    if (members.length >= 6) break
  }

  return {
    members,
    documents: (docsRes.data ?? []).map(d => ({
      type: 'document' as const,
      id: d.id,
      title: d.name,
      subtitle: d.folder ?? null,
      href: '/dashboard/documents',
    })),
    tasks: (tasksRes.data ?? []).map(t => ({
      type: 'task' as const,
      id: t.id,
      title: t.title,
      subtitle: t.status,
      href: '/dashboard/tasks',
    })),
    events: (eventsRes.data ?? []).map(e => ({
      type: 'event' as const,
      id: e.id,
      title: e.name,
      subtitle: e.event_date ?? e.status,
      href: '/dashboard/finances',
    })),
    conversations: (convRes.data ?? []).map(c => ({
      type: 'conversation' as const,
      id: c.id,
      title: c.title ?? 'Conversation',
      subtitle: null,
      href: `/dashboard/messages?c=${c.id}`,
    })),
  }
}
