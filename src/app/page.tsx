import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Landing } from '@/features/landing/landing'
import { getWaitlistCount } from '@/lib/actions/waitlist'
import { PILOT_SPOTS } from '@/lib/waitlist-config'
import { isBetaAllowed } from '@/lib/beta'

export const metadata: Metadata = {
  title: 'Associa — Gérez votre association simplement',
  description: 'Membres, cotisations, événements, inscriptions, agenda, documents et photos réunis dans un seul espace. Bêta privée : 10 associations pilotes.',
}

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // beta members go straight to their space; everyone else sees the landing page
  if (user && isBetaAllowed(user.email)) redirect('/dashboard')

  const count = await getWaitlistCount()
  const spotsLeft = Math.max(0, PILOT_SPOTS - (count ?? 0))
  return <Landing spotsLeft={spotsLeft} />
}
