import { NextRequest, NextResponse } from 'next/server'
import { getConversations } from '@/lib/actions/messages'
import { getMembers } from '@/lib/actions/members'

export async function GET(request: NextRequest) {
  const associationId = request.nextUrl.searchParams.get('associationId')
  if (!associationId) return NextResponse.json({ error: 'Missing associationId' }, { status: 400 })

  const [conversations, members] = await Promise.all([
    getConversations(associationId),
    getMembers(associationId),
  ])

  return NextResponse.json({ conversations, members })
}
