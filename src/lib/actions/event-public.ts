'use server'

import { z } from 'zod'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

// Sign-up from an association's public page (/a/[slug]) — no Associa account needed.

const SignupSchema = z.object({
  slug: z.string().min(1).max(80),
  eventId: z.string().uuid(),
  fullName: z.string().trim().min(2, 'Indique ton nom').max(80, 'Nom trop long'),
  email: z.string().trim().toLowerCase().email('Adresse e-mail invalide').max(160),
  note: z.string().trim().max(280, 'Message trop long (280 caractères max.)').optional(),
  // honeypot: real people never see nor fill this field
  website: z.string().max(0).optional(),
})

export type PublicSignupInput = z.input<typeof SignupSchema>

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export async function registerForPublicEvent(input: PublicSignupInput) {
  const parsed = SignupSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide' }
  const { slug, eventId, fullName, email, note, website } = parsed.data
  if (website) return { success: true } // bot: pretend it worked

  const admin = createAdminClient()

  const { data: assoc } = await admin
    .from('associations')
    .select('id, name')
    .eq('slug', slug)
    .eq('is_public', true)
    .single()
  if (!assoc) return { error: 'Association introuvable' }

  const { data: event } = await admin
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('association_id', assoc.id)
    .single()
  if (!event) return { error: 'Événement introuvable' }
  if (event.public_signup !== true) return { error: 'Les inscriptions ne sont pas ouvertes pour cet événement' }
  if (['cancelled', 'done'].includes(event.status)) return { error: 'Cet événement n\'accepte plus d\'inscriptions' }
  if (event.event_date && event.event_date < todayIso()) return { error: 'Cet événement est déjà passé' }

  if (event.max_participants) {
    const [{ count: going }, { count: external }] = await Promise.all([
      admin.from('event_participants').select('id', { count: 'exact', head: true }).eq('event_id', eventId).eq('response', 'going'),
      admin.from('event_registrations').select('id', { count: 'exact', head: true }).eq('event_id', eventId),
    ])
    if ((going ?? 0) + (external ?? 0) >= event.max_participants) return { error: 'Désolé, l\'événement est complet' }
  }

  const { error } = await admin
    .from('event_registrations')
    .insert({ event_id: eventId, full_name: fullName, email, note: note || null })

  if (error) {
    if (error.code === '23505') return { error: 'Tu es déjà inscrit·e avec cette adresse' }
    if (error.code === '42P01') return { error: 'Les inscriptions en ligne arrivent bientôt' }
    console.error('registerForPublicEvent error:', error)
    return { error: 'Inscription impossible pour le moment' }
  }

  // Confirmation e-mail (best effort — the sign-up is already saved)
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const when = event.event_date
        ? new Date(event.event_date + 'T00:00:00').toLocaleDateString('fr-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : null
      const time = event.start_time ? ` · ${String(event.start_time).slice(0, 5)}` : ''
      await resend.emails.send({
        from: `${assoc.name} <noreply@getassocia.me>`,
        to: email,
        subject: `Inscription confirmée — ${event.name}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a2e">
            <h2 style="margin:0 0 8px;font-size:22px">C'est noté, ${escapeHtml(fullName)} !</h2>
            <p style="color:#555;margin:0 0 24px">Ton inscription à <strong>${escapeHtml(event.name)}</strong> est confirmée.</p>
            <div style="background:#f5f5f5;border-radius:12px;padding:16px 20px;margin:0 0 24px;color:#333">
              ${when ? `<p style="margin:0 0 6px"><strong style="text-transform:capitalize">${escapeHtml(when)}</strong>${escapeHtml(time)}</p>` : ''}
              ${event.location ? `<p style="margin:0">${escapeHtml(event.location)}</p>` : ''}
            </div>
            <p style="color:#999;font-size:12px;margin:0">${escapeHtml(assoc.name)} · géré avec Associa</p>
          </div>`,
      })
    } catch (e) {
      console.error('registerForPublicEvent email error:', e)
    }
  }

  return { success: true }
}
