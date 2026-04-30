import { Suspense } from 'react'
import { EventsView } from '@/features/events/events-view'
import EventsLoading from './loading'

export default function EventsPage() {
  return (
    <Suspense fallback={<EventsLoading />}>
      <EventsView />
    </Suspense>
  )
}
