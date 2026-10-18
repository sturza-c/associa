'use client'

import { useState, useTransition } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { registerForPublicEvent } from '@/lib/actions/event-public'

export function PublicSignup({ slug, eventId, accent, full }: {
  slug: string
  eventId: string
  accent: string
  full: boolean
}) {
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  if (done) {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-300">
        <Check className="h-4 w-4 shrink-0" />
        Inscription confirmée ! Un e-mail de confirmation est en route.
      </div>
    )
  }

  if (full) {
    return <p className="mt-4 text-xs font-medium text-muted-foreground">Complet</p>
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        style={{ backgroundColor: accent }}
      >
        S&apos;inscrire
      </button>
    )
  }

  function submit(form: FormData) {
    setError(null)
    start(async () => {
      const r = await registerForPublicEvent({
        slug,
        eventId,
        fullName: String(form.get('fullName') ?? ''),
        email: String(form.get('email') ?? ''),
        note: String(form.get('note') ?? '') || undefined,
        website: String(form.get('website') ?? ''),
      })
      if (r.error) setError(r.error)
      else setDone(true)
    })
  }

  const field = 'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50'

  return (
    <form action={submit} className="mt-4 space-y-2.5">
      <div className="grid sm:grid-cols-2 gap-2.5">
        <input name="fullName" required minLength={2} maxLength={80} placeholder="Prénom et nom" autoComplete="name" className={field} />
        <input name="email" type="email" required maxLength={160} placeholder="E-mail" autoComplete="email" className={field} />
      </div>
      <input name="note" maxLength={280} placeholder="Un mot pour les organisateurs (optionnel)" className={field} />
      {/* honeypot */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: accent }}
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Confirmer mon inscription
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
          Annuler
        </button>
      </div>
    </form>
  )
}
