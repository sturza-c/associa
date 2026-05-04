import { redirect } from 'next/navigation'
import { getActiveMembership } from '@/lib/actions/active-association'
import { getNotes } from '@/lib/actions/notes'
import { NotesView } from '@/features/notes/notes-view'
import { createClient } from '@/lib/supabase/server'

export default async function NotesPage() {
  const activeMembership = await getActiveMembership()
  if (!activeMembership) redirect('/onboarding')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { notes, folders } = await getNotes(activeMembership.association_id)

  return (
    <NotesView
      associationId={activeMembership.association_id}
      callerUserId={user?.id ?? ''}
      initialData={{ notes, folders }}
    />
  )
}
