import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isBetaAllowed } from '@/lib/beta'
import { PILOT_SPOTS } from '@/lib/waitlist-config'
import { AssociaLogo } from '@/components/brand/associa-logo'
import { cn } from '@/lib/utils'

// Private list of waitlist sign-ups — only for allow-listed (BETA_ALLOWED_EMAILS) accounts.

export const metadata: Metadata = { title: 'Waitlist — Associa', robots: { index: false } }
export const dynamic = 'force-dynamic'

interface Row {
  id: string
  association_name: string
  contact_name: string
  email: string
  role: string | null
  members_count: string | null
  city: string | null
  message: string | null
  created_at: string
}

export default async function WaitlistAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/waitlist')
  if (!isBetaAllowed(user.email)) redirect('/')

  const admin = createAdminClient()
  const { data, error } = await admin.from('waitlist').select('*').order('created_at', { ascending: true })
  const rows = (data ?? []) as Row[]

  return (
    <div className="min-h-screen bg-[#03050d] px-5 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <AssociaLogo className="h-6 text-white" />
            <h1 className="mt-6 font-heading text-5xl italic">Waitlist</h1>
            <p className="mt-2 text-white/55">
              {rows.length} inscription{rows.length !== 1 ? 's' : ''} ·{' '}
              {Math.min(rows.length, PILOT_SPOTS)}/{PILOT_SPOTS} places pilotes prises
            </p>
          </div>
          {rows.length > 0 && (
            <a href={`mailto:?bcc=${encodeURIComponent(rows.map(r => r.email).join(','))}&subject=${encodeURIComponent('Associa — programme pilote')}`}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#091B46] hover:bg-white/90">
              <Mail className="h-4 w-4" /> Écrire à tout le monde (Cci)
            </a>
          )}
        </div>

        {error && (
          <p className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-200">
            Table introuvable — exécute <code>sql/waitlist.sql</code> dans Supabase.
          </p>
        )}

        {!error && rows.length === 0 && (
          <p className="mt-10 rounded-2xl border border-dashed border-white/15 p-10 text-center text-white/50">Aucune inscription pour l&apos;instant.</p>
        )}

        <div className="mt-8 space-y-3">
          {rows.map((r, i) => (
            <div key={r.id} className={cn('rounded-2xl border p-5', i < PILOT_SPOTS ? 'border-violet-400/25 bg-violet-500/[0.06]' : 'border-white/10 bg-white/[0.03]')}>
              <div className="flex flex-wrap items-start gap-4">
                <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold', i < PILOT_SPOTS ? 'bg-violet-500/20 text-violet-200' : 'bg-white/10 text-white/60')}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold">{r.association_name}</p>
                  <p className="mt-0.5 text-sm text-white/60">
                    {r.contact_name}
                    {r.role && <> · {r.role}</>}
                    {r.members_count && <> · {r.members_count} membres</>}
                    {r.city && <> · {r.city}</>}
                  </p>
                  {r.message && <p className="mt-3 whitespace-pre-wrap rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-white/75">« {r.message} »</p>}
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                  <a href={`mailto:${r.email}?subject=${encodeURIComponent('Associa — votre place dans le programme pilote')}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10">
                    <Mail className="h-3.5 w-3.5" />{r.email}
                  </a>
                  <span className="text-xs text-white/40">
                    {new Date(r.created_at).toLocaleString('fr-CH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {i >= PILOT_SPOTS && ' · liste d’attente'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
