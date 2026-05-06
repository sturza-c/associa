import { redirect } from 'next/navigation'
import { getActiveMembership } from '@/lib/actions/active-association'
import { CalendarView } from '@/features/calendar/calendar-view'
import type { ViewType } from '@/features/calendar/calendar-client'

function ymdDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

  return (
    <CalendarView
      view={view}
      anchor={ymdDate(anchor)}
      associationId={activeMembership.association_id}
      callerRole={activeMembership.role}
      initialData={{ items: [], token: null }}
    />
  )
}
