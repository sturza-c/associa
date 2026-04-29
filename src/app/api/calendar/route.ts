import { NextRequest, NextResponse } from 'next/server'
import { getCalendarItems, getCalendarToken } from '@/lib/actions/calendar'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const associationId = searchParams.get('associationId')
  const rangeStart = searchParams.get('rangeStart')
  const rangeEnd = searchParams.get('rangeEnd')

  if (!associationId || !rangeStart || !rangeEnd) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const [items, token] = await Promise.all([
    getCalendarItems(associationId, rangeStart, rangeEnd),
    getCalendarToken(associationId),
  ])

  return NextResponse.json({ items, token })
}
