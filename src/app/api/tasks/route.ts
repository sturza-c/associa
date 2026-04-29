import { NextRequest, NextResponse } from 'next/server'
import { getTasks } from '@/lib/actions/tasks'
import { getMembers } from '@/lib/actions/members'

export async function GET(request: NextRequest) {
  const associationId = request.nextUrl.searchParams.get('associationId')
  if (!associationId) return NextResponse.json({ error: 'Missing associationId' }, { status: 400 })

  const [tasks, members] = await Promise.all([
    getTasks(associationId),
    getMembers(associationId),
  ])

  return NextResponse.json({ tasks, members })
}
