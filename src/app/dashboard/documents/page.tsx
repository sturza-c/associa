import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/actions/active-association'
import { getDocuments } from '@/lib/actions/documents'
import { getFolders } from '@/lib/actions/folders'
import { DocumentsClient } from '@/features/documents/documents-client'

export default async function DocumentsPage() {
  const supabase = await createClient()
  const [{ data: { user } }, activeMembership] = await Promise.all([
    supabase.auth.getUser(),
    getActiveMembership(),
  ])
  if (!user) redirect('/login')
  if (!activeMembership) redirect('/onboarding')

  const [documents, folders] = await Promise.all([
    getDocuments(activeMembership.association_id),
    getFolders(activeMembership.association_id),
  ])

  // Fetch uploader profiles in one batch.
  const uploaderIds = Array.from(new Set(documents.map(d => d.uploaded_by).filter(Boolean)))
  const uploaders: Record<string, { full_name: string | null; email: string }> = {}

  if (uploaderIds.length > 0) {
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

  return (
    <DocumentsClient
      documents={documents}
      folders={folders}
      uploaders={uploaders}
      associationId={activeMembership.association_id}
      callerRole={activeMembership.role}
      currentUserId={user.id}
    />
  )
}
