import { Suspense } from 'react'
import { CalendarView } from '@/features/calendar/calendar-view'
import CalendarLoading from './loading'

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarLoading />}>
      <CalendarView />
    </Suspense>
  )
}
