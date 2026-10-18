'use client'

// Demo-only views for /preview: agenda, event detail (public sign-ups + photos), public page.
import { useState } from 'react'
import {
  ChevronLeft, ChevronRight, LayoutGrid, CalendarDays, List, Link as LinkIcon, Copy, Check,
  Globe, Mail, ImagePlus, Users, MapPin, Clock, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AssociaLogo } from '@/components/brand/associa-logo'

export const ACCENT = '#7c3aed'
const hex = (o: number) => ACCENT + Math.round(o * 255).toString(16).padStart(2, '0')
const PUBLIC_URL = 'getassocia.me/a/esprits-curieux'

function Avatar({ initials, color = ACCENT, size = 'md' }: { initials: string; color?: string; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs'
  return (
    <div className={cn('flex items-center justify-center rounded-full font-semibold shrink-0', s)}
      style={{ backgroundColor: color + '22', color }}>
      {initials}
    </div>
  )
}

// ── Agenda ────────────────────────────────────────────────────────────────────

const WEEK_DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// May 2026 — events (indigo) and task deadlines (by priority)
const CAL_ITEMS: Record<number, { title: string; color: string }[]> = {
  5:  [{ title: 'Réunion du comité', color: '#6366f1' }],
  10: [{ title: "Commander L'Étranger", color: '#ef4444' }],
  12: [{ title: 'Atelier poésie', color: '#6366f1' }],
  15: [{ title: 'Préparer les questions', color: '#f59e0b' }],
  18: [{ title: "Commander Fahrenheit 451", color: '#ef4444' }, { title: 'Apéro des membres', color: '#6366f1' }],
  20: [{ title: 'Réserver la salle', color: '#ef4444' }],
  22: [{ title: "Café littéraire : L'Étranger", color: '#6366f1' }],
  25: [{ title: 'Envoyer les convocations AG', color: '#ef4444' }],
  28: [{ title: 'Ciné-club : 1984', color: '#6366f1' }],
  30: [{ title: 'Vote livre de juillet', color: '#f59e0b' }],
}

export function ViewCalendarDemo({ subscribeOpen = false }: { subscribeOpen?: boolean }) {
  const [shareOpen, setShareOpen] = useState(subscribeOpen)
  // May 2026 starts on a Friday → 4 leading days from April
  const cells = Array.from({ length: 35 }, (_, i) => {
    const day = i - 3
    if (day < 1) return { n: 27 + i, inMonth: false }
    if (day > 31) return { n: day - 31, inMonth: false }
    return { n: day, inMonth: true }
  })
  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Opérations</p>
          <h1 className="text-[28px] font-heading italic font-normal mt-0.5">Mai 2026</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-border bg-background/50 p-1">
            {([{ label: 'Mois', Icon: LayoutGrid, on: true }, { label: 'Semaine', Icon: CalendarDays, on: false }, { label: 'Agenda', Icon: List, on: false }]).map(({ label, Icon, on }) => (
              <span key={label} className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg', on ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground')}>
                <Icon className="h-3.5 w-3.5" />{label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="h-9 w-9 flex items-center justify-center rounded-lg border border-border"><ChevronLeft className="h-4 w-4" /></span>
            <span className="h-9 px-3 flex items-center text-sm rounded-lg border border-border">Aujourd&apos;hui</span>
            <span className="h-9 w-9 flex items-center justify-center rounded-lg border border-border"><ChevronRight className="h-4 w-4" /></span>
          </div>
          <button onClick={() => setShareOpen(true)} className="h-9 px-3 text-sm rounded-lg border border-border hover:bg-foreground/5 flex items-center gap-1.5">
            <LinkIcon className="h-3.5 w-3.5" /> S&apos;abonner
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="grid grid-cols-7 border-t border-border">
          {WEEK_DAYS_SHORT.map(d => (
            <div key={d} className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 border-r border-border last:border-r-0">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 border-l border-border">
          {cells.map(({ n, inMonth }, i) => {
            const items = inMonth ? CAL_ITEMS[n] ?? [] : []
            const today = inMonth && n === 17
            return (
              <div key={i} className={cn('border-r border-b border-border min-h-[104px] p-2', !inMonth && 'bg-foreground/[0.015]')}>
                <span className={cn('inline-flex h-6 min-w-6 items-center justify-center rounded-full text-xs tabular-nums px-1.5 mb-1',
                  today ? 'bg-foreground text-background font-semibold' : inMonth ? 'text-foreground' : 'text-muted-foreground/40')}>{n}</span>
                <div className="space-y-0.5">
                  {items.map(it => (
                    <div key={it.title} className="flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px]">
                      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: it.color }} />
                      <span className="truncate">{it.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {shareOpen && (
          <div className="absolute right-0 top-10 w-[420px] rounded-2xl border border-border bg-popover backdrop-blur-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold">S&apos;abonner au calendrier</h2>
              <button onClick={() => setShareOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-sm text-muted-foreground">Copie ce lien dans Apple Calendar, Google Calendar ou Outlook pour voir tous les événements et tâches.</p>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 text-xs font-mono text-muted-foreground">
              <span className="truncate">webcal://getassocia.me/api/calendar/aec-7f3k…</span>
              <Copy className="h-3.5 w-3.5 ml-auto shrink-0" />
            </div>
            <div className="flex gap-2">
              <span className="text-xs px-3 py-1.5 rounded-md bg-foreground text-background flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Ouvrir dans Calendrier</span>
              <span className="text-xs px-3 py-1.5 rounded-md border border-border">Télécharger .ics</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#6366f1]" /> Événements</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" /> Tâches urgentes</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" /> Tâches importantes</span>
      </div>
    </div>
  )
}

// ── Event detail ──────────────────────────────────────────────────────────────

export interface DemoEvent {
  id: number; name: string; date: string; time: string; location: string; status: string; participants: number
}

const REGISTRATIONS = [
  { name: 'Sophie Marchand', email: 'sophie.marchand@unine.ch', when: '12 mai', note: 'Je viens avec une amie' },
  { name: 'Julien Favre',    email: 'julien.favre@gmail.com',    when: '13 mai', note: null },
  { name: 'Emma Rochat',     email: 'emma.rochat@unige.ch',      when: '14 mai', note: 'Première fois !' },
  { name: 'Lucas Monnier',   email: 'lucas.monnier@bluewin.ch',  when: '15 mai', note: null },
  { name: 'Clara Perrin',    email: 'clara.perrin@unine.ch',     when: '16 mai', note: null },
]

const GOING = ['LR', 'MB', 'CM', 'AD', 'IL', 'TP', 'CD']
const PHOTOS = Array.from({ length: 8 }, (_, i) => `/demo/souvenirs/s${i + 1}.jpg`)

export function EventDetailDemo({ event, onBack }: { event: DemoEvent; onBack: () => void }) {
  const [copied, setCopied] = useState(false)
  const past = event.status === 'done'
  return (
    <div className="max-w-3xl space-y-7">
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2">
          <ChevronLeft className="h-3.5 w-3.5" /> Événements
        </button>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="h-1" style={{ backgroundColor: past ? '#94a3b8' : '#60a5fa' }} />
          <div className="p-6 space-y-3">
            <span className={cn('text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md border',
              past ? 'bg-muted text-muted-foreground border-border' : 'bg-blue-500/10 text-blue-400 border-blue-500/20')}>
              {past ? 'Terminé' : 'Planifié'}
            </span>
            <h2 className="font-heading italic font-normal text-4xl leading-tight">{event.name}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{event.date}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{event.time}</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.location}</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />Max. 30 participants</span>
            </div>
          </div>
        </div>
      </div>

      {/* Participants */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">Participants · {GOING.length + (past ? 0 : REGISTRATIONS.length)}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Ma réponse :</span>
          <span className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20"><Check className="h-3 w-3 inline mr-1" />Je participe</span>
          <span className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground">Peut-être</span>
          <span className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground">Absent</span>
        </div>
        <div className="flex -space-x-1.5">
          {GOING.map(i => <div key={i} className="ring-2 ring-background rounded-full"><Avatar initials={i} size="sm" /></div>)}
        </div>
      </section>

      {!past && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">Inscriptions via le lien public · {REGISTRATIONS.length}</h3>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">Ouvertes
              <span className="relative h-5 w-9 rounded-full bg-emerald-500"><span className="absolute top-0.5 left-[18px] h-4 w-4 rounded-full bg-white shadow" /></span>
            </span>
          </div>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <div className="h-8 w-8 rounded-lg bg-violet-500/10 text-violet-300 flex items-center justify-center"><Globe className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{PUBLIC_URL}</p>
                <p className="text-[11px] text-muted-foreground">Partagez ce lien : chacun voit les prochains événements et peut s&apos;inscrire.</p>
              </div>
              <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}{copied ? 'Copié' : 'Copier le lien'}
              </button>
            </div>
            <div className="divide-y divide-border">
              {REGISTRATIONS.map(r => (
                <div key={r.email} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="h-7 w-7 rounded-full bg-emerald-500/10 text-emerald-300 flex items-center justify-center text-[10px] font-semibold">
                    {r.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate"><Mail className="h-3 w-3 inline mr-1 -mt-0.5" />{r.email}{r.note ? ` · « ${r.note} »` : ''}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground/60">{r.when}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">Souvenirs · {past ? PHOTOS.length : 0} photos</h3>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium"><ImagePlus className="h-3.5 w-3.5" /> Ajouter des photos</span>
        </div>
        {past ? (
          <div className="grid grid-cols-4 gap-2">
            {PHOTOS.map(src => (
              <div key={src} className="aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full rounded-2xl border border-dashed border-border py-8 flex flex-col items-center gap-2 text-center">
            <ImagePlus className="h-6 w-6 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">Déposez ici les photos de l&apos;événement</p>
          </div>
        )}
      </section>
    </div>
  )
}

// ── Public page (/preview/a) ──────────────────────────────────────────────────

const PUBLIC_EVENTS = [
  { id: 1, month: 'mai',  day: 22, name: "Café littéraire : L'Étranger", when: 'Dans 5 j · vendredi 22 mai 2026', time: '18:30', place: 'Salle B204', left: 18 },
  { id: 2, month: 'mai',  day: 28, name: 'Ciné-club : 1984',               when: 'Dans 11 j · jeudi 28 mai 2026',   time: '19:00', place: 'Cinéma Apollo', left: 4 },
  { id: 3, month: 'juin', day: 15, name: 'Assemblée Générale 2026',         when: 'Dans 29 j · lundi 15 juin 2026',  time: '17:00', place: 'Amphithéâtre A1', left: null },
]

export function PublicPageDemo({ formOpenFor = null }: { formOpenFor?: number | null }) {
  const [openId, setOpenId] = useState<number | null>(formOpenFor)
  const [done, setDone] = useState<number | null>(null)
  const field = 'w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20'
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${hex(0.13)} 0%, transparent 60%)` }}>
        <div aria-hidden className="absolute -top-32 -right-32 h-96 w-96 rounded-full blur-3xl opacity-20" style={{ backgroundColor: ACCENT }} />
        <div className="relative max-w-3xl mx-auto px-6 py-14">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 shrink-0 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg" style={{ backgroundColor: hex(0.13), color: ACCENT }}>AEC</div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Page publique</span>
              </div>
              <h1 className="text-4xl font-heading italic font-normal tracking-tight leading-tight">Association des Esprits Curieux</h1>
              <p className="text-muted-foreground mt-3 leading-relaxed max-w-xl">Club de lecture et de débats de l&apos;université. Un livre par mois, des soirées, des rencontres.</p>
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />257 membres</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-5">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Prochains événements</h2>
        </div>
        <div className="space-y-3">
          {PUBLIC_EVENTS.map(ev => (
            <div key={ev.id} className="rounded-2xl border border-border bg-card p-5 flex items-start gap-5">
              <div className="shrink-0 rounded-xl px-3 py-2 text-center min-w-[52px]" style={{ backgroundColor: hex(0.09), color: ACCENT }}>
                <p className="text-xs font-semibold uppercase">{ev.month}</p>
                <p className="text-2xl font-bold leading-none mt-0.5">{ev.day}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{ev.name}</p>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span>{ev.when}</span><span className="opacity-30">·</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{ev.time}</span><span className="opacity-30">·</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.place}</span>
                  {ev.left !== null && (<><span className="opacity-30">·</span>
                    <span className={cn('flex items-center gap-1', ev.left <= 5 && 'text-amber-500 font-medium')}><Users className="h-3 w-3" />{ev.left} places restantes</span></>)}
                </div>
                {done === ev.id ? (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-300">
                    <Check className="h-4 w-4" /> Inscription confirmée ! Un e-mail de confirmation est en route.
                  </div>
                ) : openId === ev.id ? (
                  <form onSubmit={e => { e.preventDefault(); setDone(ev.id); setOpenId(null) }} className="mt-4 space-y-2.5">
                    <div className="grid sm:grid-cols-2 gap-2.5">
                      <input required defaultValue={formOpenFor === ev.id ? 'Sophie Marchand' : ''} placeholder="Prénom et nom" className={field} />
                      <input required type="email" defaultValue={formOpenFor === ev.id ? 'sophie.marchand@unine.ch' : ''} placeholder="E-mail" className={field} />
                    </div>
                    <input placeholder="Un mot pour les organisateurs (optionnel)" className={field} />
                    <div className="flex items-center gap-2">
                      <button type="submit" className="rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: ACCENT }}>Confirmer mon inscription</button>
                      <button type="button" onClick={() => setOpenId(null)} className="px-3 py-2 text-sm text-muted-foreground">Annuler</button>
                    </div>
                  </form>
                ) : (
                  <button onClick={() => setOpenId(ev.id)} className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: ACCENT }}>
                    S&apos;inscrire
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <footer className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/50 pt-6">Géré avec <AssociaLogo className="h-3.5" /></footer>
      </div>
    </div>
  )
}
