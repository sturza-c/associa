'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { updateTaskStatus, deleteTask } from '@/lib/actions/tasks'
import { CreateTaskDialog } from './create-task-dialog'
import type { Task, TaskStatus, Role, MembershipWithProfile } from '@/types/database'
import { Trash2, CircleDot, CircleCheck, Circle, CalendarDays, CheckSquare, Search, Users, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUSES: { value: TaskStatus; label: string; icon: React.ElementType }[] = [
  { value: 'todo', label: 'À faire', icon: Circle },
  { value: 'in_progress', label: 'En cours', icon: CircleDot },
  { value: 'done', label: 'Terminé', icon: CircleCheck },
]

const PRIORITY_COLORS = {
  low: 'bg-white/5 text-muted-foreground ring-white/10',
  medium: 'bg-amber-500/10 text-amber-300 ring-amber-500/25',
  high: 'bg-red-500/10 text-red-300 ring-red-500/25',
}

const PRIORITY_LABELS = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' })
}

function daysUntil(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - now.getTime()) / 86400000)
}

function getMemberName(userId: string, members: MembershipWithProfile[]) {
  const m = members.find(m => m.user_id === userId)
  return m?.user_profiles.full_name || m?.user_profiles.email || '?'
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

type Scope = 'personal' | 'team'

interface Props {
  tasks: Task[]
  members: MembershipWithProfile[]
  associationId: string
  callerRole: Role
  currentUserId: string
  onRefresh: () => void
}

export function TasksClient({ tasks, members, associationId, callerRole, currentUserId, onRefresh }: Props) {
  const [scope, setScope] = useState<Scope>('team')
  const [activeStatus, setActiveStatus] = useState<TaskStatus | 'all'>('all')
  const [query, setQuery] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Split by scope
  const personalTasks = useMemo(() =>
    tasks.filter(t => t.is_personal && (t.created_by === currentUserId || t.assigned_to === currentUserId)),
    [tasks, currentUserId]
  )
  const teamTasks = useMemo(() =>
    tasks.filter(t => !t.is_personal),
    [tasks]
  )

  const scopedTasks = scope === 'personal' ? personalTasks : teamTasks

  const counts = useMemo(() => ({
    all: scopedTasks.length,
    todo: scopedTasks.filter(t => t.status === 'todo').length,
    in_progress: scopedTasks.filter(t => t.status === 'in_progress').length,
    done: scopedTasks.filter(t => t.status === 'done').length,
  }), [scopedTasks])

  const filtered = useMemo(() => {
    return scopedTasks.filter(t => {
      if (activeStatus !== 'all' && t.status !== activeStatus) return false
      if (!query) return true
      const q = query.toLowerCase()
      return t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q)
    })
  }, [scopedTasks, activeStatus, query])

  const canDelete = (task: Task) =>
    task.created_by === currentUserId || ['president', 'secretary'].includes(callerRole)

  async function handleStatusChange(task: Task, status: TaskStatus) {
    if (task.status === status) return
    setLoadingId(task.id)
    const result = await updateTaskStatus(task.id, status)
    if (result.error) toast.error(result.error)
    else onRefresh()
    setLoadingId(null)
  }

  async function handleDelete(task: Task) {
    setLoadingId(task.id)
    const result = await deleteTask(task.id, associationId)
    if (result.error) toast.error(result.error)
    else { toast.success('Tâche supprimée'); onRefresh() }
    setLoadingId(null)
  }

  const statusTabs = [
    { value: 'all' as const, label: 'Toutes', count: counts.all },
    ...STATUSES.map(s => ({ value: s.value, label: s.label, count: counts[s.value] })),
  ]

  const progressPct = counts.all > 0 ? Math.round((counts.done / counts.all) * 100) : 0

  return (
    <div className="h-full flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/6 shrink-0">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">
            Opérations
          </p>
          <h1 className="text-[28px] font-semibold mt-1 leading-tight tracking-tight">
            <span className="font-heading italic font-normal text-[32px]">Tâches</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Scope toggle */}
          <div className="flex items-center gap-0.5 rounded-xl border border-white/7 bg-white/[0.035] backdrop-blur-md p-1">
            <button
              onClick={() => { setScope('personal'); setActiveStatus('all') }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                scope === 'personal' ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <User className="h-3.5 w-3.5" />
              Personnelles
              <span className={cn('text-[10px] tabular-nums rounded-md px-1 py-0.5', scope === 'personal' ? 'bg-white/10' : 'bg-white/5')}>
                {personalTasks.length}
              </span>
            </button>
            <button
              onClick={() => { setScope('team'); setActiveStatus('all') }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                scope === 'team' ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Users className="h-3.5 w-3.5" />
              Équipe
              <span className={cn('text-[10px] tabular-nums rounded-md px-1 py-0.5', scope === 'team' ? 'bg-white/10' : 'bg-white/5')}>
                {teamTasks.length}
              </span>
            </button>
          </div>
          <CreateTaskDialog
            associationId={associationId}
            members={members}
            currentUserId={currentUserId}
            defaultPersonal={scope === 'personal'}
            onCreated={onRefresh}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-5">

        {/* Progress hero */}
        {counts.all > 0 && (
          <div className="rounded-2xl border border-white/7 bg-white/[0.035] backdrop-blur-md overflow-hidden">
            <div className="flex h-1 w-full">
              {counts.todo > 0 && (
                <div className="bg-white/15 transition-all" style={{ width: `${(counts.todo / counts.all) * 100}%` }} />
              )}
              {counts.in_progress > 0 && (
                <div className="bg-blue-400/70 transition-all" style={{ width: `${(counts.in_progress / counts.all) * 100}%` }} />
              )}
              {counts.done > 0 && (
                <div className="bg-emerald-400/80 transition-all" style={{ width: `${(counts.done / counts.all) * 100}%` }} />
              )}
            </div>

            <div className="flex items-stretch divide-x divide-white/5">
              <div className="flex flex-col justify-center px-6 py-4 shrink-0 min-w-[110px]">
                <span className={cn(
                  'text-4xl font-bold tabular-nums tracking-tight leading-none',
                  progressPct === 100 ? 'text-emerald-300' : 'text-foreground'
                )}>
                  {progressPct}%
                </span>
                <span className="text-[11px] text-muted-foreground mt-1.5 font-heading italic">
                  {progressPct === 100 ? 'tout terminé ✓' : scope === 'personal' ? 'mes tâches' : 'complété'}
                </span>
              </div>

              {[
                { label: 'À faire', count: counts.todo, color: 'bg-white/20', text: 'text-muted-foreground' },
                { label: 'En cours', count: counts.in_progress, color: 'bg-blue-400/70', text: 'text-blue-300' },
                { label: 'Terminées', count: counts.done, color: 'bg-emerald-400/80', text: 'text-emerald-300' },
              ].map(stat => (
                <div key={stat.label} className="flex-1 flex items-center gap-3 px-5 py-4">
                  <span className={cn('h-2 w-2 rounded-full shrink-0', stat.color)} />
                  <div>
                    <p className={cn('text-xl font-bold tabular-nums leading-none', stat.count > 0 ? stat.text : 'text-muted-foreground/40')}>
                      {stat.count}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={`Rechercher${scope === 'personal' ? ' mes tâches' : ' une tâche'}...`}
              className="w-full rounded-xl border border-white/7 bg-white/[0.035] backdrop-blur-md pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/15 transition-all"
            />
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-white/7 bg-white/[0.035] backdrop-blur-md p-1">
            {statusTabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveStatus(tab.value)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5',
                  activeStatus === tab.value ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
                <span className={cn('text-[10px] tabular-nums rounded-md px-1 py-0.5', activeStatus === tab.value ? 'bg-white/10' : 'bg-white/5')}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Task list */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/7 bg-white/[0.035] backdrop-blur-md flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <CheckSquare className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              {query
                ? 'Aucune tâche ne correspond'
                : activeStatus === 'done'
                  ? 'Aucune tâche terminée'
                  : scope === 'personal'
                    ? 'Aucune tâche personnelle'
                    : 'Tout est à jour'}
            </p>
            {!query && scope === 'personal' && activeStatus === 'all' && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                Créez une tâche personnelle pour vous organiser.
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/7 bg-white/[0.035] backdrop-blur-md overflow-hidden divide-y divide-white/5">
            {filtered.map(task => {
              const isLoading = loadingId === task.id
              const nextStatus: Record<TaskStatus, TaskStatus> = {
                todo: 'in_progress',
                in_progress: 'done',
                done: 'todo',
              }
              const StatusIcon = STATUSES.find(s => s.value === task.status)?.icon ?? Circle
              const due = task.due_date ? daysUntil(task.due_date) : null
              const overdue = due !== null && due < 0 && task.status !== 'done'
              const soon = due !== null && due >= 0 && due <= 3 && task.status !== 'done'
              const assignee = task.assigned_to ? getMemberName(task.assigned_to, members) : null

              return (
                <div
                  key={task.id}
                  className={cn(
                    'group flex items-start gap-4 px-5 py-4 hover:bg-white/4 transition-colors',
                    isLoading && 'opacity-50'
                  )}
                >
                  <button
                    onClick={() => handleStatusChange(task, nextStatus[task.status])}
                    disabled={isLoading}
                    className={cn(
                      'mt-0.5 shrink-0 transition-colors',
                      task.status === 'done'
                        ? 'text-emerald-400'
                        : task.status === 'in_progress'
                          ? 'text-blue-400'
                          : 'text-muted-foreground hover:text-foreground'
                    )}
                    title="Changer le statut"
                  >
                    <StatusIcon className="h-5 w-5" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium',
                      task.status === 'done' && 'line-through text-muted-foreground'
                    )}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className={cn(
                        'text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md ring-1',
                        PRIORITY_COLORS[task.priority]
                      )}>
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                      {assignee && scope === 'team' && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="h-5 w-5 flex items-center justify-center rounded-full bg-white/8 text-[9px] font-semibold ring-1 ring-white/10">
                            {getInitials(assignee)}
                          </span>
                          {assignee}
                        </span>
                      )}
                      {task.due_date && (
                        <span className={cn(
                          'flex items-center gap-1 text-xs',
                          overdue ? 'text-red-400 font-semibold' : soon ? 'text-amber-400 font-semibold' : 'text-muted-foreground'
                        )}>
                          <CalendarDays className="h-3 w-3" />
                          {overdue
                            ? `En retard de ${-due!}j`
                            : due === 0
                              ? "Aujourd'hui"
                              : due === 1
                                ? 'Demain'
                                : formatDate(task.due_date)}
                        </span>
                      )}
                    </div>
                  </div>

                  {canDelete(task) && (
                    <button
                      onClick={() => handleDelete(task)}
                      disabled={isLoading}
                      className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
