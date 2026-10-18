'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { Check, Loader2, Play, X } from 'lucide-react'
import { joinWaitlist } from '@/lib/actions/waitlist'
import { PILOT_SPOTS } from '@/lib/waitlist-config'
import { cn } from '@/lib/utils'

// ── Scroll reveal ─────────────────────────────────────────────────────────────

export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect() } }, { rootMargin: '0px 0px -10% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className={cn('transition-all duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)]', shown ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-[6px]', className)}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

// ── Video ─────────────────────────────────────────────────────────────────────

export function VideoButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden' // no page scroll behind the player
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = overflow }
  }, [open])
  return (
    <>
      <button onClick={() => setOpen(true)} className={cn('group inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.04] pl-2 pr-5 py-2 text-sm font-medium text-white/85 backdrop-blur-md hover:bg-white/[0.08] transition-colors', className)}>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#091B46] transition-transform group-hover:scale-110">
          <Play className="h-3.5 w-3.5 translate-x-[1px] fill-current" />
        </span>
        Voir la vidéo · 45 s
      </button>
      {/* portal: ancestors use transform/filter (scroll reveal), which would trap a fixed overlay */}
      {open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div className="relative w-full max-w-5xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} aria-label="Fermer" className="absolute -top-11 right-0 p-2 text-white/70 hover:text-white"><X className="h-5 w-5" /></button>
            <video src="/video/associa-45s.mp4" poster="/video/associa-45s-poster.jpg" controls autoPlay playsInline
              className="w-full rounded-2xl shadow-2xl ring-1 ring-white/10 bg-black" />
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

// ── Waitlist form ─────────────────────────────────────────────────────────────

const field = 'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[15px] text-white placeholder:text-white/35 outline-none transition focus:border-violet-400/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-violet-500/15'

export function WaitlistForm({ spotsLeft }: { spotsLeft: number }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ position: number } | null>(null)

  if (done) {
    const pilot = done.position > 0 && done.position <= PILOT_SPOTS
    return (
      <div className="rounded-3xl border border-emerald-400/25 bg-emerald-400/[0.07] p-8 text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-emerald-400/15 text-emerald-300"><Check className="h-7 w-7" /></div>
        <h3 className="font-heading italic text-4xl text-white">C&apos;est noté !</h3>
        <p className="mt-3 text-white/70">
          {pilot
            ? <>Votre association rejoint le programme pilote — place <strong className="text-white">n° {done.position} sur {PILOT_SPOTS}</strong>.</>
            : <>Votre association est sur la liste d&apos;attente{done.position ? <> (n° {done.position})</> : null}.</>}
          {' '}Nous vous recontactons personnellement très vite.
        </p>
      </div>
    )
  }

  function submit(form: FormData) {
    setError(null)
    start(async () => {
      const r = await joinWaitlist({
        associationName: String(form.get('associationName') ?? ''),
        contactName: String(form.get('contactName') ?? ''),
        email: String(form.get('email') ?? ''),
        role: String(form.get('role') ?? '') || undefined,
        membersCount: String(form.get('membersCount') ?? '') || undefined,
        city: String(form.get('city') ?? '') || undefined,
        message: String(form.get('message') ?? '') || undefined,
        website: String(form.get('website') ?? ''),
      })
      if ('error' in r) setError(r.error)
      else setDone({ position: r.position })
    })
  }

  return (
    <form action={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="associationName" required minLength={2} maxLength={120} placeholder="Nom de l'association *" className={field} />
        <input name="city" maxLength={80} placeholder="Ville ou université" className={field} />
        <input name="contactName" required minLength={2} maxLength={80} placeholder="Prénom et nom *" autoComplete="name" className={field} />
        <input name="email" type="email" required maxLength={160} placeholder="E-mail *" autoComplete="email" className={field} />
        <select name="role" defaultValue="" className={cn(field, 'appearance-none')}>
          <option value="" disabled>Votre rôle</option>
          <option>Président·e</option><option>Trésorier·ère</option><option>Secrétaire</option><option>Membre du comité</option><option>Autre</option>
        </select>
        <select name="membersCount" defaultValue="" className={cn(field, 'appearance-none')}>
          <option value="" disabled>Nombre de membres</option>
          <option>Moins de 30</option><option>30 à 100</option><option>100 à 300</option><option>Plus de 300</option>
        </select>
      </div>
      <textarea name="message" maxLength={600} rows={3} placeholder="Ce qui vous complique la vie aujourd'hui (optionnel)" className={cn(field, 'resize-none')} />
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button type="submit" disabled={pending}
        className="group relative w-full overflow-hidden rounded-xl bg-white px-6 py-4 text-[15px] font-semibold text-[#091B46] shadow-[0_20px_60px_-15px_rgba(167,139,250,.6)] transition hover:shadow-[0_20px_70px_-10px_rgba(167,139,250,.8)] disabled:opacity-70">
        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {spotsLeft > 0 ? 'Réserver une place dans le programme pilote' : 'Rejoindre la liste d’attente'}
        </span>
      </button>
      <p className="text-center text-xs text-white/40">Aucun paiement demandé. Vos informations servent uniquement à vous recontacter.</p>
    </form>
  )
}
