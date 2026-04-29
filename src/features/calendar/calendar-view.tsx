'use client'

import useSWR from 'swr'
import { useSearchParams } from 'next/navigation'
import { useAssociation } from '@/contexts/association-context'
import { CalendarClient } from './calendar-client'
import CalendarLoading from '@/app/dashboard/calendar/loading'

const fetcher = (url: string) => fetch(url).then(r => r.json())

function getCalendarRange(year: number, month: number) {
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = (firstOfMonth.getDay() + 6) % 7
  const gridStart = new Date(year, month, 1 - startOffset)
  const gridEnd = new Date(gridStart)
  gridEnd.setDate(gridEnd.getDate() + 41)
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { rangeStart: fmt(gridStart), rangeEnd: fmt(gridEnd) }
}

export function CalendarView() {
  const { activeMembership } = useAssociation()
  const searchParams = useSearchParams()

  const today = new Date()
  let year = today.getFullYear()
  let month = today.getMonth()
  const m = searchParams.get('m')
  if (m && /^\d{4}-\d{2}$/.test(m)) {
    const [y, mo] = m.split('-').map(Number)
    year = y
    month = mo - 1
  }

  const { rangeStart, rangeEnd } = getCalendarRange(year, month)

  const { data, isLoading } = useSWR(
    activeMembership
      ? `/api/calendar?associationId=${activeMembership.association_id}&rangeStart=${rangeStart}&rangeEnd=${rangeEnd}`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  if (!activeMembership || isLoading || !data) return <CalendarLoading />

  return (
    <CalendarClient
      year={year}
      month={month}
      items={data.items}
      associationId={activeMembership.association_id}
      callerRole={activeMembership.role}
      calendarToken={data.token}
    />
  )
}
