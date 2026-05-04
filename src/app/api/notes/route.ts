import { NextRequest, NextResponse } from 'next/server'
import { getNotes } from '@/lib/actions/notes'

export async function GET(request: NextRequest) {
  const associationId = request.nextUrl.searchParams.get('associationId')
  if (!associationId) return NextResponse.json({ error: 'Missing associationId' }, { status: 400 })

  const { notes, folders } = await getNotes(associationId)
  return NextResponse.json({ notes, folders })
}
