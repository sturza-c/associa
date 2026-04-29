import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDocuments } from '@/lib/actions/documents'
import { getFolders } from '@/lib/actions/folders'

export async function GET(request: NextRequest) {
  const associationId = request.nextUrl.searchParams.get('associationId')
  if (!associationId) return NextResponse.json({ error: 'Missing associationId' }, { status: 400 })

  const [documents, folders] = await Promise.all([
    getDocuments(associationId),
    getFolders(associationId),
  ])

  const uploaderIds = Array.from(new Set(documents.map(d => d.uploaded_by).filter(Boolean)))
  const uploaders: Record<string, { full_name: string | null; email: string }> = {}
  if (uploaderIds.length > 0) {
    const supabase = await createClient()
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .in('id', uploaderIds)
    if (profiles) {
      for (const p of profiles) {
        uploaders[p.id] = { full_name: p.full_name, email: p.email }
      }
    }
  }

  return NextResponse.json({ documents, folders, uploaders })
}
