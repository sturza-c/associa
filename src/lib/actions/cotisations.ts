'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'

const REVALIDATE = () => revalidatePath('/dashboard/cotisations')

async function assertManager(associationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' as const }

  const { data: m } = await supabase
    .from('association_memberships')
    .select('role')
    .eq('association_id', associationId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!m || !['president', 'treasurer', 'secretary'].includes(m.role)) {
    return { error: 'Permission insuffisante' as const }
  }
  return { user }
}

// ─── Init year ────────────────────────────────────────────────────────────────
// Creates one cotisation record per active member for the given year.
// Skips members who already have a record for that year.

export async function initCotisationYear(
  associationId: string,
  year: number,
  amountDue: number,
) {
  const auth = await assertManager(associationId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()

  const { data: members } = await admin
    .from('association_memberships')
    .select('id')
    .eq('association_id', associationId)
    .eq('is_active', true)

  if (!members || members.length === 0) return { error: 'Aucun membre actif' }

  // Get existing records to avoid duplicates
  const { data: existing } = await admin
    .from('cotisations')
    .select('membership_id')
    .eq('association_id', associationId)
    .eq('year', year)

  const existingSet = new Set((existing ?? []).map(r => r.membership_id))
  const toInsert = members
    .filter(m => !existingSet.has(m.id))
    .map(m => ({
      association_id: associationId,
      membership_id: m.id,
      year,
      amount_due: amountDue,
      amount_paid: 0,
    }))

  if (toInsert.length === 0) return { error: `Tous les membres ont déjà une cotisation pour ${year}` }

  const { error } = await admin.from('cotisations').insert(toInsert)
  if (error) {
    if (error.code === '42P01') return { error: 'Table cotisations manquante — exécute sql/cotisations.sql' }
    console.error('initCotisationYear error:', error.message)
    return { error: 'Erreur lors de la création' }
  }

  REVALIDATE()
  return { success: true, created: toInsert.length }
}

// ─── Record payment ───────────────────────────────────────────────────────────

export async function recordPayment(
  cotisationId: string,
  associationId: string,
  amountPaid: number,
  method: string | null,
  notes: string | null,
) {
  const auth = await assertManager(associationId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('cotisations')
    .update({
      amount_paid: amountPaid,
      payment_method: method || null,
      notes: notes?.trim() || null,
      paid_at: amountPaid > 0 ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cotisationId)
    .eq('association_id', associationId)

  if (error) return { error: 'Erreur lors de la mise à jour' }
  REVALIDATE()
  return { success: true }
}

// ─── Update amount due ────────────────────────────────────────────────────────

export async function updateAmountDue(
  cotisationId: string,
  associationId: string,
  amountDue: number,
) {
  const auth = await assertManager(associationId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('cotisations')
    .update({ amount_due: amountDue, updated_at: new Date().toISOString() })
    .eq('id', cotisationId)
    .eq('association_id', associationId)

  if (error) return { error: 'Erreur lors de la mise à jour' }
  REVALIDATE()
  return { success: true }
}

// ─── Delete cotisation record ─────────────────────────────────────────────────

export async function deleteCotisation(cotisationId: string, associationId: string) {
  const auth = await assertManager(associationId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('cotisations')
    .delete()
    .eq('id', cotisationId)
    .eq('association_id', associationId)

  if (error) return { error: 'Erreur lors de la suppression' }
  REVALIDATE()
  return { success: true }
}

// ─── Add manual payment (upsert) ─────────────────────────────────────────────
// Creates or updates a cotisation record for a single member + year.

export async function addManualPayment(
  associationId: string,
  membershipId: string,
  year: number,
  amountDue: number,
  amountPaid: number,
  method: string | null,
  notes: string | null,
) {
  const auth = await assertManager(associationId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()

  // Check if a record already exists
  const { data: existing } = await admin
    .from('cotisations')
    .select('id')
    .eq('association_id', associationId)
    .eq('membership_id', membershipId)
    .eq('year', year)
    .maybeSingle()

  const payload = {
    association_id: associationId,
    membership_id: membershipId,
    year,
    amount_due: amountDue,
    amount_paid: amountPaid,
    payment_method: method || null,
    notes: notes?.trim() || null,
    paid_at: amountPaid > 0 ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }

  let error
  if (existing?.id) {
    ;({ error } = await admin.from('cotisations').update(payload).eq('id', existing.id))
  } else {
    ;({ error } = await admin.from('cotisations').insert(payload))
  }

  if (error) {
    if (error.code === '42P01') return { error: 'Table cotisations manquante — exécute sql/cotisations.sql' }
    console.error('addManualPayment error:', error.message)
    return { error: 'Erreur lors de l\'enregistrement' }
  }

  REVALIDATE()
  return { success: true }
}

// ─── Send reminders ───────────────────────────────────────────────────────────

export async function sendCotisationReminders(
  associationId: string,
  year: number,
) {
  const auth = await assertManager(associationId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()

  // Get unpaid cotisations with member emails
  const { data: unpaid } = await admin
    .from('cotisations')
    .select(`
      id, amount_due, amount_paid,
      association_memberships (
        user_profiles ( full_name, email )
      )
    `)
    .eq('association_id', associationId)
    .eq('year', year)
    .lt('amount_paid', admin.from('cotisations').select('amount_due') as unknown as number)

  // Fallback: fetch all and filter client-side
  const { data: all } = await admin
    .from('cotisations')
    .select(`
      id, amount_due, amount_paid,
      association_memberships (
        user_profiles ( full_name, email )
      )
    `)
    .eq('association_id', associationId)
    .eq('year', year)

  const { data: assoc } = await admin
    .from('associations')
    .select('name')
    .eq('id', associationId)
    .single()

  const unpaidRows = (all ?? []).filter(r => Number(r.amount_paid) < Number(r.amount_due))
  if (unpaidRows.length === 0) return { error: 'Aucun membre impayé pour cette année' }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return { error: 'RESEND_API_KEY manquant' }

  const resend = new Resend(resendKey)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://getassocia.me'
  const assocName = assoc?.name ?? 'Votre association'

  let sent = 0
  const errors: string[] = []

  for (const row of unpaidRows) {
    const membership = Array.isArray(row.association_memberships)
      ? row.association_memberships[0]
      : row.association_memberships
    const profile = Array.isArray(membership?.user_profiles)
      ? membership?.user_profiles[0]
      : membership?.user_profiles

    const email = profile?.email
    const name = profile?.full_name ?? email ?? ''
    const due = Number(row.amount_due)
    const paid = Number(row.amount_paid)
    const remaining = due - paid

    if (!email) continue

    const { error: sendError } = await resend.emails.send({
      from: `${assocName} <noreply@getassocia.me>`,
      to: email,
      subject: `Rappel cotisation ${year} — ${assocName}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a1a2e">
          <h2 style="margin:0 0 8px;font-size:22px">Rappel de cotisation ${year}</h2>
          <p style="color:#555;margin:0 0 24px">Bonjour ${name},</p>
          <p style="color:#555;margin:0 0 16px">
            Nous vous rappelons que votre cotisation ${year} pour <strong>${assocName}</strong> est en attente de règlement.
          </p>
          <div style="background:#f5f5f5;border-radius:12px;padding:16px 20px;margin:0 0 24px">
            <p style="margin:0 0 6px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.05em">Montant dû</p>
            <p style="margin:0;font-size:28px;font-weight:700;color:#1a1a2e">CHF ${remaining.toFixed(2)}</p>
            ${paid > 0 ? `<p style="margin:4px 0 0;font-size:12px;color:#888">(CHF ${paid.toFixed(2)} déjà payé sur CHF ${due.toFixed(2)})</p>` : ''}
          </div>
          <p style="color:#555;margin:0 0 24px;font-size:14px">
            Pour toute question, contactez directement votre trésorier·ère.
          </p>
          <a href="${appUrl}/dashboard" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px">
            Accéder à ${assocName}
          </a>
        </div>
      `,
    })

    if (sendError) errors.push(email)
    else sent++
  }

  REVALIDATE()
  if (sent === 0) return { error: `Échec d'envoi : ${errors.join(', ')}` }
  return {
    success: true,
    sent,
    failed: errors.length,
    message: `${sent} rappel${sent > 1 ? 's' : ''} envoyé${sent > 1 ? 's' : ''}${errors.length > 0 ? `, ${errors.length} échec(s)` : ''}`,
  }
}
