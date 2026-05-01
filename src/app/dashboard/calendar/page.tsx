import { redirect } from 'next/navigation'
import { getActiveMembership } from '@/lib/actions/active-association'
import { getCalendarItems, getCalendarToken } from '@/lib/actions/calendar'
import { CalendarView } from '@/features/calendar/calendar-view'
import type { ViewType } from '@/features/calendar/calendar-client'

function ymdDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getMondayOf(d: Date): Date {
  const r = new Date(d); const day = r.getDay()
  r.setDate(r.getDate() + (day === 0 ? -6 : 1 - day)); r.setHours(0, 0, 0, 0)
  return r
}

function computeRange(view: ViewType, anchor: Date) {
  if (view === 'week') {
    const mon = getMondayOf(anchor)
    const sun = new Date(mon); sun.setDate(sun.getDate() + 6)
    return { rangeStart: ymdDate(mon), rangeEnd: ymdDate(sun) }
  }
  if (view === 'agenda') {
    const end = new Date(anchor); end.setDate(end.getDate() + 89)
    return { rangeStart: ymdDate(anchor), rangeEnd: ymdDate(end) }
  }
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1 - offset)
  const end2 = new Date(start); end2.setDate(end2.getDate() + 41)
  return { rangeStart: ymdDate(start), rangeEnd: ymdDate(end2) }
}

interface PageProps {
  searchParams: Promise<{ v?: string; d?: string; m?: string }>
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const activeMembership = await getActiveMembership()
  if (!activeMembership) redirect('/onboarding')

  const params = await searchParams
  const rawV = params.v
  const view: ViewType = rawV === 'week' || rawV === 'agenda' ? rawV : 'month'

  const today = new Date()
  let anchor: Date
  const rawD = params.d
  if (rawD && /^\d{4}-\d{2}-\d{2}$/.test(rawD)) {
    const p = new Date(rawD + 'T00:00:00')
    anchor = isNaN(p.getTime()) ? today : p
  } else {
    const rawM = params.m
    if (rawM && /^\d{4}-\d{2}$/.test(rawM)) {
      const [y, mo] = rawM.split('-').map(Number)
      anchor = new Date(y, mo - 1, 1)
    } else {
      anchor = today
    }
  }

  const { rangeStart, rangeEnd } = computeRange(view, anchor)

  const [items, token] = await Promise.all([
    getCalendarItems(activeMembership.association_id, rangeStart, rangeEnd),
    getCalendarToken(activeMembership.association_id),
  ])

  return (
    <CalendarView
      view={view}
      anchor={ymdDate(anchor)}
      associationId={activeMembership.association_id}
      callerRole={activeMembership.role}
      initialData={{ items, token }}
    />
  )
}
