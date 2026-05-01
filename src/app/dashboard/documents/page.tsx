import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/actions/active-association'
import { getDocuments } from '@/lib/actions/documents'
import { getFolders } from '@/lib/actions/folders'
import { DocumentsView } from '@/features/documents/documents-view'

export default async function DocumentsPage() {
  const activeMembership = await getActiveMembership()
  if (!activeMembership) redirect('/onboarding')

  const associationId = activeMembership.association_id
  const [documents, folders] = await Promise.all([
    getDocuments(associationId),
    getFolders(associationId),
  ])

  const uploaderIds = [...new Set(documents.map(d => d.uploaded_by).filter(Boolean))] as string[]
  const uploaders: Record<string, { full_name: string | null; email: string }> = {}
  if (uploaderIds.length > 0) {
    const supabase = await createClient()
    const { data: profiles } = await supabase
      .from('user_profiles').select('id, full_name, email').in('id', uploaderIds)
    for (const p of profiles ?? []) uploaders[p.id] = { full_name: p.full_name, email: p.email }
  }

  return (
    <DocumentsView
      associationId={associationId}
      callerRole={activeMembership.role}
      currentUserId={activeMembership.user_id}
      initialData={{ documents, folders, uploaders }}
    />
  )
}
