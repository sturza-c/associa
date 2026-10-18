'use server'

import { z } from 'zod'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { PILOT_SPOTS } from '@/lib/waitlist-config'

// Waitlist for the pilot programme (landing page). Written through the service role only.

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

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

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

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const pilot = position <= PILOT_SPOTS
      await resend.emails.send({
        from: 'Associa <noreply@getassocia.me>',
        to: d.email,
        subject: pilot ? 'Votre place dans le programme pilote Associa' : 'Vous êtes sur la liste d’attente Associa',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a2e">
            <h2 style="margin:0 0 8px;font-size:22px">Merci ${escapeHtml(d.contactName.split(' ')[0])} !</h2>
            <p style="color:#555;margin:0 0 16px">
              <strong>${escapeHtml(d.associationName)}</strong> est bien inscrite
              ${pilot ? `parmi les ${PILOT_SPOTS} associations du programme pilote (n° ${position}).` : 'sur la liste d’attente.'}
            </p>
            <p style="color:#555;margin:0 0 24px">
              Nous vous recontactons personnellement pour vous présenter Associa et préparer l’espace de votre association.
            </p>
            <p style="color:#999;font-size:12px;margin:0">Associa · Gérez votre association simplement · getassocia.me</p>
          </div>`,
      })
    } catch (e) {
      console.error('joinWaitlist email error:', e)
    }
  }

  return { success: true, position }
}
