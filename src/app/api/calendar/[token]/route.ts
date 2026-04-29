import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Read-only iCalendar feed for a single association.
// URL: /api/calendar/<calendar_token>
//
// Anyone with the token can subscribe. The president can rotate the token
// from the calendar page to revoke previous subscriptions.

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function fmtDate(date: string): string {
  // YYYY-MM-DD → YYYYMMDD for DTSTART;VALUE=DATE
  return date.replace(/-/g, '')
}

function nowStamp(): string {
  // YYYYMMDDTHHMMSSZ
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
    return new NextResponse('Invalid token', { status: 400 })
  }

  const admin = createAdminClient()

  const { data: assoc, error } = await admin
    .from('associations')
    .select('id, name')
    .eq('calendar_token', token)
    .single()

  if (error || !assoc) {
    return new NextResponse('Not found', { status: 404 })
  }

  const [eventsRes, tasksRes] = await Promise.all([
    admin
      .from('event_budgets')
      .select('id, name, description, event_date, updated_at')
      .eq('association_id', assoc.id)
      .not('event_date', 'is', null),
    admin
      .from('tasks')
      .select('id, title, description, due_date, status, updated_at')
      .eq('association_id', assoc.id)
      .not('due_date', 'is', null)
      .neq('status', 'done'),
  ])

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Associa//Calendar//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICS(assoc.name)}`,
    `X-WR-CALDESC:${escapeICS(`Calendrier ${assoc.name}`)}`,
    'X-WR-TIMEZONE:Europe/Zurich',
  ]

  const stamp = nowStamp()

  for (const e of eventsRes.data ?? []) {
    if (!e.event_date) continue
    lines.push(
      'BEGIN:VEVENT',
      `UID:event-${e.id}@associa`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${fmtDate(e.event_date)}`,
      `SUMMARY:${escapeICS(e.name)}`,
      e.description ? `DESCRIPTION:${escapeICS(e.description)}` : '',
      'CATEGORIES:Événement',
      'END:VEVENT'
    )
  }

  for (const t of tasksRes.data ?? []) {
    if (!t.due_date) continue
    lines.push(
      'BEGIN:VEVENT',
      `UID:task-${t.id}@associa`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${fmtDate(t.due_date)}`,
      `SUMMARY:${escapeICS(`✓ ${t.title}`)}`,
      t.description ? `DESCRIPTION:${escapeICS(t.description)}` : '',
      'CATEGORIES:Tâche',
      'END:VEVENT'
    )
  }

  lines.push('END:VCALENDAR')

  const body = lines.filter(Boolean).join('\r\n')

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Content-Disposition': `inline; filename="${assoc.name.replace(/[^a-z0-9]/gi, '_')}.ics"`,
    },
  })
}
