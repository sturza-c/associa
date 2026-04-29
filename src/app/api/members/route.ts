import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMembers } from '@/lib/actions/members'
import { getPendingInvitations } from '@/lib/actions/invitations'
import type { AssociationTitle } from '@/types/database'

export async function GET(request: NextRequest) {
  const associationId = request.nextUrl.searchParams.get('associationId')
  if (!associationId) return NextResponse.json({ error: 'Missing associationId' }, { status: 400 })

  const supabase = await createClient()

  const [members, invitations] = await Promise.all([
    getMembers(associationId),
    getPendingInvitations(associationId),
  ])

  let titles: AssociationTitle[] = []
  const { data: titlesRows, error: titlesError } = await supabase
    .from('association_titles')
    .select('*')
    .eq('association_id', associationId)
    .order('position', { ascending: true })
  if (!titlesError && titlesRows) titles = titlesRows as AssociationTitle[]

  const memberTitleMap: Record<string, string[]> = {}
  const memberIds = members.map(m => m.id)
  if (memberIds.length > 0 && titles.length > 0) {
    const { data: assignments } = await supabase
      .from('membership_titles')
      .select('membership_id, title_id')
      .in('membership_id', memberIds)
    for (const a of assignments ?? []) {
      if (!memberTitleMap[a.membership_id]) memberTitleMap[a.membership_id] = []
      memberTitleMap[a.membership_id].push(a.title_id)
    }
  }

  return NextResponse.json({ members, invitations, titles, memberTitleMap })
}
