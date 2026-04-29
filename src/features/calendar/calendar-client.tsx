'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Link as LinkIcon, RefreshCw, Check, Copy } from 'lucide-react'
import { regenerateCalendarToken, type CalendarItem } from '@/lib/actions/calendar'
import { cn } from '@/lib/utils'
import type { Role } from '@/types/database'

const MONTH_NAMES = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

interface Props {
  year: number
  month: number // 0..11
  items: CalendarItem[]
  associationId: string
  callerRole: Role
  calendarToken: string | null
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function CalendarClient({ year, month, items, associationId, callerRole, calendarToken }: Props) {
  const router = useRouter()
  const [shareOpen, setShareOpen] = useState(false)

  const today = new Date()
  const todayKey = ymd(today)

  const firstOfMonth = new Date(year, month, 1)
  const startOffset = (firstOfMonth.getDay() + 6) % 7

  // Build 42 cells (6 weeks)
  const cells = useMemo(() => {
    const arr: { date: Date; key: string; inMonth: boolean }[] = []
    const gridStart = new Date(year, month, 1 - startOffset)
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart)
      d.setDate(d.getDate() + i)
      arr.push({ date: d, key: ymd(d), inMonth: d.getMonth() === month })
    }
    return arr
  }, [year, month, startOffset])

  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    for (const it of items) {
      const list = map.get(it.date) ?? []
      list.push(it)
      map.set(it.date, list)
    }
    return map
  }, [items])

  function navMonth(delta: number) {
    const d = new Date(year, month + delta, 1)
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    router.push(`/dashboard/calendar?m=${m}`)
  }

  function goToday() {
    const m = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    router.push(`/dashboard/calendar?m=${m}`)
  }

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground/70 mb-2">
            Agenda
          </p>
          <h1 className="text-4xl font-semibold tracking-tight flex items-baseline gap-3">
            <span className="font-serif italic">{MONTH_NAMES[month]}</span>
            <span className="text-muted-foreground tabular-nums">{year}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navMonth(-1)}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
            aria-label="Mois précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToday}
            className="h-9 px-3 text-sm rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
          >
            Aujourd&apos;hui
          </button>
          <button
            onClick={() => navMonth(1)}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
            aria-label="Mois suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShareOpen(true)}
            className="h-9 px-3 text-sm rounded-lg border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-1.5"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            S&apos;abonner
          </button>
        </div>
      </header>

      {/* Weekday header */}
      <div className="grid grid-cols-7 border-t border-white/8">
        {WEEK_DAYS.map((d) => (
          <div
            key={d}
            className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 border-r border-white/8 last:border-r-0"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 grid-rows-6 border-l border-white/8">
        {cells.map(({ date, key, inMonth }) => {
          const dayItems = itemsByDate.get(key) ?? []
          const isToday = key === todayKey
          return (
            <div
              key={key}
              className={cn(
                'relative border-r border-b border-white/8 min-h-28 p-2',
                !inMonth && 'bg-white/[0.015]'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'inline-flex h-6 min-w-6 items-center justify-center rounded-full text-xs tabular-nums px-1.5',
                    isToday
                      ? 'bg-foreground text-background font-semibold'
                      : inMonth ? 'text-foreground' : 'text-muted-foreground/40'
                  )}
                >
                  {date.getDate()}
                </span>
              </div>
              <div className="space-y-1">
                {dayItems.slice(0, 3).map((it) => (
                  <Link
                    key={it.id}
                    href={it.href}
                    className="group flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] hover:bg-white/5 transition-colors"
                    title={it.title}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: it.color ?? '#94a3b8' }}
                    />
                    <span className="truncate">{it.title}</span>
                  </Link>
                ))}
                {dayItems.length > 3 && (
                  <span className="text-[10px] text-muted-foreground px-1.5">
                    +{dayItems.length - 3} autres
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#6366f1]" /> Événements
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" /> Tâches urgentes
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" /> Tâches importantes
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#94a3b8]" /> Autres tâches
        </span>
      </div>

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

function SubscribeDialog({
  token,
  associationId,
  callerRole,
  onClose,
}: {
  token: string | null
  associationId: string
  callerRole: Role
  onClose: () => void
}) {
  const [currentToken, setCurrentToken] = useState(token)
  const [pending, start] = useTransition()
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const url = currentToken ? `${origin}/api/calendar/${currentToken}` : null
  // Many calendar apps prefer a webcal:// URL.
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
        onMouseDown={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-popover/95 backdrop-blur-2xl p-6 shadow-2xl"
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
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 mb-3">
              <input
                readOnly
                value={url ?? ''}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 bg-transparent text-xs font-mono outline-none truncate"
              />
              <button
                onClick={copy}
                className="h-7 px-2 text-xs rounded-md border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-1"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
            <div className="flex items-center gap-2 mb-5">
              {webcal && (
                <a
                  href={webcal}
                  className="text-xs px-3 py-1.5 rounded-md bg-foreground text-background hover:opacity-90 transition-opacity"
                >
                  Ouvrir dans Calendrier
                </a>
              )}
              <a
                href={url ?? '#'}
                download
                className="text-xs px-3 py-1.5 rounded-md border border-white/10 hover:bg-white/5 transition-colors"
              >
                Télécharger .ics
              </a>
            </div>
          </>
        )}

        {callerRole === 'president' && (
          <div className="border-t border-white/8 pt-4 mt-2">
            <p className="text-xs text-muted-foreground mb-2">
              Régénérer le lien révoque immédiatement les abonnements existants.
            </p>
            <button
              onClick={regen}
              disabled={pending}
              className="text-xs px-3 py-1.5 rounded-md border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={cn('h-3 w-3', pending && 'animate-spin')} />
              Régénérer le lien
            </button>
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          </div>
        )}

        <div className="flex justify-end mt-5">
          <button
            onClick={onClose}
            className="text-sm px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
