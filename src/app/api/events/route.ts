import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const associationId = searchParams.get('associationId')
  if (!associationId) return NextResponse.json({ error: 'Missing associationId' }, { status: 400 })

  // Auth already verified by middleware — no auth.getUser() roundtrip needed
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()

  const [eventsRes, membersRes] = await Promise.all([
    supabase
      .from('events')
      .select(`
        *,
        participants:event_participants( *, user_profiles(id, full_name, email, avatar_url) ),
        budget_items:event_budget_items(*),
        tasks:event_tasks(*)
      `)
      .eq('association_id', associationId)
      .order('event_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('association_memberships')
      .select('user_id, role, user_profiles(id, full_name, email, avatar_url)')
      .eq('association_id', associationId)
      .eq('is_active', true),
  ])

  // Graceful degradation — table not yet created
  if (eventsRes.error?.code === '42P01') {
    return NextResponse.json({ events: [], members: membersRes.data ?? [], migrationNeeded: true })
  }

  return NextResponse.json({
    events: eventsRes.data ?? [],
    members: membersRes.data ?? [],
  })
}
