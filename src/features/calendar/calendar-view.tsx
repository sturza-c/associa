'use client'

import useSWR from 'swr'
import { CalendarClient, ymd, getMonday, type ViewType } from './calendar-client'
import { CalendarSkeleton } from '@/components/ui/skeleton-layouts'
import type { Role } from '@/types/database'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function monthGridRange(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1 - offset)
  const end = new Date(start); end.setDate(end.getDate() + 41)
  return { rangeStart: ymd(start), rangeEnd: ymd(end) }
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

interface Props {
  view: ViewType
  anchor: string          // YYYY-MM-DD
  associationId: string
  callerRole: Role
  initialData?: { items: unknown[]; token: string | null }
}

export function CalendarView({ view, anchor, associationId, callerRole, initialData }: Props) {
  const anchorDate = new Date(anchor + 'T00:00:00')

  const { rangeStart, rangeEnd } =
    view === 'week'   ? weekRange(anchorDate)
    : view === 'agenda' ? agendaRange(anchorDate)
    : monthGridRange(anchorDate)

  const { data } = useSWR(
    `/api/calendar?associationId=${associationId}&rangeStart=${rangeStart}&rangeEnd=${rangeEnd}`,
    fetcher,
    { fallbackData: initialData },
  )

  if (!data) return <CalendarSkeleton />

  return (
    <CalendarClient
      view={view}
      anchor={anchor}
      items={data.items}
      associationId={associationId}
      callerRole={callerRole}
      calendarToken={data.token}
    />
  )
}
