'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import {
  createEvent, updateEvent, deleteEvent,
  upsertRsvp, removeRsvp,
  addEventBudgetItem, deleteEventBudgetItem, updateEventBudgetItem,
  addEventTask, toggleEventTask, deleteEventTask,
} from '@/lib/actions/events'
import type {
  AssocEventWithDetails, EventParticipantWithProfile,
  EventBudgetItem, EventTask, Role,
} from '@/types/database'
import {
  Plus, ChevronLeft, CalendarDays, Clock, MapPin, Users, Pencil,
  Trash2, Check, X, TrendingUp, TrendingDown, CheckSquare, Square,
  AlertCircle, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CollapsibleRail } from '@/components/collapsible-rail'
import { EmptyState } from '@/components/ui/empty-state'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface MemberRow {
  user_id: string
  role: string
  user_profiles: { id: string; full_name: string | null; email: string; avatar_url: string | null }
}

interface Props {
  events: AssocEventWithDetails[]
  members: MemberRow[]
  associationId: string
  callerRole: Role
  currentUserId: string
  migrationNeeded: boolean
  onRefresh: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 2 }).format(n)
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-CH', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtDateShort(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-CH', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtTime(t: string) { return t.slice(0, 5) }

function daysUntil(d: string) {
  const a = new Date(d + 'T00:00:00'), b = new Date()
  b.setHours(0, 0, 0, 0); a.setHours(0, 0, 0, 0)
  return Math.round((a.getTime() - b.getTime()) / 86400000)
}

function initials(name: string | null, email: string) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return email[0].toUpperCase()
}

