'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { LogoUpload } from '@/features/dashboard/logo-upload'
import { roleLabel } from '@/lib/roles'
import type { Task, RoleLabels, EventBudgetWithLines } from '@/types/database'
import type { ConversationWithDetails } from '@/lib/actions/messages'
import type { DashboardStats } from '@/lib/actions/dashboard'
import {
  Users, ArrowRight, MessageSquare, Calendar, Sparkles,
  CalendarHeart, CalendarDays, Inbox, TrendingUp, TrendingDown, Wallet,
  Settings2, GripVertical, Eye, EyeOff, ChevronUp, ChevronDown, X,
  CheckCircle2, Circle, Image, UserPlus, CalendarPlus, Receipt, Globe,
  Rocket, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export type WidgetId = 'tasks' | 'events' | 'messages'

interface WidgetConfig {
  order: WidgetId[]
  hidden: WidgetId[]
}

const DEFAULT_CONFIG: WidgetConfig = {
  order: ['tasks', 'events', 'messages'],
  hidden: [],
}

const STORAGE_KEY = 'dashboard_widgets_v1'

const WIDGET_LABELS: Record<WidgetId, string> = {
  tasks: 'Pour vous',
  events: 'Prochains événements',
  messages: 'Messages récents',
}

export interface DashboardData {
  firstName: string
  greeting: string
  today: string
  isPresident: boolean
  association: {
    id: string
    name: string
    description: string | null
    logo_url: string | null
    accent_color: string
    role_labels: RoleLabels | null
    created_at: string
    is_public: boolean
  }
  stats: DashboardStats
  roleCounts: { president: number; treasurer: number; secretary: number; member: number }
  tasks: Task[]
  budgets: EventBudgetWithLines[]
  conversations: ConversationWithDetails[]
  userId: string
  associationId: string
  callerRole: string
  customRoleLabels: RoleLabels | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_LABELS: Record<string, string> = {
  high: 'Haute', medium: 'Moyenne', low: 'Basse',
}
const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-400 bg-red-400/10 ring-red-400/20',
  medium: 'text-amber-400 bg-amber-400/10 ring-amber-400/20',
  low: 'text-muted-foreground bg-white/5 ring-white/10',
}
const STATUS_LABELS: Record<string, string> = {
  todo: 'À faire', in_progress: 'En cours', done: 'Terminé',
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' })
}
function formatLongDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('fr-CH', {
    weekday: 'short', day: 'numeric', month: 'long',
  })
}
function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `${mins}min`
  if (hours < 24) return `${hours}h`
  if (days === 1) return 'Hier'
  if (days < 7) return `${days}j`
  return formatDate(date)
}
function getInitials(name: string | null, email: string) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (email[0] ?? '?').toUpperCase()
}
function daysUntil(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - now.getTime()) / 86400000)
}

// ─── Getting started widget ───────────────────────────────────────────────────

const ONBOARDING_DISMISSED_KEY = 'onboarding_dismissed_v1'

interface OnboardingStep {
  id: string
  icon: React.ElementType
  title: string
  description: string
  href: string
  cta: string
  done: boolean
}

