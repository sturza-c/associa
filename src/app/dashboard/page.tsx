import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/actions/active-association'
import { getConversations } from '@/lib/actions/messages'
import { getTasks } from '@/lib/actions/tasks'
import { getDashboardStats } from '@/lib/actions/dashboard'
import { getEventBudgets } from '@/lib/actions/budgets'
import { LogoUpload } from '@/features/dashboard/logo-upload'
import { roleLabel } from '@/lib/roles'
import type { RoleLabels } from '@/types/database'
import {
  Users,
  ArrowRight,
  MessageSquare,
  Calendar,
  Sparkles,
  CalendarHeart,
  Inbox,
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const PRIORITY_LABELS: Record<string, string> = {
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-400 bg-red-400/10 ring-red-400/20',
  medium: 'text-amber-400 bg-amber-400/10 ring-amber-400/20',
  low: 'text-muted-foreground bg-white/5 ring-white/10',
}

const STATUS_LABELS: Record<string, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  done: 'Terminé',
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' })
}

function formatLongDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('fr-CH', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })
}

function timeAgo(date: string) {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
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
  const d = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - now.getTime()) / 86400000)
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const activeMembership = await getActiveMembership()
  if (!activeMembership) redirect('/onboarding')

  const [stats, conversations, tasks, budgets] = await Promise.all([
    getDashboardStats(activeMembership.association_id),
    getConversations(activeMembership.association_id),
    getTasks(activeMembership.association_id),
    getEventBudgets(activeMembership.association_id),
  ])

  // ---- "Pour vous" — tasks assigned to me ----
  const myOpenTasks = tasks
    .filter(t => t.assigned_to === user.id && t.status !== 'done')
    .sort((a, b) => {
      const da = a.due_date ? daysUntil(a.due_date) : Number.POSITIVE_INFINITY
      const db = b.due_date ? daysUntil(b.due_date) : Number.POSITIVE_INFINITY
      return da - db
    })
  const myTasksPreview = myOpenTasks.slice(0, 5)
  const myOverdueCount = myOpenTasks.filter(t => t.due_date && daysUntil(t.due_date) < 0).length

  // ---- Upcoming events ----
  const upcomingEvents = budgets
    .filter(b => b.event_date && daysUntil(b.event_date) >= 0)
    .sort((a, b) => (a.event_date! < b.event_date! ? -1 : 1))
    .slice(0, 4)

  // ---- Messages ----
  const nowMs = new Date().getTime()
  const ONE_DAY = 24 * 3600 * 1000
  const recentConversations = conversations.slice(0, 4)
  const newishConversations = conversations.filter(c =>
    c.last_message_at && daysUntil(c.last_message_at.slice(0, 10)) >= 0 &&
    (nowMs - new Date(c.last_message_at).getTime()) < ONE_DAY
  )

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()
  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  // Association identity & team composition
  const { data: association } = await supabase
    .from('associations')
    .select('name, description, accent_color, created_at, logo_url, role_labels')
    .eq('id', activeMembership.association_id)
    .single()
  const customRoleLabels = (association?.role_labels as RoleLabels | null) ?? null

  const { data: rolesRows } = await supabase
    .from('association_memberships')
    .select('role')
    .eq('association_id', activeMembership.association_id)
    .eq('is_active', true)

  const roleCounts = {
    president: rolesRows?.filter(r => r.role === 'president').length ?? 0,
    treasurer: rolesRows?.filter(r => r.role === 'treasurer').length ?? 0,
    secretary: rolesRows?.filter(r => r.role === 'secretary').length ?? 0,
    member: rolesRows?.filter(r => r.role === 'member').length ?? 0,
  }
  const totalMembers = stats.memberCount || 1
  const accent = association?.accent_color ?? '#6366f1'
  const foundedYear = association?.created_at
    ? new Date(association.created_at).getFullYear()
    : new Date().getFullYear()

  const today = new Date().toLocaleDateString('fr-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const isPresident = activeMembership.role === 'president'

  return (
    <div className="h-full flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/6 shrink-0">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">
            {activeMembership.associations.name} · {roleLabel(activeMembership.role, customRoleLabels)}
          </p>
          <h1 className="text-[28px] font-semibold mt-1 leading-tight tracking-tight">
            {greeting}
            {firstName && (
              <>
                , <span className="font-heading italic font-normal text-[32px]">{firstName}</span>
              </>
            )}
          </h1>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span className="capitalize">{today}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">

        {/* Hero row: identity hero (3/5) + stat tiles (2/5) */}
        <div className="grid grid-cols-5 gap-5">

          {/* Association identity hero */}
          <div className="col-span-3 relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-md p-7 flex flex-col">
            <div
              aria-hidden
              className="absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-30"
              style={{ backgroundColor: accent }}
            />
            <div className="relative flex flex-col flex-1">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Votre espace
                  </span>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground tabular-nums">
                  Depuis {foundedYear}
                </span>
              </div>

              <div className="flex items-start gap-5">
                <LogoUpload
                  associationId={activeMembership.association_id}
                  associationName={association?.name ?? 'Association'}
                  logoUrl={association?.logo_url ?? null}
                  canEdit={isPresident}
                  accent={accent}
                />
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading italic font-normal text-5xl leading-[1.05] tracking-tight">
                    {association?.name ?? 'Votre association'}
                  </h2>
                  {association?.description ? (
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-md">
                      {association.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/70 mt-3 leading-relaxed font-heading italic">
                      Un espace partagé, géré ensemble — au quotidien.
                    </p>
                  )}
                </div>
              </div>

              {/* Composition de l'équipe */}
              <div className="mt-auto pt-7 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Composition
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    <span className="font-semibold text-foreground">{stats.memberCount}</span> {stats.memberCount > 1 ? 'membres' : 'membre'}
                  </span>
                </div>
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div className="bg-violet-400 transition-all" style={{ width: `${(roleCounts.president / totalMembers) * 100}%` }} />
                  <div className="bg-emerald-400 transition-all" style={{ width: `${(roleCounts.treasurer / totalMembers) * 100}%` }} />
                  <div className="bg-blue-400 transition-all" style={{ width: `${(roleCounts.secretary / totalMembers) * 100}%` }} />
                  <div className="bg-white/30 transition-all" style={{ width: `${(roleCounts.member / totalMembers) * 100}%` }} />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                    {roleLabel('president', customRoleLabels)} <span className="text-foreground tabular-nums">{roleCounts.president}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {roleLabel('treasurer', customRoleLabels)} <span className="text-foreground tabular-nums">{roleCounts.treasurer}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    {roleLabel('secretary', customRoleLabels)} <span className="text-foreground tabular-nums">{roleCounts.secretary}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                    {roleLabel('member', customRoleLabels)} <span className="text-foreground tabular-nums">{roleCounts.member}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stacked stat tiles */}
          <div className="col-span-2 grid grid-rows-3 gap-4">
            {/* Membres */}
            <StatTile
              label="Membres"
              value={stats.memberCount.toString()}
              hint="actifs"
              icon={Users}
              href="/dashboard/members"
            />

            {/* Finances / balance */}
            <Link
              href="/dashboard/finances"
              className="group relative rounded-2xl border border-white/7 bg-white/[0.035] backdrop-blur-md p-4 hover:bg-white/[0.06] transition-colors overflow-hidden"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
                Trésorerie
              </p>
              <p className={cn(
                'text-2xl font-bold tabular-nums leading-none',
                stats.balance < 0 ? 'text-red-300' : 'text-foreground'
              )}>
                {stats.balance >= 0 ? '+' : ''}{new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(stats.balance)}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-[11px] text-emerald-400/80">
                  <TrendingUp className="h-3 w-3" />
                  {new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(stats.income)}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-red-400/80">
                  <TrendingDown className="h-3 w-3" />
                  {new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(stats.expenses)}
                </span>
              </div>
              <Wallet className="absolute bottom-3 right-3 h-8 w-8 text-white/[0.04] group-hover:text-white/[0.07] transition-colors" />
            </Link>

            {/* Prochain événement */}
            {upcomingEvents[0] ? (
              <Link
                href="/dashboard/finances"
                className="group relative rounded-2xl border border-white/7 bg-white/[0.035] backdrop-blur-md p-4 hover:bg-white/[0.06] transition-colors overflow-hidden"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
                  Prochain événement
                </p>
                <p className="text-sm font-semibold truncate leading-snug group-hover:text-foreground transition-colors">
                  {upcomingEvents[0].name}
                </p>
                <p className={cn(
                  'text-[11px] mt-1 tabular-nums',
                  daysUntil(upcomingEvents[0].event_date!) <= 3 ? 'text-amber-400' : 'text-muted-foreground'
                )}>
                  {daysUntil(upcomingEvents[0].event_date!) === 0
                    ? "Aujourd'hui"
                    : daysUntil(upcomingEvents[0].event_date!) === 1
                      ? 'Demain'
                      : `Dans ${daysUntil(upcomingEvents[0].event_date!)} j · ${formatLongDate(upcomingEvents[0].event_date!)}`}
                </p>
                <CalendarHeart className="absolute bottom-3 right-3 h-8 w-8 text-white/[0.04] group-hover:text-white/[0.07] transition-colors" />
              </Link>
            ) : (
              <StatTile
                label="Agenda"
                value={budgets.length.toString()}
                hint="budgets"
                icon={CalendarHeart}
                href="/dashboard/finances"
              />
            )}
          </div>
        </div>

        {/* Pour vous + Prochains événements */}
        <div className="grid grid-cols-5 gap-5">

          {/* Pour vous */}
          <div className="col-span-3 rounded-2xl border border-white/7 bg-white/[0.035] backdrop-blur-md overflow-hidden flex flex-col">
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
                {myOverdueCount > 0 && (
                  <span className="text-[10px] bg-red-400/15 text-red-300 ring-1 ring-red-400/25 rounded-md px-1.5 py-0.5 font-semibold tabular-nums">
                    {myOverdueCount} en retard
                  </span>
                )}
              </div>
              <Link
                href="/dashboard/tasks"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Voir tout <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {myTasksPreview.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-14 text-center px-6">
                <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <Inbox className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Rien ne vous attend
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1 font-heading italic">
                  Profitez du calme.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {myTasksPreview.map(task => {
                  const due = task.due_date ? daysUntil(task.due_date) : null
                  const overdue = due !== null && due < 0
                  const soon = due !== null && due >= 0 && due <= 3

                  return (
                    <Link
                      key={task.id}
                      href="/dashboard/tasks"
                      className="group flex items-start gap-3 px-6 py-3.5 hover:bg-white/4 transition-colors"
                    >
                      <div className={cn(
                        'mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1',
                        PRIORITY_COLORS[task.priority]
                      )}>
                        {PRIORITY_LABELS[task.priority]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-foreground transition-colors">
                          {task.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <span>{STATUS_LABELS[task.status]}</span>
                          {task.due_date && (
                            <>
                              <span className="text-muted-foreground/40">·</span>
                              <span className={cn(
                                overdue && 'text-red-400 font-semibold',
                                soon && !overdue && 'text-amber-400 font-semibold'
                              )}>
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

          {/* Prochains événements */}
          <div className="col-span-2 rounded-2xl border border-white/7 bg-white/[0.035] backdrop-blur-md overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
              <div className="flex items-center gap-2.5">
                <CalendarHeart className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">
                  <span className="font-heading italic font-normal text-muted-foreground">Prochains</span> événements
                </h2>
              </div>
              <Link
                href="/dashboard/finances"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Budgets <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-14 text-center px-6">
                <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <CalendarHeart className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">Aucun événement planifié</p>
                <Link href="/dashboard/finances" className="mt-3 text-xs text-primary hover:underline">
                  Créer un budget →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {upcomingEvents.map(ev => {
                  const days = daysUntil(ev.event_date!)
                  const planned = ev.lines.reduce(
                    (sum, l) => sum + (l.type === 'income' ? Number(l.planned_amount) : -Number(l.planned_amount)),
                    0
                  )
                  const dayLabel = days === 0 ? "Aujourd'hui" : days === 1 ? 'Demain' : `Dans ${days}j`
                  return (
                    <Link
                      key={ev.id}
                      href="/dashboard/finances"
                      className="group block px-6 py-3.5 hover:bg-white/4 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate group-hover:text-foreground transition-colors">
                            {ev.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">
                            {formatLongDate(ev.event_date!)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={cn(
                            'text-[10px] font-semibold uppercase tracking-wider',
                            days <= 3 ? 'text-amber-400' : 'text-muted-foreground'
                          )}>
                            {dayLabel}
                          </p>
                          {ev.lines.length > 0 && (
                            <p className={cn(
                              'text-[11px] tabular-nums mt-1',
                              planned >= 0 ? 'text-emerald-400/80' : 'text-red-400/80'
                            )}>
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

        </div>

        {/* Messages */}
        <div className="rounded-2xl border border-white/7 bg-white/[0.035] backdrop-blur-md overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">
                Messages <span className="font-heading italic font-normal text-muted-foreground">récents</span>
              </h2>
              {newishConversations.length > 0 && (
                <span className="text-[10px] bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/25 rounded-md px-1.5 py-0.5 font-semibold tabular-nums">
                  {newishConversations.length} récent{newishConversations.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <Link
              href="/dashboard/messages"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Ouvrir <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-6">
              <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <MessageSquare className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">Aucune conversation</p>
              <Link href="/dashboard/messages" className="mt-3 text-xs text-primary hover:underline">
                Démarrer une conversation →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 divide-x divide-white/5">
              {recentConversations.map(conv => {
                const others = conv.participants?.filter(p => p.user_id !== user.id) ?? []
                const title = conv.title ?? (others.length > 0
                  ? others.map(p => p.full_name || p.email).join(', ')
                  : 'Moi-même')
                const initials = others[0]
                  ? getInitials(others[0].full_name, others[0].email)
                  : '?'
                const isNew = conv.last_message_at &&
                  (nowMs - new Date(conv.last_message_at).getTime()) < ONE_DAY

                return (
                  <Link
                    key={conv.id}
                    href="/dashboard/messages"
                    className="group flex items-center gap-4 px-6 py-4 hover:bg-white/4 transition-colors"
                  >
                    <div className="relative">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/15 to-white/5 text-xs font-semibold ring-1 ring-white/10">
                        {initials}
                      </div>
                      {isNew && (
                        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-medium truncate group-hover:text-foreground transition-colors">
                          {title}
                        </p>
                        {conv.last_message_at && (
                          <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
                            {timeAgo(conv.last_message_at)}
                          </span>
                        )}
                      </div>
                      {conv.last_message && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {conv.last_message}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  href,
}: {
  label: string
  value: string
  hint: string
  icon: React.ElementType
  href: string
}) {
  return (
    <Link
      href={href}
      className="group relative rounded-2xl border border-white/7 bg-white/[0.035] backdrop-blur-md p-4 hover:bg-white/[0.06] transition-colors flex items-center gap-4"
    >
      <div className="h-10 w-10 shrink-0 rounded-xl bg-white/5 flex items-center justify-center ring-1 ring-white/8 group-hover:ring-white/15 transition-all">
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-bold tabular-nums leading-none mt-1">{value}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[11px] text-muted-foreground">{hint}</p>
        <ArrowRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all inline-block mt-1" />
      </div>
    </Link>
  )
}
