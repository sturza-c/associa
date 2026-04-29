import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/actions/active-association'
import { getCalendarItems, getCalendarToken } from '@/lib/actions/calendar'
import { CalendarClient } from '@/features/calendar/calendar-client'

interface PageProps {
  searchParams: Promise<{ m?: string }>
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const [{ data: { user } }, activeMembership] = await Promise.all([
    supabase.auth.getUser(),
    getActiveMembership(),
  ])
  if (!user) redirect('/login')
  if (!activeMembership) redirect('/onboarding')

  const params = await searchParams
  const today = new Date()
  let year = today.getFullYear()
  let month = today.getMonth() // 0..11

  if (params.m && /^\d{4}-\d{2}$/.test(params.m)) {
    const [y, m] = params.m.split('-').map(Number)
    year = y
    month = m - 1
  }

  // Range covering the visible grid (6 weeks starting Monday).
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = (firstOfMonth.getDay() + 6) % 7 // Monday-first
  const gridStart = new Date(year, month, 1 - startOffset)
  const gridEnd = new Date(gridStart)
  gridEnd.setDate(gridEnd.getDate() + 41)

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const [items, token] = await Promise.all([
    getCalendarItems(activeMembership.association_id, fmt(gridStart), fmt(gridEnd)),
    getCalendarToken(activeMembership.association_id),
  ])

  return (
    <CalendarClient
      year={year}
      month={month}
      items={items}
      associationId={activeMembership.association_id}
      callerRole={activeMembership.role}
      calendarToken={token}
    />
  )
}
