'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

// Waitlist for the pilot programme (landing page). Written through the service role only.
// No automatic e-mail: sign-ups are reviewed on /admin/waitlist and contacted personally.

const Schema = z.object({
  associationName: z.string().trim().min(2, 'Indiquez le nom de votre association').max(120),
  contactName: z.string().trim().min(2, 'Indiquez votre nom').max(80),
  email: z.string().trim().toLowerCase().email('Adresse e-mail invalide').max(160),
  role: z.string().trim().max(60).optional(),
  membersCount: z.string().trim().max(20).optional(),
  city: z.string().trim().max(80).optional(),
  message: z.string().trim().max(600, 'Message trop long (600 caractères max.)').optional(),
  // honeypot: real people never see nor fill this field
  website: z.string().max(0).optional(),
})

export type WaitlistInput = z.input<typeof Schema>

/** Number of associations already on the list, or null if the table isn't there yet. */
export async function getWaitlistCount(): Promise<number | null> {
  try {
    const admin = createAdminClient()
    const { count, error } = await admin.from('waitlist').select('id', { count: 'exact', head: true })
    if (error) return null
    return count ?? 0
  } catch {
    return null
  }
}

export async function joinWaitlist(input: WaitlistInput): Promise<{ error: string } | { success: true; position: number }> {
  const parsed = Schema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide' }
  const d = parsed.data
  if (d.website) return { success: true, position: 0 } // bot: pretend it worked

  const admin = createAdminClient()
  const { error } = await admin.from('waitlist').insert({
    association_name: d.associationName,
    contact_name: d.contactName,
    email: d.email,
    role: d.role || null,
    members_count: d.membersCount || null,
    city: d.city || null,
    message: d.message || null,
  })

  if (error) {
    if (error.code === '23505') return { error: 'Cette adresse est déjà sur la liste — nous revenons vers vous très vite.' }
    console.error('joinWaitlist error:', error)
    return { error: 'Inscription impossible pour le moment, réessayez dans un instant.' }
  }

  const position = (await getWaitlistCount()) ?? 0

  return { success: true, position }
}
