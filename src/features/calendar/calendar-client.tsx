'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Link as LinkIcon, RefreshCw, Check, Copy,
  LayoutGrid, CalendarDays, List,
} from 'lucide-react'
import { regenerateCalendarToken, type CalendarItem } from '@/lib/actions/calendar'
import { cn } from '@/lib/utils'
import type { Role } from '@/types/database'

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]
const WEEK_DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const WEEK_DAYS_LONG  = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']

export type ViewType = 'month' | 'week' | 'agenda'

interface Props {
  view: ViewType
  anchor: string        // YYYY-MM-DD
  items: CalendarItem[]
  associationId: string
  callerRole: Role
  calendarToken: string | null
}

// ─── Utils ────────────────────────────────────────────────────────────────────

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getMonday(d: Date): Date {
  const r = new Date(d)
  const day = r.getDay()
  r.setDate(r.getDate() + (day === 0 ? -6 : 1 - day))
  r.setHours(0, 0, 0, 0)
  return r
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CalendarClient({ view, anchor, items, associationId, callerRole, calendarToken }: Props) {
  const router = useRouter()
  const [shareOpen, setShareOpen] = useState(false)

  const anchorDate = useMemo(() => {
    const d = new Date(anchor + 'T00:00:00')
    return isNaN(d.getTime()) ? new Date() : d
  }, [anchor])

  const today     = new Date()
  const todayKey  = ymd(today)

  function nav(newView: ViewType, newAnchor: Date) {
    const params = new URLSearchParams({ v: newView, d: ymd(newAnchor) })
    router.push(`/dashboard/calendar?${params}`)
  }

  function prevPeriod() {
    const d = new Date(anchorDate)
    if (view === 'week')  d.setDate(d.getDate() - 7)
    else if (view === 'month') d.setMonth(d.getMonth() - 1)
    else d.setDate(d.getDate() - 90)
    nav(view, d)
  }
  function nextPeriod() {
    const d = new Date(anchorDate)
    if (view === 'week')  d.setDate(d.getDate() + 7)
    else if (view === 'month') d.setMonth(d.getMonth() + 1)
    else d.setDate(d.getDate() + 90)
    nav(view, d)
  }
  function goToday() { nav(view, today) }

  const periodLabel = useMemo(() => {
    if (view === 'week') {
      const mon = getMonday(anchorDate)
      const sun = new Date(mon); sun.setDate(sun.getDate() + 6)
      if (mon.getMonth() === sun.getMonth()) {
        return `${mon.getDate()} – ${sun.getDate()} ${MONTH_NAMES[mon.getMonth()]} ${mon.getFullYear()}`
      }
      return `${mon.getDate()} ${MONTH_NAMES[mon.getMonth()]} – ${sun.getDate()} ${MONTH_NAMES[sun.getMonth()]} ${sun.getFullYear()}`
    }
    if (view === 'agenda') {
      return `${anchorDate.getDate()} ${MONTH_NAMES[anchorDate.getMonth()]} ${anchorDate.getFullYear()}`
    }
    return `${MONTH_NAMES[anchorDate.getMonth()]} ${anchorDate.getFullYear()}`
  }, [view, anchorDate])

  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    for (const it of items) {
      const list = map.get(it.date) ?? []; list.push(it); map.set(it.date, list)
    }
    return map
  }, [items])

  return (
    <div className="h-full flex flex-col">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border shrink-0 gap-4 flex-wrap">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Agenda</p>
          <h1 className="text-[28px] font-semibold mt-1 leading-tight tracking-tight">
            <span className="font-heading italic font-normal text-[32px] capitalize">{periodLabel}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-background/50 p-1">
            {([
              { v: 'month',  label: 'Mois',    Icon: LayoutGrid  },
              { v: 'week',   label: 'Semaine', Icon: CalendarDays },
              { v: 'agenda', label: 'Agenda',  Icon: List         },
            ] as const).map(({ v, label, Icon }) => (
              <button
                key={v}
                onClick={() => nav(v, anchorDate)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                  view === v
                    ? 'bg-foreground/10 text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={prevPeriod}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-border hover:bg-foreground/5 transition-colors"
              aria-label="Précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToday}
              className="h-9 px-3 text-sm rounded-lg border border-border hover:bg-foreground/5 transition-colors"
            >
              Aujourd&apos;hui
            </button>
            <button
              onClick={nextPeriod}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-border hover:bg-foreground/5 transition-colors"
              aria-label="Suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Subscribe */}
          <button
            onClick={() => setShareOpen(true)}
            className="h-9 px-3 text-sm rounded-lg border border-border hover:bg-foreground/5 transition-colors flex items-center gap-1.5"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            S&apos;abonner
          </button>
        </div>
      </div>

      {/* ── View content ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {view === 'month' && (
          <MonthView anchorDate={anchorDate} todayKey={todayKey} itemsByDate={itemsByDate} />
        )}
        {view === 'week' && (
          <WeekView anchorDate={anchorDate} todayKey={todayKey} itemsByDate={itemsByDate} />
        )}
        {view === 'agenda' && (
          <AgendaView anchorDate={anchorDate} items={items} todayKey={todayKey} />
        )}
      </div>

      {/* ── Legend (month + week) ─────────────────────────────────── */}
      {view !== 'agenda' && (
        <div className="flex items-center gap-4 px-8 py-3 border-t border-border text-xs text-muted-foreground shrink-0 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#6366f1]" /> Événements</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" /> Tâches urgentes</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" /> Tâches importantes</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#94a3b8]" /> Autres tâches</span>
        </div>
      )}

      {shareOpen && (
        <SubscribeDialog
          token={calendarToken}
          associationId={associationId}
          callerRole={callerRole}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  )
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({ anchorDate, todayKey, itemsByDate }: {
  anchorDate: Date
  todayKey: string
  itemsByDate: Map<string, CalendarItem[]>
}) {
  const year  = anchorDate.getFullYear()
  const month = anchorDate.getMonth()

  const cells = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1)
    const startOffset  = (firstOfMonth.getDay() + 6) % 7
    const gridStart    = new Date(year, month, 1 - startOffset)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart); d.setDate(d.getDate() + i)
      return { date: d, key: ymd(d), inMonth: d.getMonth() === month }
    })
  }, [year, month])

  return (
    <div className="px-8 py-6">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-t border-border">
        {WEEK_DAYS_SHORT.map(d => (
          <div key={d} className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 border-r border-border last:border-r-0">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 border-l border-border">
        {cells.map(({ date, key, inMonth }) => {
          const dayItems = itemsByDate.get(key) ?? []
          const isToday  = key === todayKey
          return (
            <div
              key={key}
              className={cn(
                'relative border-r border-b border-border min-h-28 p-2',
                !inMonth && 'bg-foreground/[0.015]'
              )}
            >
              <span className={cn(
                'inline-flex h-6 min-w-6 items-center justify-center rounded-full text-xs tabular-nums px-1.5 mb-1',
                isToday
                  ? 'bg-foreground text-background font-semibold'
                  : inMonth ? 'text-foreground' : 'text-muted-foreground/40'
              )}>
                {date.getDate()}
              </span>
              <div className="space-y-0.5">
                {dayItems.slice(0, 3).map(it => (
                  <Link
                    key={it.id} href={it.href}
                    className="flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] hover:bg-foreground/5 transition-colors"
                    title={it.title}
                  >
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: it.color ?? '#94a3b8' }} />
                    <span className="truncate">{it.title}</span>
                  </Link>
                ))}
                {dayItems.length > 3 && (
                  <span className="text-[10px] text-muted-foreground px-1.5">+{dayItems.length - 3} autres</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({ anchorDate, todayKey, itemsByDate }: {
  anchorDate: Date
  todayKey: string
  itemsByDate: Map<string, CalendarItem[]>
}) {
  const weekDays = useMemo(() => {
    const mon = getMonday(anchorDate)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon); d.setDate(d.getDate() + i)
      return { date: d, key: ymd(d) }
    })
  }, [anchorDate])

  return (
    <div className="px-8 py-6 h-full min-h-[600px]">
      <div className="grid grid-cols-7 border border-border rounded-2xl overflow-hidden h-full">
        {weekDays.map(({ date, key }, idx) => {
          const dayItems  = itemsByDate.get(key) ?? []
          const isToday   = key === todayKey
          const isWeekend = idx >= 5
          return (
            <div
              key={key}
              className={cn(
                'flex flex-col border-r border-border last:border-r-0',
                isWeekend && 'bg-foreground/[0.01]'
              )}
            >
              {/* Day header */}
              <div className={cn(
                'px-2 py-3 border-b border-border text-center shrink-0',
                isToday && 'bg-foreground/[0.04]'
              )}>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                  {WEEK_DAYS_SHORT[idx]}
                </p>
                <div className="mt-1 flex items-center justify-center">
                  {isToday ? (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background text-sm font-bold tabular-nums">
                      {date.getDate()}
                    </span>
                  ) : (
                    <span className="text-xl font-semibold tabular-nums text-muted-foreground/70">
                      {date.getDate()}
                    </span>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="flex-1 p-1.5 space-y-1 overflow-y-auto">
                {dayItems.length === 0 ? (
                  <div className="h-full min-h-[80px] flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground/25 select-none">—</span>
                  </div>
                ) : dayItems.map(it => (
                  <Link
                    key={it.id} href={it.href}
                    className="flex items-start gap-1.5 rounded-lg px-2 py-1.5 text-xs hover:bg-foreground/5 transition-colors"
                  >
                    <span
                      className="mt-[3px] h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: it.color ?? '#94a3b8' }}
                    />
                    <div className="min-w-0">
                      <p className="font-medium leading-snug line-clamp-2">{it.title}</p>
                      {it.subtitle && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{it.subtitle}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Agenda View ──────────────────────────────────────────────────────────────

function AgendaView({ anchorDate, items, todayKey }: {
  anchorDate: Date
  items: CalendarItem[]
  todayKey: string
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    for (const it of items) {
      const list = map.get(it.date) ?? []; list.push(it); map.set(it.date, list)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [items])

  if (grouped.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-14 w-14 rounded-2xl bg-foreground/5 flex items-center justify-center mb-4">
          <CalendarIcon className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <p className="text-sm text-muted-foreground font-heading italic">Aucun événement dans cette période</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Utilise les flèches pour naviguer vers une autre période.</p>
      </div>
    )
  }

  return (
    <div className="px-8 py-6 space-y-6 max-w-2xl mx-auto">
      {grouped.map(([dateKey, dayItems]) => {
        const d       = new Date(dateKey + 'T00:00:00')
        const isToday = dateKey === todayKey
        const isPast  = dateKey < todayKey
        const dowIdx  = (d.getDay() + 6) % 7  // 0=Mon … 6=Sun
        return (
          <div key={dateKey}>
            {/* Date heading */}
            <div className="flex items-center gap-4 mb-2">
              {/* Numeric date badge */}
              <div className={cn('shrink-0 w-10 text-center', isPast && !isToday && 'opacity-40')}>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  {WEEK_DAYS_SHORT[dowIdx]}
                </p>
                {isToday ? (
                  <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background text-sm font-bold tabular-nums">
                    {d.getDate()}
                  </span>
                ) : (
                  <p className="mt-0.5 text-xl font-bold tabular-nums text-muted-foreground/70 leading-none">
                    {d.getDate()}
                  </p>
                )}
              </div>

              {/* Text label + divider */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    'text-xs font-medium capitalize whitespace-nowrap',
                    isPast && !isToday ? 'text-muted-foreground/40' : 'text-muted-foreground'
                  )}>
                    {WEEK_DAYS_LONG[dowIdx]} {d.getDate()} {MONTH_NAMES[d.getMonth()]} {d.getFullYear()}
                  </p>
                  {isToday && (
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-foreground/60 bg-foreground/8 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                      Aujourd&apos;hui
                    </span>
                  )}
                </div>
                <div className="h-px bg-border mt-1.5" />
              </div>
            </div>

            {/* Items */}
            <div className="pl-14 space-y-1">
              {dayItems.map(it => (
                <Link
                  key={it.id} href={it.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-foreground/5 transition-colors"
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: it.color ?? '#94a3b8' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium truncate',
                      isPast && !isToday && 'text-muted-foreground/50'
                    )}>
                      {it.title}
                    </p>
                    {it.subtitle && (
                      <p className="text-xs text-muted-foreground capitalize">{it.subtitle}</p>
                    )}
                  </div>
                  <span className={cn(
                    'shrink-0 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full',
                    it.kind === 'event'
                      ? 'bg-[#6366f1]/15 text-[#818cf8]'
                      : 'bg-foreground/8 text-muted-foreground'
                  )}>
                    {it.kind === 'event' ? 'Événement' : 'Tâche'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Subscribe Dialog ─────────────────────────────────────────────────────────

function SubscribeDialog({
  token, associationId, callerRole, onClose,
}: {
  token: string | null
  associationId: string
  callerRole: Role
  onClose: () => void
}) {
  const [currentToken, setCurrentToken] = useState(token)
  const [pending, start] = useTransition()
  const [copied, setCopied]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const url    = currentToken ? `${origin}/api/calendar/${currentToken}` : null
  const webcal = url ? url.replace(/^https?/, 'webcal') : null

  function copy() {
    if (!url) return
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  function regen() {
    start(async () => {
      setError(null)
      const r = await regenerateCalendarToken(associationId)
      if (r.error) setError(r.error)
      else setCurrentToken(r.token ?? null)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onMouseDown={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        onMouseDown={e => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-border bg-popover/95 backdrop-blur-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center gap-2 mb-1">
          <CalendarIcon className="h-4 w-4" />
          <h2 className="text-lg font-semibold">S&apos;abonner au calendrier</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Copie ce lien dans Apple Calendar, Google Calendar ou Outlook pour voir tous les événements et tâches en lecture seule.
        </p>

        {!currentToken ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
            Lien indisponible — exécute <code className="text-xs">sql/calendar_token.sql</code>.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-foreground/5 px-3 py-2 mb-3">
              <input
                readOnly value={url ?? ''}
                onFocus={e => e.currentTarget.select()}
                className="flex-1 bg-transparent text-xs font-mono outline-none truncate"
              />
              <button
                onClick={copy}
                className="h-7 px-2 text-xs rounded-md border border-border hover:bg-foreground/5 transition-colors flex items-center gap-1"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
            <div className="flex items-center gap-2 mb-5">
              {webcal && (
                <a href={webcal} className="text-xs px-3 py-1.5 rounded-md bg-foreground text-background hover:opacity-90 transition-opacity">
                  Ouvrir dans Calendrier
                </a>
              )}
              <a href={url ?? '#'} download className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-foreground/5 transition-colors">
                Télécharger .ics
              </a>
            </div>
          </>
        )}

        {callerRole === 'president' && (
          <div className="border-t border-border pt-4 mt-2">
            <p className="text-xs text-muted-foreground mb-2">
              Régénérer le lien révoque immédiatement les abonnements existants.
            </p>
            <button
              onClick={regen} disabled={pending}
              className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-foreground/5 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={cn('h-3 w-3', pending && 'animate-spin')} />
              Régénérer le lien
            </button>
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          </div>
        )}

        <div className="flex justify-end mt-5">
          <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-md hover:bg-foreground/5 transition-colors">
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
