'use client'

import useSWR from 'swr'
import { useSearchParams } from 'next/navigation'
import { useAssociation } from '@/contexts/association-context'
import { CalendarClient, ymd, getMonday, type ViewType } from './calendar-client'
import CalendarLoading from '@/app/dashboard/calendar/loading'

const fetcher = (url: string) => fetch(url).then(r => r.json())

// ─── Range helpers ────────────────────────────────────────────────────────────

function monthGridRange(anchor: Date) {
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const startOffset  = (firstOfMonth.getDay() + 6) % 7
  const gridStart    = new Date(anchor.getFullYear(), anchor.getMonth(), 1 - startOffset)
  const gridEnd      = new Date(gridStart); gridEnd.setDate(gridEnd.getDate() + 41)
  return { rangeStart: ymd(gridStart), rangeEnd: ymd(gridEnd) }
}

function weekRange(anchor: Date) {
  const mon = getMonday(anchor)
  const sun = new Date(mon); sun.setDate(sun.getDate() + 6)
  return { rangeStart: ymd(mon), rangeEnd: ymd(sun) }
}

function agendaRange(anchor: Date) {
  const end = new Date(anchor); end.setDate(end.getDate() + 89)
  return { rangeStart: ymd(anchor), rangeEnd: ymd(end) }
}

// ─── View ─────────────────────────────────────────────────────────────────────

export function CalendarView() {
  const { activeMembership } = useAssociation()
  const searchParams = useSearchParams()

  // ── Parse URL params ──────────────────────────────────────────
  const rawV = searchParams.get('v')
  const view: ViewType = rawV === 'week' || rawV === 'agenda' ? rawV : 'month'

  // Support ?d=YYYY-MM-DD (new) and legacy ?m=YYYY-MM
  const today = new Date()
  let anchor: Date

  const rawD = searchParams.get('d')
  if (rawD && /^\d{4}-\d{2}-\d{2}$/.test(rawD)) {
    const parsed = new Date(rawD + 'T00:00:00')
    anchor = isNaN(parsed.getTime()) ? today : parsed
  } else {
    const rawM = searchParams.get('m')
    if (rawM && /^\d{4}-\d{2}$/.test(rawM)) {
      const [y, mo] = rawM.split('-').map(Number)
      anchor = new Date(y, mo - 1, 1)
    } else {
      anchor = today
    }
  }

  // ── Date range for API ────────────────────────────────────────
  const { rangeStart, rangeEnd } =
    view === 'week'  ? weekRange(anchor)
    : view === 'agenda' ? agendaRange(anchor)
    : monthGridRange(anchor)

  // ── Fetch ─────────────────────────────────────────────────────
  const { data } = useSWR(
    activeMembership
      ? `/api/calendar?associationId=${activeMembership.association_id}&rangeStart=${rangeStart}&rangeEnd=${rangeEnd}`
      : null,
    fetcher,
  )

  if (!activeMembership || !data) return <CalendarLoading />

  return (
    <CalendarClient
      view={view}
      anchor={ymd(anchor)}
      items={data.items}
      associationId={activeMembership.association_id}
      callerRole={activeMembership.role}
      calendarToken={data.token}
    />
  )
}