function GettingStartedWidget({ steps, accent }: { steps: OnboardingStep[]; accent: string }) {
  const [dismissed, setDismissed] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setDismissed(localStorage.getItem(ONBOARDING_DISMISSED_KEY) === '1')
    setHydrated(true)
  }, [])

  if (!hydrated || dismissed) return null

  const doneCount = steps.filter(s => s.done).length
  const total = steps.length
  const allDone = doneCount === total
  const pct = Math.round((doneCount / total) * 100)

  if (allDone) return null

  return (
    <div
      className="rounded-2xl border border-border overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${accent}0d 0%, transparent 50%)` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <button
          onClick={() => setCollapsed(v => !v)}
          className="flex items-center gap-3 flex-1 text-left"
        >
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: accent + '22', color: accent }}
          >
            <Rocket className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">
              Guide de démarrage
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {doneCount} / {total} étapes complétées
            </p>
          </div>
          {/* Progress pill */}
          <div className="ml-auto mr-3 flex items-center gap-2">
            <div className="w-24 h-1.5 rounded-full bg-foreground/8 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: accent }}
              />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
          </div>
          <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform shrink-0', collapsed ? '' : 'rotate-90')} />
        </button>
        <button
          onClick={() => { localStorage.setItem(ONBOARDING_DISMISSED_KEY, '1'); setDismissed(true) }}
          className="ml-3 h-7 w-7 flex items-center justify-center rounded-lg hover:bg-foreground/8 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title="Masquer ce guide"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Steps */}
      {!collapsed && (
        <div className="divide-y divide-border">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-4 px-6 py-4 transition-colors',
                  step.done ? 'opacity-50' : 'hover:bg-foreground/[0.02]'
                )}
              >
                {/* Step number / checkmark */}
                <div className="shrink-0">
                  {step.done ? (
                    <CheckCircle2 className="h-5 w-5" style={{ color: accent }} />
                  ) : (
                    <div
                      className="h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                      style={{ borderColor: accent + '66', color: accent }}
                    >
                      {i + 1}
                    </div>
                  )}
                </div>

                {/* Icon */}
                <div
                  className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: step.done ? 'transparent' : accent + '15', color: step.done ? 'var(--muted-foreground)' : accent }}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', step.done && 'line-through text-muted-foreground')}>
                    {step.title}
                  </p>
                  {!step.done && (
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  )}
                </div>

                {/* CTA */}
                {!step.done && (
                  <Link
                    href={step.href}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors"
                    style={{ backgroundColor: accent + '18', color: accent }}
                  >
                    {step.cta}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
                {step.done && (
                  <span className="shrink-0 text-xs text-muted-foreground">Fait ✓</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Customize panel ─────────────────────────────────────────────────────────

function CustomizePanel({
  config,
  onChange,
  onClose,
}: {
  config: WidgetConfig
  onChange: (c: WidgetConfig) => void
  onClose: () => void
}) {
  const ALL: WidgetId[] = ['tasks', 'events', 'messages']

  function moveUp(id: WidgetId) {
    const order = [...config.order]
    const i = order.indexOf(id)
    if (i <= 0) return
    ;[order[i - 1], order[i]] = [order[i], order[i - 1]]
    onChange({ ...config, order })
  }
  function moveDown(id: WidgetId) {
    const order = [...config.order]
    const i = order.indexOf(id)
    if (i >= order.length - 1) return
    ;[order[i], order[i + 1]] = [order[i + 1], order[i]]
    onChange({ ...config, order })
  }
  function toggleHide(id: WidgetId) {
    const hidden = config.hidden.includes(id)
      ? config.hidden.filter(h => h !== id)
      : [...config.hidden, id]
    onChange({ ...config, hidden })
  }
  function reset() {
    onChange(DEFAULT_CONFIG)
  }

  return (
    <div className="absolute top-full right-0 mt-2 w-72 rounded-2xl border border-border bg-popover shadow-2xl backdrop-blur-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold">Personnaliser</p>
        <button onClick={onClose} className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-foreground/8 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-2 space-y-0.5">
        {config.order.map((id, i) => {
          const isHidden = config.hidden.includes(id)
          return (
            <div key={id} className={cn(
              'flex items-center gap-2 rounded-xl px-2 py-2 transition-colors',
              isHidden ? 'opacity-50' : 'opacity-100'
            )}>
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
              <span className="flex-1 text-sm truncate">{WIDGET_LABELS[id]}</span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => moveUp(id)}
                  disabled={i === 0}
                  className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-foreground/8 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-25 disabled:pointer-events-none"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  onClick={() => moveDown(id)}
                  disabled={i === config.order.length - 1}
                  className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-foreground/8 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-25 disabled:pointer-events-none"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
                <button
                  onClick={() => toggleHide(id)}
                  className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-foreground/8 text-muted-foreground hover:text-foreground transition-colors ml-1"
                  title={isHidden ? 'Afficher' : 'Masquer'}
                >
                  {isHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <div className="px-4 py-3 border-t border-border">
        <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Réinitialiser
        </button>
      </div>
    </div>
  )
}

// ─── Widget renderers ─────────────────────────────────────────────────────────

function TasksWidget({ tasks, userId }: { tasks: Task[]; userId: string }) {
  const myOpenTasks = useMemo(() =>
    tasks
      .filter(t => t.assigned_to === userId && t.status !== 'done')
      .sort((a, b) => {
        const da = a.due_date ? daysUntil(a.due_date) : Number.POSITIVE_INFINITY
        const db = b.due_date ? daysUntil(b.due_date) : Number.POSITIVE_INFINITY
        return da - db
      }),
    [tasks, userId]
  )
  const preview = myOpenTasks.slice(0, 5)
  const overdueCount = myOpenTasks.filter(t => t.due_date && daysUntil(t.due_date) < 0).length

  return (
    <div className="rounded-2xl border border-white/7 bg-white/[0.035] backdrop-blur-md overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <Inbox className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">
            <span className="font-heading italic font-normal text-muted-foreground">Pour</span> vous
          </h2>
          {myOpenTasks.length > 0 && (
            <span className="text-[10px] bg-white/8 rounded-md px-1.5 py-0.5 font-semibold tabular-nums">
              {myOpenTasks.length}
            </span>
          )}
          {overdueCount > 0 && (
            <span className="text-[10px] bg-red-400/15 text-red-300 ring-1 ring-red-400/25 rounded-md px-1.5 py-0.5 font-semibold tabular-nums">
              {overdueCount} en retard
            </span>
          )}
        </div>
        <Link href="/dashboard/tasks" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          Voir tout <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {preview.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-14 text-center px-6">
          <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <Inbox className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">Rien ne vous attend</p>
          <p className="text-xs text-muted-foreground/60 mt-1 font-heading italic">Profitez du calme.</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {preview.map(task => {
            const due = task.due_date ? daysUntil(task.due_date) : null
            const overdue = due !== null && due < 0
            const soon = due !== null && due >= 0 && due <= 3
            return (
              <Link key={task.id} href="/dashboard/tasks" className="group flex items-start gap-3 px-6 py-3.5 hover:bg-white/4 transition-colors">
                <div className={cn('mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1', PRIORITY_COLORS[task.priority])}>
                  {PRIORITY_LABELS[task.priority]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-foreground transition-colors">{task.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <span>{STATUS_LABELS[task.status]}</span>
                    {task.due_date && (
                      <>
                        <span className="text-muted-foreground/40">·</span>
                        <span className={cn(overdue && 'text-red-400 font-semibold', soon && !overdue && 'text-amber-400 font-semibold')}>
                          {overdue ? `En retard de ${-due!}j` : due === 0 ? "Aujourd'hui" : due === 1 ? 'Demain' : formatDate(task.due_date)}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EventsWidget({ budgets }: { budgets: EventBudgetWithLines[] }) {
  const upcoming = useMemo(() =>
    budgets
      .filter(b => b.event_date && daysUntil(b.event_date) >= 0)
      .sort((a, b) => (a.event_date! < b.event_date! ? -1 : 1))
      .slice(0, 4),
    [budgets]
  )

  return (
    <div className="rounded-2xl border border-white/7 bg-white/[0.035] backdrop-blur-md overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <CalendarHeart className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">
            <span className="font-heading italic font-normal text-muted-foreground">Prochains</span> événements
          </h2>
        </div>
        <Link href="/dashboard/events" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          Voir tout <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {upcoming.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-14 text-center px-6">
          <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <CalendarHeart className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">Aucun événement planifié</p>
          <Link href="/dashboard/events" className="mt-3 text-xs text-primary hover:underline">Créer un événement →</Link>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {upcoming.map(ev => {
            const days = daysUntil(ev.event_date!)
            const planned = ev.lines.reduce((s, l) => s + (l.type === 'income' ? Number(l.planned_amount) : -Number(l.planned_amount)), 0)
            const dayLabel = days === 0 ? "Aujourd'hui" : days === 1 ? 'Demain' : `Dans ${days}j`
            return (
              <Link key={ev.id} href="/dashboard/events" className="group block px-6 py-3.5 hover:bg-white/4 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate group-hover:text-foreground transition-colors">{ev.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">{formatLongDate(ev.event_date!)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-[10px] font-semibold uppercase tracking-wider', days <= 3 ? 'text-amber-400' : 'text-muted-foreground')}>
                      {dayLabel}
                    </p>
                    {ev.lines.length > 0 && (
                      <p className={cn('text-[11px] tabular-nums mt-1', planned >= 0 ? 'text-emerald-400/80' : 'text-red-400/80')}>
                        {planned >= 0 ? '+' : ''}{Math.round(planned)} CHF
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MessagesWidget({ conversations, userId }: { conversations: ConversationWithDetails[]; userId: string }) {
  const ONE_DAY = 24 * 3600 * 1000
  const nowMs = Date.now()
  const recent = conversations.slice(0, 4)
  const newishCount = conversations.filter(c =>
    c.last_message_at && (nowMs - new Date(c.last_message_at).getTime()) < ONE_DAY
  ).length

  return (
    <div className="rounded-2xl border border-white/7 bg-white/[0.035] backdrop-blur-md overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">
            Messages <span className="font-heading italic font-normal text-muted-foreground">récents</span>
          </h2>
          {newishCount > 0 && (
            <span className="text-[10px] bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/25 rounded-md px-1.5 py-0.5 font-semibold tabular-nums">
              {newishCount} récent{newishCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <Link href="/dashboard/messages" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          Ouvrir <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center px-6">
          <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <MessageSquare className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <p className="text-sm text-muted-foreground">Aucune conversation</p>
          <Link href="/dashboard/messages" className="mt-3 text-xs text-primary hover:underline">Démarrer une conversation →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 divide-x divide-white/5">
          {recent.map(conv => {
            const others = conv.participants?.filter(p => p.user_id !== userId) ?? []
            const title = conv.title ?? (others.length > 0 ? others.map(p => p.full_name || p.email).join(', ') : 'Moi-même')
            const initials = others[0] ? getInitials(others[0].full_name, others[0].email) : '?'
            const isNew = conv.last_message_at && (nowMs - new Date(conv.last_message_at).getTime()) < ONE_DAY
            return (
              <Link key={conv.id} href="/dashboard/messages" className="group flex items-center gap-4 px-6 py-4 hover:bg-white/4 transition-colors">
                <div className="relative">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/15 to-white/5 text-xs font-semibold ring-1 ring-white/10">
                    {initials}
                  </div>
                  {isNew && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium truncate group-hover:text-foreground transition-colors">{title}</p>
                    {conv.last_message_at && (
                      <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">{timeAgo(conv.last_message_at)}</span>
                    )}
                  </div>
                  {conv.last_message && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DashboardClient({ data }: { data: DashboardData }) {
  const {
    firstName, greeting, today, isPresident,
    association, stats, roleCounts, tasks, budgets, conversations,
    userId, associationId, customRoleLabels,
  } = data

  const totalMembers = stats.memberCount || 1
  const accent = association.accent_color ?? '#6366f1'
  const foundedYear = new Date(association.created_at).getFullYear()

  const upcomingFirst = useMemo(() =>
    budgets.filter(b => b.event_date && daysUntil(b.event_date) >= 0)
      .sort((a, b) => (a.event_date! < b.event_date! ? -1 : 1))[0],
    [budgets]
  )

  // Widget preferences
  const [config, setConfig] = useState<WidgetConfig>(DEFAULT_CONFIG)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setConfig(JSON.parse(stored))
    } catch { /* ignore */ }
    setHydrated(true)
  }, [])

  function updateConfig(c: WidgetConfig) {
    setConfig(c)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c))
  }

  const visibleWidgets = config.order.filter(id => !config.hidden.includes(id))

  // Onboarding steps — computed from real data
  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'association',
      icon: Sparkles,
      title: 'Créer votre espace',
      description: 'Votre association a été créée avec succès.',
      href: '/dashboard/settings',
      cta: 'Paramètres',
      done: true,
    },
    {
      id: 'logo',
      icon: Image,
      title: 'Ajouter un logo',
      description: 'Personnalisez l\'apparence de votre association avec un logo.',
      href: '/dashboard/settings',
      cta: 'Ajouter',
      done: !!association.logo_url,
    },
    {
      id: 'members',
      icon: UserPlus,
      title: 'Inviter des membres',
      description: 'Invitez votre équipe à rejoindre l\'espace.',
      href: '/dashboard/members',
      cta: 'Inviter',
      done: stats.memberCount > 1,
    },
    {
      id: 'event',
      icon: CalendarPlus,
      title: 'Créer un événement',
      description: 'Planifiez votre premier événement avec date, lieu et participants.',
      href: '/dashboard/events',
      cta: 'Créer',
      done: budgets.length > 0,
    },
    {
      id: 'finance',
      icon: Receipt,
      title: 'Enregistrer une transaction',
      description: 'Ajoutez une recette ou une dépense pour suivre votre trésorerie.',
      href: '/dashboard/finances',
      cta: 'Ajouter',
      done: stats.income > 0 || stats.expenses > 0,
    },
    {
      id: 'public',
      icon: Globe,
      title: 'Activer la page publique',
      description: 'Partagez un lien public pour présenter votre association.',
      href: '/dashboard/settings',
      cta: 'Activer',
      done: association.is_public,
    },
  ]

  // Render a widget by id, with optional col-span class
  function renderWidget(id: WidgetId, className?: string) {
    switch (id) {
      case 'tasks':    return <div key="tasks"    className={className}><TasksWidget tasks={tasks} userId={userId} /></div>
      case 'events':   return <div key="events"   className={className}><EventsWidget budgets={budgets} /></div>
      case 'messages': return <div key="messages" className={className}><MessagesWidget conversations={conversations} userId={userId} /></div>
    }
  }

  // Group consecutive tasks+events into a shared row; everything else is full-width
  function renderWidgetRows() {
    const rows: React.ReactNode[] = []
    let i = 0
    while (i < visibleWidgets.length) {
      const cur = visibleWidgets[i]
      const nxt = visibleWidgets[i + 1]
      const pair = new Set(['tasks', 'events'])
      if (pair.has(cur) && nxt && pair.has(nxt)) {
        // Side by side — tasks gets col-span-3, events col-span-2
        const tasksFirst = cur === 'tasks'
        rows.push(
          <div key={`row-${i}`} className="grid grid-cols-5 gap-5">
            {renderWidget(tasksFirst ? 'tasks' : 'events', 'col-span-3')}
            {renderWidget(tasksFirst ? 'events' : 'tasks', 'col-span-2')}
          </div>
        )
        i += 2
      } else {
        rows.push(renderWidget(cur))
        i++
      }
    }
    return rows
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/6 shrink-0">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">
            {association.name} · {roleLabel(data.callerRole as import('@/types/database').Role, customRoleLabels)}
          </p>
          <h1 className="text-[28px] font-semibold mt-1 leading-tight tracking-tight">
            {greeting}{firstName && (<>, <span className="font-heading italic font-normal text-[32px]">{firstName}</span></>)}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className="capitalize">{today}</span>
          </div>
          {/* Customize button */}
          <div className="relative">
            <button
              onClick={() => setCustomizeOpen(v => !v)}
              title="Personnaliser le tableau de bord"
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-xl border border-border transition-colors',
                customizeOpen ? 'bg-foreground/10 text-foreground border-foreground/20' : 'bg-background/50 text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
              )}
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
            {customizeOpen && (
              <CustomizePanel
                config={config}
                onChange={updateConfig}
                onClose={() => setCustomizeOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">

        {/* Hero row — always fixed */}
        <div className="grid grid-cols-5 gap-5">

          {/* ── Votre espace ── */}
          <div className="col-span-3 relative overflow-hidden rounded-2xl border border-white/8 backdrop-blur-md"
            style={{ background: `linear-gradient(135deg, ${accent}18 0%, ${accent}06 40%, transparent 70%)` }}>
            <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl opacity-20" style={{ backgroundColor: accent }} />

            <div className="relative flex items-center gap-4 px-5 py-4">
              <LogoUpload
                associationId={associationId}
                associationName={association.name}
                logoUrl={association.logo_url}
                canEdit={isPresident}
                accent={accent}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="h-3 w-3" /> Votre espace · depuis {foundedYear}
                </p>
                <h2 className="font-heading italic font-normal text-3xl leading-tight tracking-tight truncate">{association.name}</h2>
                {association.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{association.description}</p>
                )}
              </div>
            </div>

            <div className="h-px mx-5 bg-white/[0.06]" />

            <div className="relative px-5 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Composition</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  <span className="font-semibold text-foreground">{stats.memberCount}</span> {stats.memberCount > 1 ? 'membres' : 'membre'}
                </span>
              </div>
              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06] gap-px">
                {roleCounts.president > 0 && <div className="bg-violet-400 transition-all" style={{ width: `${(roleCounts.president / totalMembers) * 100}%` }} />}
                {roleCounts.treasurer > 0 && <div className="bg-emerald-400 transition-all" style={{ width: `${(roleCounts.treasurer / totalMembers) * 100}%` }} />}
                {roleCounts.secretary > 0 && <div className="bg-blue-400 transition-all" style={{ width: `${(roleCounts.secretary / totalMembers) * 100}%` }} />}
                {roleCounts.member > 0 && <div className="bg-white/25 transition-all" style={{ width: `${(roleCounts.member / totalMembers) * 100}%` }} />}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground">
                {(['president', 'treasurer', 'secretary', 'member'] as const).map(role => {
                  const dotColors = { president: 'bg-violet-400', treasurer: 'bg-emerald-400', secretary: 'bg-blue-400', member: 'bg-white/25' }
                  if (roleCounts[role] === 0) return null
                  return (
                    <span key={role} className="flex items-center gap-1.5">
                      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dotColors[role])} />
                      {roleLabel(role, customRoleLabels)}
                      <span className="font-semibold text-foreground tabular-nums">{roleCounts[role]}</span>
                    </span>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Stat tiles column ── */}
          <div className="col-span-2 grid grid-rows-3 gap-4">

            {/* Membres */}
            <Link href="/dashboard/members" className="group relative overflow-hidden rounded-2xl border border-white/7 bg-white/[0.03] backdrop-blur-md px-5 py-4 hover:bg-white/[0.06] transition-all hover:border-white/12 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Membres</p>
                <p className="text-3xl font-bold tabular-nums leading-none mt-1.5">{stats.memberCount}</p>
                <div className="flex items-center gap-1 mt-2">
                  {(['president', 'treasurer', 'secretary', 'member'] as const).map(role => {
                    const colors = { president: 'bg-violet-400', treasurer: 'bg-emerald-400', secretary: 'bg-blue-400', member: 'bg-white/20' }
                    if (roleCounts[role] === 0) return null
                    return <span key={role} className={cn('h-1.5 rounded-full', colors[role])} style={{ width: `${Math.max(6, (roleCounts[role] / totalMembers) * 48)}px` }} />
                  })}
                </div>
              </div>
              <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center ring-1 ring-white/8 group-hover:ring-white/15 transition-all shrink-0">
                <Users className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>

            {/* Trésorerie */}
            <Link href="/dashboard/finances" className="group relative overflow-hidden rounded-2xl border border-white/7 bg-white/[0.03] backdrop-blur-md px-5 py-4 hover:bg-white/[0.06] transition-all hover:border-white/12 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Trésorerie</p>
                <p className={cn('text-2xl font-bold tabular-nums leading-none mt-1.5 truncate', stats.balance < 0 ? 'text-red-300' : stats.balance > 0 ? 'text-emerald-300' : 'text-foreground')}>
                  {stats.balance >= 0 ? '+' : ''}{new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(stats.balance)}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400/80">
                    <TrendingUp className="h-3 w-3" />{new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(stats.income)}
                  </span>
                  <span className="text-white/20">·</span>
                  <span className="flex items-center gap-1 text-[11px] text-red-400/80">
                    <TrendingDown className="h-3 w-3" />{new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(stats.expenses)}
                  </span>
                </div>
              </div>
              <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center ring-1 ring-white/8 group-hover:ring-white/15 transition-all shrink-0">
                <Wallet className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>

            {/* Événements */}
            <Link href="/dashboard/events" className="group relative overflow-hidden rounded-2xl border border-white/7 bg-white/[0.03] backdrop-blur-md px-5 py-4 hover:bg-white/[0.06] transition-all hover:border-white/12 flex items-center justify-between gap-4">
              {upcomingFirst ? (
                <>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Prochain événement</p>
                    <p className="text-sm font-semibold mt-1.5 truncate">{upcomingFirst.name}</p>
                    <span className={cn(
                      'inline-flex items-center gap-1 text-[11px] font-medium mt-1.5',
                      daysUntil(upcomingFirst.event_date!) <= 1 ? 'text-amber-400' : 'text-muted-foreground'
                    )}>
                      <CalendarDays className="h-3 w-3" />
                      {daysUntil(upcomingFirst.event_date!) === 0 ? "Aujourd'hui"
                        : daysUntil(upcomingFirst.event_date!) === 1 ? 'Demain'
                        : `Dans ${daysUntil(upcomingFirst.event_date!)} j`}
                    </span>
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center ring-1 ring-white/8 group-hover:ring-white/15 transition-all shrink-0">
                    <CalendarHeart className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Événements</p>
                    <p className="text-3xl font-bold tabular-nums leading-none mt-1.5">{budgets.length}</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-1.5">{budgets.length === 0 ? 'Créer →' : 'planifiés'}</p>
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center ring-1 ring-white/8 group-hover:ring-white/15 transition-all shrink-0">
                    <CalendarHeart className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </>
              )}
            </Link>

          </div>
        </div>

        {/* Getting started — president only */}
        {isPresident && hydrated && (
          <GettingStartedWidget steps={onboardingSteps} accent={accent} />
        )}

        {/* Customizable widgets */}
        {hydrated && (
          <div className="space-y-6">
            {renderWidgetRows()}
            {visibleWidgets.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-muted-foreground">Tous les widgets sont masqués</p>
                <button onClick={() => updateConfig(DEFAULT_CONFIG)} className="mt-3 text-xs text-primary hover:underline">
                  Réafficher tout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

