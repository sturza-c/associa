import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const associationId = searchParams.get('associationId')
  if (!associationId) return NextResponse.json({ error: 'Missing associationId' }, { status: 400 })

  // Auth already verified by middleware — no auth.getUser() roundtrip needed
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()

  // Public sign-ups and photos live in their own tables (sql/event_signup_photos.sql);
  // they are fetched separately so the page keeps working before that migration runs.
  const [eventsRes, membersRes, regsRes, photosRes, assocRes] = await Promise.all([
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
    supabase
      .from('event_registrations')
      .select('*, events!inner(association_id)')
      .eq('events.association_id', associationId)
      .order('created_at', { ascending: true }),
    supabase
      .from('event_photos')
      .select('*')
      .eq('association_id', associationId)
      .order('created_at', { ascending: true }),
    supabase
      .from('associations')
      .select('slug, is_public')
      .eq('id', associationId)
      .single(),
  ])

  // Graceful degradation — table not yet created
  if (eventsRes.error?.code === '42P01') {
    return NextResponse.json({ events: [], members: membersRes.data ?? [], migrationNeeded: true })
  }

  const regs = regsRes.error ? [] : (regsRes.data ?? []).map(r => ({
    id: r.id, event_id: r.event_id, full_name: r.full_name, email: r.email, note: r.note, created_at: r.created_at,
  }))
  let photos = photosRes.error ? [] : (photosRes.data ?? [])

  // Members passed RLS on event_photos → sign the files for an hour
  if (photos.length) {
    const admin = createAdminClient()
    const { data: signed } = await admin.storage
      .from('event-photos')
      .createSignedUrls(photos.map(p => p.file_path), 3600)
    const byPath = new Map((signed ?? []).map(s => [s.path, s.signedUrl]))
    photos = photos.map(p => ({ ...p, url: byPath.get(p.file_path) ?? null }))
  }

  const events = (eventsRes.data ?? []).map(ev => ({
    ...ev,
    registrations: regs.filter(r => r.event_id === ev.id),
    photos: photos.filter(p => p.event_id === ev.id),
  }))

  const assoc = assocRes.data
  return NextResponse.json({
    events,
    members: membersRes.data ?? [],
    publicSlug: assoc?.is_public && assoc.slug ? assoc.slug : null,
    signupReady: !regsRes.error,
  })
}