const STATUS_CONFIG = {
  planned:   { label: 'Planifié',  color: '#60a5fa', bg: 'bg-blue-500/10',   text: 'text-blue-300',   border: 'border-blue-500/20' },
  active:    { label: 'En cours',  color: '#34d399', bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/20' },
  done:      { label: 'Terminé',   color: '#94a3b8', bg: 'bg-white/6',        text: 'text-muted-foreground', border: 'border-white/10' },
  cancelled: { label: 'Annulé',    color: '#f87171', bg: 'bg-red-500/10',     text: 'text-red-300',    border: 'border-red-500/20' },
}

const RSVP_CONFIG = {
  going:    { label: 'Je participe', color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' },
  maybe:    { label: 'Peut-être',    color: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25' },
  declined: { label: 'Absent',       color: 'text-red-300',     bg: 'bg-red-500/10',     border: 'border-red-500/25' },
}

// ─── Main shell ───────────────────────────────────────────────────────────────

export function EventsShell({ events, members, associationId, callerRole, currentUserId, migrationNeeded, onRefresh }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const [createOpen, setCreateOpen] = useState(false)
  const [editEvent, setEditEvent] = useState<AssocEventWithDetails | null>(null)
  const [, startTransition] = useTransition()

  const canManage = ['president', 'treasurer', 'secretary'].includes(callerRole)
  const selectedEvent = events.find(e => e.id === selectedId) ?? null

  const today = new Date(); today.setHours(0, 0, 0, 0)

  const filtered = events.filter(ev => {
    if (filter === 'upcoming') return !ev.event_date || new Date(ev.event_date + 'T00:00:00') >= today
    if (filter === 'past') return ev.event_date ? new Date(ev.event_date + 'T00:00:00') < today : false
    return true
  })

  const upcoming = events.filter(ev => ev.event_date && new Date(ev.event_date + 'T00:00:00') >= today)
    .sort((a, b) => (a.event_date! < b.event_date! ? -1 : 1))

  function handleDeleteEvent(ev: AssocEventWithDetails) {
    if (!confirm(`Supprimer l'événement "${ev.name}" ?`)) return
    startTransition(async () => {
      const r = await deleteEvent(ev.id, associationId)
      if (r.error) toast.error(r.error)
      else { toast.success('Événement supprimé'); setSelectedId(null); onRefresh() }
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/6 shrink-0">
        <div className="flex items-center gap-4">
          {selectedEvent && (
            <button onClick={() => setSelectedId(null)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-3.5 w-3.5" /> Retour
            </button>
          )}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Opérations</p>
            <h1 className="text-[28px] font-semibold mt-1 leading-tight tracking-tight">
              {selectedEvent
                ? <span className="font-heading italic font-normal text-[32px]">{selectedEvent.name}</span>
                : <span className="font-heading italic font-normal text-[32px]">Événements</span>
              }
            </h1>
          </div>
        </div>
        {canManage && !selectedEvent && (
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Nouvel événement
          </button>
        )}
        {canManage && selectedEvent && (
          <div className="flex items-center gap-2">
            <button onClick={() => setEditEvent(selectedEvent)} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 transition-colors">
              <Pencil className="h-3.5 w-3.5" /> Modifier
            </button>
            <button onClick={() => handleDeleteEvent(selectedEvent)} className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 transition-colors">
              <Trash2 className="h-3.5 w-3.5" /> Supprimer
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left rail */}
        <CollapsibleRail width="w-72">
          <div className="overflow-y-auto h-full pt-10 flex flex-col">
            {/* Filter tabs */}
            <div className="px-4 pb-3">
              <div className="flex gap-1 rounded-lg bg-white/[0.04] p-1">
                {(['upcoming', 'all', 'past'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={cn('flex-1 rounded-md py-1 text-[11px] font-medium transition-colors',
                      filter === f ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
                    )}>
                    {f === 'upcoming' ? 'À venir' : f === 'past' ? 'Passés' : 'Tous'}
                  </button>
                ))}
              </div>
            </div>

            {/* Events list */}
            <nav className="flex-1 px-4 space-y-0.5">
              {filtered.length === 0 && (
                <p className="px-3 py-6 text-xs text-muted-foreground/60 text-center font-heading italic">
                  {filter === 'upcoming' ? 'Aucun événement à venir' : filter === 'past' ? 'Aucun événement passé' : 'Aucun événement'}
                </p>
              )}
              {filtered.map(ev => (
                <EventRailItem key={ev.id} event={ev} active={selectedId === ev.id} onClick={() => setSelectedId(ev.id)} />
              ))}
            </nav>

            {canManage && (
              <div className="px-4 pb-4 pt-2 border-t border-white/6 mt-2">
                <button onClick={() => setCreateOpen(true)}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Nouvel événement
                </button>
              </div>
            )}
          </div>
        </CollapsibleRail>

        {/* Right pane */}
        <div className="flex-1 overflow-y-auto">
          {migrationNeeded ? (
            <MigrationBanner />
          ) : selectedEvent ? (
            <EventDetail
              event={selectedEvent}
              members={members}
              currentUserId={currentUserId}
              canManage={canManage}
              associationId={associationId}
              onRefresh={onRefresh}
            />
          ) : (
            <EventsOverview
              events={events}
              upcoming={upcoming}
              canManage={canManage}
              onSelect={setSelectedId}
              onCreateClick={() => setCreateOpen(true)}
            />
          )}
        </div>
      </div>

      {/* Dialogs */}
      {createOpen && (
        <EventFormDialog
          associationId={associationId}
          onClose={() => setCreateOpen(false)}
          onSuccess={(id) => { setCreateOpen(false); onRefresh(); setSelectedId(id ?? null) }}
        />
      )}
      {editEvent && (
        <EventFormDialog
          event={editEvent}
          associationId={associationId}
          onClose={() => setEditEvent(null)}
          onSuccess={() => { setEditEvent(null); onRefresh() }}
        />
      )}
    </div>
  )
}

// ─── Rail item ────────────────────────────────────────────────────────────────

function EventRailItem({ event, active, onClick }: { event: AssocEventWithDetails; active: boolean; onClick: () => void }) {
  const cfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.planned
  const goingCount = event.participants?.filter(p => p.response === 'going').length ?? 0

  return (
    <button onClick={onClick}
      className={cn('w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors',
        active ? 'bg-white/8 text-foreground' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
      )}>
      <span className="shrink-0 h-2 w-2 rounded-full mt-0.5" style={{ backgroundColor: cfg.color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{event.name}</p>
        <p className="text-[11px] text-muted-foreground/70 mt-0.5 flex items-center gap-1.5">
          {event.event_date ? fmtDateShort(event.event_date) : 'Sans date'}
          {goingCount > 0 && <><span className="text-white/20">·</span><span>{goingCount} part.</span></>}
        </p>
      </div>
    </button>
  )
}

// ─── Migration banner ─────────────────────────────────────────────────────────

function MigrationBanner() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 py-20">
      <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
        <AlertCircle className="h-6 w-6 text-amber-400" />
      </div>
      <h2 className="text-lg font-semibold mb-2">Migration requise</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        Exécute <code className="text-xs bg-white/8 px-1.5 py-0.5 rounded font-mono">sql/events.sql</code> dans ton éditeur SQL Supabase pour activer cette fonctionnalité.
      </p>
    </div>
  )
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function EventsOverview({ events, upcoming, canManage, onSelect, onCreateClick }: {
  events: AssocEventWithDetails[]
  upcoming: AssocEventWithDetails[]
  canManage: boolean
  onSelect: (id: string) => void
  onCreateClick: () => void
}) {
  return (
    <div className="px-8 py-6 space-y-8">
      {/* Upcoming events */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Prochains événements</h2>
          {canManage && <button onClick={onCreateClick} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"><Plus className="h-3 w-3" />Créer</button>}
        </div>

        {events.length === 0 ? (
          <EmptyState
            variant="events"
            title="Aucun événement pour l'instant"
            description="Planifiez votre premier événement avec date, lieu et budget."
            size="lg"
            action={canManage ? (
              <button
                onClick={onCreateClick}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" /> Créer le premier événement
              </button>
            ) : undefined}
          />
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {(upcoming.length > 0 ? upcoming : events.slice(0, 6)).map(ev => (
              <EventCard key={ev.id} event={ev} onClick={() => onSelect(ev.id)} />
            ))}
            {canManage && (
              <button onClick={onCreateClick}
                className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 hover:border-white/30 hover:bg-white/[0.03] transition-all min-h-[180px] gap-2 text-muted-foreground/50 hover:text-muted-foreground">
                <Plus className="h-6 w-6" />
                <span className="text-sm font-medium">Nouvel événement</span>
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

// ─── Event card ───────────────────────────────────────────────────────────────

function EventCard({ event, onClick }: { event: AssocEventWithDetails; onClick: () => void }) {
  const cfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.planned
  const going = event.participants?.filter(p => p.response === 'going').length ?? 0
  const days = event.event_date ? daysUntil(event.event_date) : null
  const balance = (event.budget_items ?? []).reduce((s, b) => s + (b.type === 'income' ? b.planned_amount : -b.planned_amount), 0)
  const doneTasks = (event.tasks ?? []).filter(t => t.done).length
  const totalTasks = (event.tasks ?? []).length

  return (
    <button onClick={onClick}
      className="group text-left flex flex-col rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden hover:border-white/15 hover:bg-white/[0.05] transition-all">
      {/* Color bar */}
      <div className="h-1 w-full" style={{ backgroundColor: cfg.color }} />
      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug group-hover:text-foreground transition-colors line-clamp-2">{event.name}</h3>
          <span className={cn('shrink-0 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md border', cfg.bg, cfg.text, cfg.border)}>
            {cfg.label}
          </span>
        </div>

        {/* Date & time */}
        {event.event_date && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <CalendarDays className="h-3 w-3 shrink-0" />
            <span className="capitalize">{fmtDate(event.event_date)}</span>
            {days !== null && (
              <span className={cn('ml-auto font-semibold tabular-nums', days < 0 ? 'text-muted-foreground/40' : days <= 3 ? 'text-amber-300' : 'text-muted-foreground')}>
                {days < 0 ? `${-days}j passé` : days === 0 ? "Aujourd'hui" : days === 1 ? 'Demain' : `Dans ${days}j`}
              </span>
            )}
          </div>
        )}
        {event.location && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 pt-1 border-t border-white/5 mt-auto">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Users className="h-3 w-3" /> {going}
          </span>
          {event.budget_items?.length > 0 && (
            <span className={cn('text-[11px] font-medium tabular-nums', balance >= 0 ? 'text-emerald-400/70' : 'text-red-400/70')}>
              {balance >= 0 ? '+' : ''}{Math.round(balance)} CHF
            </span>
          )}
          {totalTasks > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
              <CheckSquare className="h-3 w-3" /> {doneTasks}/{totalTasks}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ─── Event detail ─────────────────────────────────────────────────────────────

function EventDetail({ event, members, currentUserId, canManage, associationId, onRefresh }: {
  event: AssocEventWithDetails
  members: MemberRow[]
  currentUserId: string
  canManage: boolean
  associationId: string
  onRefresh: () => void
}) {
  const cfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.planned
  const going  = (event.participants ?? []).filter(p => p.response === 'going')
  const maybe  = (event.participants ?? []).filter(p => p.response === 'maybe')
  const declined = (event.participants ?? []).filter(p => p.response === 'declined')
  const myRsvp = (event.participants ?? []).find(p => p.user_id === currentUserId)

  return (
    <div className="px-8 py-6 space-y-8 max-w-4xl">
      {/* Hero */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] overflow-hidden">
        <div className="h-1" style={{ backgroundColor: cfg.color }} />
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <span className={cn('text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md border', cfg.bg, cfg.text, cfg.border)}>
              {cfg.label}
            </span>
          </div>
          <h2 className="font-heading italic font-normal text-4xl leading-tight">{event.name}</h2>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {event.event_date && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 shrink-0" />
                <span className="capitalize">{fmtDate(event.event_date)}</span>
              </span>
            )}
            {(event.start_time || event.end_time) && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 shrink-0" />
                {event.start_time && fmtTime(event.start_time)}
                {event.start_time && event.end_time && ' – '}
                {event.end_time && fmtTime(event.end_time)}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" />
                {event.location}
              </span>
            )}
            {event.max_participants && (
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 shrink-0" />
                Max. {event.max_participants} participants
              </span>
            )}
          </div>

          {event.description && (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{event.description}</p>
          )}
        </div>
      </div>

      {/* Participants */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">
          Participants · {(event.participants ?? []).length} réponse{(event.participants ?? []).length !== 1 ? 's' : ''}
        </h3>

        {/* My RSVP */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Ma réponse :</span>
          {(['going', 'maybe', 'declined'] as const).map(r => {
            const rc = RSVP_CONFIG[r]
            const active = myRsvp?.response === r
            return (
              <RsvpButton key={r} label={rc.label} active={active} colorClass={rc.color}
                activeBg={rc.bg} activeBorder={rc.border}
                eventId={event.id} response={r} onRefresh={onRefresh} currentUserId={currentUserId} />
            )
          })}
          {myRsvp && (
            <RemoveRsvpButton eventId={event.id} onRefresh={onRefresh} />
          )}
        </div>

        {/* Three response columns */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'going' as const, label: 'Participe', list: going },
            { key: 'maybe' as const, label: 'Peut-être', list: maybe },
            { key: 'declined' as const, label: 'Absent',   list: declined },
          ].map(({ key, label, list }) => {
            const rc = RSVP_CONFIG[key]
            return (
              <div key={key} className={cn('rounded-xl border p-3 space-y-2', rc.bg, rc.border)}>
                <p className={cn('text-[10px] font-semibold uppercase tracking-wider', rc.color)}>
                  {label} <span className="opacity-70">({list.length})</span>
                </p>
                {list.length === 0
                  ? <p className="text-[11px] text-muted-foreground/50 italic font-heading">—</p>
                  : (
                    <div className="flex flex-wrap gap-1.5">
                      {list.map(p => (
                        <ParticipantAvatar key={p.id} participant={p} />
                      ))}
                    </div>
                  )
                }
              </div>
            )
          })}
        </div>
      </section>

      {/* Budget */}
      <BudgetSection event={event} canManage={canManage} associationId={associationId} onRefresh={onRefresh} />

      {/* Tasks */}
      <TasksSection event={event} members={members} canManage={canManage} associationId={associationId} onRefresh={onRefresh} />

      {/* Timeline */}
      {(event.tasks ?? []).some(t => t.due_date) && (
        <TimelineSection event={event} members={members} />
      )}
    </div>
  )
}

// ─── RSVP buttons ─────────────────────────────────────────────────────────────

function RsvpButton({ label, active, colorClass, activeBg, activeBorder, eventId, response, onRefresh, currentUserId }: {
  label: string; active: boolean; colorClass: string; activeBg: string; activeBorder: string
  eventId: string; response: 'going' | 'maybe' | 'declined'; onRefresh: () => void; currentUserId: string
}) {
  const [, start] = useTransition()
  function handle() {
    start(async () => {
      const r = await upsertRsvp(eventId, response)
      if (r.error) toast.error(r.error)
      else onRefresh()
    })
  }
  return (
    <button onClick={handle}
      className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
        active ? cn(activeBg, colorClass, activeBorder) : 'border-white/10 text-muted-foreground hover:bg-white/5 hover:text-foreground'
      )}>
      {active && <Check className="h-3 w-3 inline mr-1" />}{label}
    </button>
  )
}

function RemoveRsvpButton({ eventId, onRefresh }: { eventId: string; onRefresh: () => void }) {
  const [, start] = useTransition()
  return (
    <button onClick={() => start(async () => { const r = await removeRsvp(eventId); if (r.error) toast.error(r.error); else onRefresh() })}
      className="px-2 py-1.5 rounded-lg text-xs border border-white/8 text-muted-foreground/50 hover:text-muted-foreground hover:bg-white/5 transition-colors">
      <X className="h-3 w-3" />
    </button>
  )
}

function ParticipantAvatar({ participant }: { participant: EventParticipantWithProfile }) {
  const p = participant.user_profiles
  const ini = initials(p?.full_name ?? null, p?.email ?? '?')
  return (
    <div title={p?.full_name ?? p?.email ?? ''}
      className="h-7 w-7 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-[10px] font-semibold">
      {ini}
    </div>
  )
}

// ─── Budget section ───────────────────────────────────────────────────────────

function BudgetSection({ event, canManage, associationId, onRefresh }: {
  event: AssocEventWithDetails; canManage: boolean; associationId: string; onRefresh: () => void
}) {
  const [adding, setAdding] = useState<'income' | 'expense' | null>(null)
  const [label, setLabel] = useState('')
  const [planned, setPlanned] = useState('')
  const [, start] = useTransition()

  const items = event.budget_items ?? []
  const totalIncome  = items.filter(b => b.type === 'income').reduce((s, b) => s + b.planned_amount, 0)
  const totalExpense = items.filter(b => b.type === 'expense').reduce((s, b) => s + b.planned_amount, 0)
  const balance = totalIncome - totalExpense

  function submitAdd() {
    if (!adding || !label.trim() || !planned) return
    start(async () => {
      const r = await addEventBudgetItem(event.id, associationId, {
        type: adding, label: label.trim(), planned_amount: parseFloat(planned),
      })
      if (r.error) toast.error(r.error)
      else { setAdding(null); setLabel(''); setPlanned(''); onRefresh() }
    })
  }

  function handleDelete(id: string) {
    start(async () => {
      const r = await deleteEventBudgetItem(id, associationId)
      if (r.error) toast.error(r.error)
      else onRefresh()
    })
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">Budget</h3>
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-bold tabular-nums', balance >= 0 ? 'text-emerald-300' : 'text-red-300')}>
            {balance >= 0 ? '+' : ''}{fmt(balance)}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_80px_80px_80px_28px] gap-3 px-4 py-2.5 border-b border-white/6 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
          <span>Libellé</span><span>Type</span><span className="text-right">Prévu</span><span className="text-right">Réel</span><span />
        </div>

        {items.length === 0 && !adding && (
          <p className="px-4 py-6 text-xs text-muted-foreground/50 text-center font-heading italic">Aucune ligne budgétaire</p>
        )}

        <div className="divide-y divide-white/4">
          {items.map(item => (
            <BudgetItemRow key={item.id} item={item} canManage={canManage}
              associationId={associationId} onDelete={() => handleDelete(item.id)} onRefresh={onRefresh} />
          ))}
        </div>

        {/* Add form */}
        {adding && (
          <div className="grid grid-cols-[1fr_80px_80px_80px_28px] gap-3 px-4 py-2.5 border-t border-white/6 items-center">
            <input autoFocus value={label} onChange={e => setLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitAdd(); if (e.key === 'Escape') { setAdding(null); setLabel(''); setPlanned('') } }}
              placeholder="Libellé…" className="bg-white/5 border border-white/15 rounded-lg px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-white/20" />
            <span className={cn('text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded text-center',
              adding === 'income' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10')}>
              {adding === 'income' ? 'Recette' : 'Dépense'}
            </span>
            <input value={planned} onChange={e => setPlanned(e.target.value)} type="number" min="0" step="0.01"
              onKeyDown={e => { if (e.key === 'Enter') submitAdd(); if (e.key === 'Escape') { setAdding(null); setLabel(''); setPlanned('') } }}
              placeholder="0.00" className="bg-white/5 border border-white/15 rounded-lg px-2 py-1 text-sm text-right outline-none focus:ring-1 focus:ring-white/20 col-span-2" />
            <button onClick={submitAdd} className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 hover:bg-white/15 text-foreground">
              <Check className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Totals */}
        {items.length > 0 && (
          <div className="px-4 py-3 border-t border-white/8 bg-white/[0.02] grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] text-emerald-400/70 font-medium uppercase tracking-wider mb-0.5">Recettes</p>
              <p className="text-sm font-semibold tabular-nums text-emerald-300">+{fmt(totalIncome)}</p>
            </div>
            <div>
              <p className="text-[10px] text-red-400/70 font-medium uppercase tracking-wider mb-0.5">Dépenses</p>
              <p className="text-sm font-semibold tabular-nums text-red-300">−{fmt(totalExpense)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider mb-0.5">Solde</p>
              <p className={cn('text-sm font-bold tabular-nums', balance >= 0 ? 'text-foreground' : 'text-red-300')}>
                {balance >= 0 ? '+' : ''}{fmt(balance)}
              </p>
            </div>
          </div>
        )}
      </div>

      {canManage && !adding && (
        <div className="flex gap-2">
          <button onClick={() => setAdding('income')}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-emerald-500/8 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/15 transition-colors">
            <TrendingUp className="h-3 w-3" /> + Recette
          </button>
          <button onClick={() => setAdding('expense')}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-red-500/8 border border-red-500/20 text-red-300 hover:bg-red-500/15 transition-colors">
            <TrendingDown className="h-3 w-3" /> + Dépense
          </button>
        </div>
      )}
    </section>
  )
}

function BudgetItemRow({ item, canManage, onDelete, onRefresh, associationId }: {
  item: EventBudgetItem; canManage: boolean; onDelete: () => void; onRefresh: () => void; associationId: string
}) {
  const [editingActual, setEditingActual] = useState(false)
  const [actual, setActual] = useState(String(item.actual_amount))
  const [, start] = useTransition()
  const isIncome = item.type === 'income'

  function saveActual() {
    setEditingActual(false)
    const v = parseFloat(actual)
    if (isNaN(v) || v === item.actual_amount) return
    start(async () => {
      const r = await updateEventBudgetItem(item.id, associationId, { actual_amount: v })
      if (r.error) toast.error(r.error)
      else onRefresh()
    })
  }

  return (
    <div className="group grid grid-cols-[1fr_80px_80px_80px_28px] gap-3 items-center px-4 py-2.5 hover:bg-white/[0.03] transition-colors">
      <span className="text-sm truncate">{item.label}</span>
      <span className={cn('text-[10px] font-medium uppercase tracking-wide text-center px-1.5 py-0.5 rounded',
        isIncome ? 'text-emerald-400/80 bg-emerald-500/8' : 'text-red-400/80 bg-red-500/8')}>
        {isIncome ? 'Recette' : 'Dépense'}
      </span>
      <span className={cn('text-sm tabular-nums text-right', isIncome ? 'text-emerald-300' : 'text-red-300')}>
        {isIncome ? '+' : '−'}{fmt(item.planned_amount)}
      </span>
      {editingActual ? (
        <input autoFocus value={actual} onChange={e => setActual(e.target.value)} type="number" min="0" step="0.01"
          onBlur={saveActual} onKeyDown={e => { if (e.key === 'Enter') saveActual(); if (e.key === 'Escape') { setEditingActual(false); setActual(String(item.actual_amount)) } }}
          className="bg-white/8 border border-white/20 rounded px-1.5 py-0.5 text-sm text-right outline-none w-full" />
      ) : (
        <button onClick={() => canManage && setEditingActual(true)}
          className={cn('text-sm tabular-nums text-right', canManage && 'hover:underline cursor-pointer', item.actual_amount ? (isIncome ? 'text-emerald-300/70' : 'text-red-300/70') : 'text-muted-foreground/40')}>
          {item.actual_amount ? `${isIncome ? '+' : '−'}${fmt(item.actual_amount)}` : '—'}
        </button>
      )}
      {canManage ? (
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded-md hover:bg-red-500/15 text-muted-foreground/50 hover:text-red-300 transition-all">
          <Trash2 className="h-3 w-3" />
        </button>
      ) : <span />}
    </div>
  )
}

// ─── Tasks section ────────────────────────────────────────────────────────────

function TasksSection({ event, members, canManage, associationId, onRefresh }: {
  event: AssocEventWithDetails; members: MemberRow[]; canManage: boolean; associationId: string; onRefresh: () => void
}) {
  const [newTitle, setNewTitle] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [newDue, setNewDue] = useState('')
  const [adding, setAdding] = useState(false)
  const [, start] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const tasks = [...(event.tasks ?? [])].sort((a, b) => {
    if (!a.due_date && !b.due_date) return a.position - b.position
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return a.due_date.localeCompare(b.due_date)
  })

  const done = tasks.filter(t => t.done).length
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  useEffect(() => { if (adding) inputRef.current?.focus() }, [adding])

  function submitTask() {
    if (!newTitle.trim()) return
    start(async () => {
      const r = await addEventTask(event.id, associationId, {
        title: newTitle.trim(),
        assigned_to: newAssignee || null,
        due_date: newDue || null,
        position: tasks.length,
      })
      if (r.error) toast.error(r.error)
      else { setNewTitle(''); setNewAssignee(''); setNewDue(''); setAdding(false); onRefresh() }
    })
  }

  function handleToggle(id: string, isDone: boolean) {
    start(async () => {
      const r = await toggleEventTask(id, associationId, isDone)
      if (r.error) toast.error(r.error)
      else onRefresh()
    })
  }

  function handleDelete(id: string) {
    start(async () => {
      const r = await deleteEventTask(id, associationId)
      if (r.error) toast.error(r.error)
      else onRefresh()
    })
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">
          Tâches · {done}/{tasks.length}
        </h3>
        {tasks.length > 0 && (
          <span className="text-[11px] text-muted-foreground tabular-nums">{pct}%</span>
        )}
      </div>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="h-1.5 w-full rounded-full bg-white/8 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-400 transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      )}

      <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
        {tasks.length === 0 && !adding && (
          <p className="px-4 py-6 text-xs text-muted-foreground/50 text-center font-heading italic">Aucune tâche planifiée</p>
        )}

        <div className="divide-y divide-white/4">
          {tasks.map(task => {
            const assignee = members.find(m => m.user_id === task.assigned_to)
            return (
              <TaskRow key={task.id} task={task} assignee={assignee ?? null}
                canManage={canManage} onToggle={isDone => handleToggle(task.id, isDone)} onDelete={() => handleDelete(task.id)} />
            )
          })}
        </div>

        {/* Add form */}
        {adding && (
          <div className="px-4 py-3 border-t border-white/6 space-y-2">
            <input ref={inputRef} value={newTitle} onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitTask(); if (e.key === 'Escape') { setAdding(false); setNewTitle('') } }}
              placeholder="Titre de la tâche…"
              className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-white/20" />
            <div className="flex gap-2">
              <select value={newAssignee} onChange={e => setNewAssignee(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-white/15">
                <option value="">— Assigner à —</option>
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id} className="bg-background">
                    {m.user_profiles?.full_name ?? m.user_profiles?.email}
                  </option>
                ))}
              </select>
              <input value={newDue} onChange={e => setNewDue(e.target.value)} type="date"
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-white/15" />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => { setAdding(false); setNewTitle('') }} className="h-7 px-2 text-xs rounded-md hover:bg-white/8 text-muted-foreground transition-colors flex items-center gap-1">
                <X className="h-3 w-3" /> Annuler
              </button>
              <button onClick={submitTask} className="h-7 px-3 text-xs rounded-md bg-foreground text-background hover:opacity-90 flex items-center gap-1 font-medium">
                <Check className="h-3 w-3" /> Ajouter
              </button>
            </div>
          </div>
        )}
      </div>

      {canManage && !adding && (
        <button onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/8 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors">
          <Plus className="h-3 w-3" /> Ajouter une tâche
        </button>
      )}
    </section>
  )
}

function TaskRow({ task, assignee, canManage, onToggle, onDelete }: {
  task: EventTask; assignee: MemberRow | null; canManage: boolean; onToggle: (done: boolean) => void; onDelete: () => void
}) {
  const name = assignee?.user_profiles?.full_name ?? assignee?.user_profiles?.email ?? null
  const dueDays = task.due_date ? daysUntil(task.due_date) : null
  const overdue = dueDays !== null && dueDays < 0 && !task.done

  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors">
      <button onClick={() => onToggle(!task.done)} className="shrink-0 text-muted-foreground/50 hover:text-foreground transition-colors">
        {task.done
          ? <CheckSquare className="h-4 w-4 text-emerald-400" />
          : <Square className="h-4 w-4" />
        }
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm truncate', task.done && 'line-through text-muted-foreground/50')}>{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {name && <span className="text-[11px] text-muted-foreground/60">{name}</span>}
          {task.due_date && (
            <>
              {name && <span className="text-white/20">·</span>}
              <span className={cn('text-[11px] tabular-nums', overdue ? 'text-red-400 font-semibold' : dueDays === 0 ? 'text-amber-300 font-semibold' : 'text-muted-foreground/60')}>
                {overdue ? `En retard (${fmtDateShort(task.due_date)})` : dueDays === 0 ? "Aujourd'hui" : dueDays === 1 ? 'Demain' : fmtDateShort(task.due_date)}
              </span>
            </>
          )}
        </div>
      </div>
      {canManage && (
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded-md hover:bg-red-500/15 text-muted-foreground/50 hover:text-red-300 transition-all shrink-0">
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

// ─── Timeline section ─────────────────────────────────────────────────────────

function TimelineSection({ event, members }: { event: AssocEventWithDetails; members: MemberRow[] }) {
  const tasks = [...(event.tasks ?? [])]
    .filter(t => t.due_date)
    .sort((a, b) => a.due_date!.localeCompare(b.due_date!))

  if (tasks.length === 0) return null

  const allItems: { date: string; label: string; done?: boolean; isEvent?: boolean }[] = [
    ...tasks.map(t => ({ date: t.due_date!, label: t.title, done: t.done })),
  ]
  if (event.event_date) {
    allItems.push({ date: event.event_date, label: event.name, isEvent: true })
    allItems.sort((a, b) => a.date.localeCompare(b.date))
  }

  return (
    <section className="space-y-3">
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.18em] flex items-center gap-2">
        <Sparkles className="h-3 w-3" /> Timeline
      </h3>
      <div className="relative pl-4">
        {/* Vertical line */}
        <div className="absolute left-0 top-2 bottom-2 w-px bg-white/10" />
        <div className="space-y-3">
          {allItems.map((item, i) => (
            <div key={i} className="relative flex items-start gap-3">
              {/* Dot */}
              <div className={cn('absolute -left-4 mt-1.5 h-2 w-2 rounded-full border border-background',
                item.isEvent ? 'bg-primary scale-125' : item.done ? 'bg-emerald-400' : 'bg-white/30'
              )} style={item.isEvent ? { transform: 'translateX(-2px) scale(1.4)' } : {}} />
              <div className="flex-1 min-w-0 ml-2">
                <p className={cn('text-sm', item.isEvent ? 'font-semibold' : item.done ? 'line-through text-muted-foreground/50' : '')}>
                  {item.label}
                </p>
                <p className="text-[11px] text-muted-foreground/60 tabular-nums capitalize">{fmtDateShort(item.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Create / Edit dialog ─────────────────────────────────────────────────────

function EventFormDialog({ event, associationId, onClose, onSuccess }: {
  event?: AssocEventWithDetails
  associationId: string
  onClose: () => void
  onSuccess: (id?: string) => void
}) {
  const isEdit = !!event
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(event?.name ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [date, setDate] = useState(event?.event_date ?? '')
  const [startTime, setStartTime] = useState(event?.start_time?.slice(0, 5) ?? '')
  const [endTime, setEndTime] = useState(event?.end_time?.slice(0, 5) ?? '')
  const [location, setLocation] = useState(event?.location ?? '')
  const [status, setStatus] = useState<AssocEventWithDetails['status']>(event?.status ?? 'planned')
  const [maxParticipants, setMaxParticipants] = useState(event?.max_participants ? String(event.max_participants) : '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const input = {
      name: name.trim(),
      description: description.trim() || null,
      event_date: date || null,
      start_time: startTime || null,
      end_time: endTime || null,
      location: location.trim() || null,
      status: status as AssocEventWithDetails['status'],
      max_participants: maxParticipants ? parseInt(maxParticipants) : null,
    }
    if (isEdit) {
      const r = await updateEvent(event!.id, associationId, input)
      setLoading(false)
      if (r.error) toast.error(r.error)
      else { toast.success('Événement mis à jour'); onSuccess() }
    } else {
      const r = await createEvent(associationId, input)
      setLoading(false)
      if (r.error) toast.error(r.error)
      else { toast.success('Événement créé'); onSuccess(r.event?.id) }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onMouseDown={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div onMouseDown={e => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-popover/95 backdrop-blur-2xl shadow-2xl overflow-hidden">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div className="px-6 pt-5 pb-6">
          <h2 className="text-base font-semibold mb-5">{isEdit ? 'Modifier l\'événement' : 'Nouvel événement'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nom *</label>
              <input value={name} onChange={e => setName(e.target.value)} required autoFocus
                placeholder="Ex: Soirée annuelle, AG 2025…"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/15" />
            </div>

            {/* Date + times */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</label>
                <input value={date} onChange={e => setDate(e.target.value)} type="date"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/15" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Début</label>
                <input value={startTime} onChange={e => setStartTime(e.target.value)} type="time"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/15" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fin</label>
                <input value={endTime} onChange={e => setEndTime(e.target.value)} type="time"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/15" />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lieu</label>
              <input value={location} onChange={e => setLocation(e.target.value)}
                placeholder="Salle, adresse, lien Zoom…"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/15" />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                placeholder="Programme, informations pratiques…"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/15 resize-none" />
            </div>

            {/* Status + max participants */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Statut</label>
                <select value={status} onChange={e => setStatus(e.target.value as AssocEventWithDetails['status'])}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/15">
                  <option value="planned" className="bg-background">Planifié</option>
                  <option value="active"  className="bg-background">En cours</option>
                  <option value="done"    className="bg-background">Terminé</option>
                  <option value="cancelled" className="bg-background">Annulé</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Max. participants</label>
                <input value={maxParticipants} onChange={e => setMaxParticipants(e.target.value)} type="number" min="1"
                  placeholder="Illimité"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/15" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 rounded-xl border border-white/10 text-sm hover:bg-white/5 transition-colors">
                Annuler
              </button>
              <button type="submit" disabled={loading || !name.trim()}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                {loading ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer l\'événement'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
