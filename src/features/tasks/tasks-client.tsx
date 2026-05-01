'use client'

import { useState, useMemo, useTransition, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { updateTaskStatus, deleteTask } from '@/lib/actions/tasks'
import { createTaskGroup, updateTaskGroup, deleteTaskGroup } from '@/lib/actions/task-groups'
import { CreateTaskDialog } from './create-task-dialog'
import { CollapsibleRail } from '@/components/collapsible-rail'
import type { Task, TaskStatus, Role, MembershipWithProfile, TaskGroupWithMembers } from '@/types/database'
import {
  Trash2, CircleDot, CircleCheck, Circle, CalendarDays, CheckSquare,
  Search, Users, User, Plus, Pencil, X, FolderOpen,
} from 'lucide-react'
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

const COLOR_PRESETS = ['#60a5fa', '#34d399', '#a78bfa', '#f472b6', '#fbbf24', '#f87171', '#94a3b8', '#22d3ee']

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

type Scope = 'personal' | 'team' | 'groups'

interface Props {
  tasks: Task[]
  members: MembershipWithProfile[]
  groups: TaskGroupWithMembers[]
  associationId: string
  callerRole: Role
  currentUserId: string
  onRefresh: () => void
}

// ── CreateGroupDialog ─────────────────────────────────────────────────────────

function CreateGroupDialog({
  associationId,
  members,
  existingCount,
  onSuccess,
}: {
  associationId: string
  members: MembershipWithProfile[]
  existingCount: number
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLOR_PRESETS[existingCount % COLOR_PRESETS.length])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [, start] = useTransition()

  function toggle(mid: string) {
    setSelectedIds(prev => prev.includes(mid) ? prev.filter(id => id !== mid) : [...prev, mid])
  }

  function submit() {
    if (!name.trim()) { toast.error('Le nom est requis'); return }
    start(async () => {
      const r = await createTaskGroup(associationId, name, color, selectedIds)
      if ('error' in r && r.error) { toast.error(r.error); return }
      toast.success('Groupe créé')
      setOpen(false)
      setName('')
      setSelectedIds([])
      onSuccess()
    })
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors mt-1"
    >
      <Plus className="h-3.5 w-3.5" />
      Créer un groupe
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-heading italic font-normal text-xl">Créer un groupe</h3>
          <button onClick={() => setOpen(false)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-foreground/8 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nom</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Bureau, Pôle comm..."
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Couleur</label>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_PRESETS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn('h-6 w-6 rounded-full transition-transform hover:scale-110 ring-2', c === color ? 'ring-white scale-110' : 'ring-transparent')}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Membres</label>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {members.map(m => {
              const n = m.user_profiles.full_name || m.user_profiles.email
              const checked = selectedIds.includes(m.id)
              return (
                <label key={m.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5 cursor-pointer">
                  <span className="h-7 w-7 flex items-center justify-center rounded-full bg-white/8 text-[10px] font-semibold ring-1 ring-white/10 shrink-0">
                    {getInitials(n)}
                  </span>
                  <span className="flex-1 text-sm">{n}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{m.role}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(m.id)}
                    className="h-4 w-4 rounded accent-indigo-400"
                  />
                </label>
              )
            })}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-border px-4 py-2 text-sm hover:bg-foreground/5 transition-colors">
            Annuler
          </button>
          <button onClick={submit} className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Créer
          </button>
        </div>
      </div>
    </div>
  )
}

// ── EditGroupDialog ───────────────────────────────────────────────────────────

function EditGroupDialog({
  group,
  members,
  associationId,
  onSuccess,
  onClose,
}: {
  group: TaskGroupWithMembers
  members: MembershipWithProfile[]
  associationId: string
  onSuccess: () => void
  onClose: () => void
}) {
  const [name, setName] = useState(group.name)
  const [color, setColor] = useState(group.color)
  const [selectedIds, setSelectedIds] = useState<string[]>(group.membership_ids)
  const [, start] = useTransition()

  function toggle(mid: string) {
    setSelectedIds(prev => prev.includes(mid) ? prev.filter(id => id !== mid) : [...prev, mid])
  }

  function submit() {
    if (!name.trim()) { toast.error('Le nom est requis'); return }
    start(async () => {
      const r = await updateTaskGroup(group.id, associationId, { name, color, membershipIds: selectedIds })
      if ('error' in r && r.error) { toast.error(r.error); return }
      toast.success('Groupe mis à jour')
      onClose()
      onSuccess()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-heading italic font-normal text-xl">Modifier le groupe</h3>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-foreground/8 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Nom</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Couleur</label>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_PRESETS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn('h-6 w-6 rounded-full transition-transform hover:scale-110 ring-2', c === color ? 'ring-white scale-110' : 'ring-transparent')}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Membres</label>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {members.map(m => {
              const n = m.user_profiles.full_name || m.user_profiles.email
              const checked = selectedIds.includes(m.id)
              return (
                <label key={m.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5 cursor-pointer">
                  <span className="h-7 w-7 flex items-center justify-center rounded-full bg-white/8 text-[10px] font-semibold ring-1 ring-white/10 shrink-0">
                    {getInitials(n)}
                  </span>
                  <span className="flex-1 text-sm">{n}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{m.role}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(m.id)}
                    className="h-4 w-4 rounded accent-indigo-400"
                  />
                </label>
              )
            })}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border px-4 py-2 text-sm hover:bg-foreground/5 transition-colors">
            Annuler
          </button>
          <button onClick={submit} className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

// ── GroupRow (in rail) ────────────────────────────────────────────────────────

function GroupRow({
  group,
  active,
  members,
  associationId,
  onSelect,
  onRefresh,
}: {
  group: TaskGroupWithMembers
  active: boolean
  members: MembershipWithProfile[]
  associationId: string
  onSelect: () => void
  onRefresh: () => void
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [, start] = useTransition()

  function handleDelete() {
    start(async () => {
      const r = await deleteTaskGroup(group.id, associationId)
      if ('error' in r && r.error) toast.error(r.error)
      else { toast.success('Groupe supprimé'); onRefresh() }
    })
  }

  return (
    <>
      {editOpen && (
        <EditGroupDialog
          group={group}
          members={members}
          associationId={associationId}
          onSuccess={onRefresh}
          onClose={() => setEditOpen(false)}
        />
      )}
      <div
        className={cn(
          'group relative flex items-center gap-2.5 rounded-lg pl-3 pr-1 py-2 text-sm transition-colors cursor-pointer',
          active ? 'bg-white/8 text-foreground' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
        )}
        onClick={onSelect}
      >
        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
        <span className="flex-1 truncate text-xs font-medium">{group.name}</span>
        <span className="text-[10px] text-muted-foreground/60 tabular-nums shrink-0">
          {group.membership_ids.length}
        </span>
        {/* hover actions */}
        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); setEditOpen(true) }}
            className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
            title="Modifier"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); handleDelete() }}
            className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
            title="Supprimer"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </>
  )
}

// ── GroupCard (grid) ──────────────────────────────────────────────────────────

function GroupCard({
  group,
  tasks,
  members,
  onClick,
}: {
  group: TaskGroupWithMembers
  tasks: Task[]
  members: MembershipWithProfile[]
  onClick: () => void
}) {
  const groupTasks = tasks.filter(t => t.group_id === group.id)
  const done = groupTasks.filter(t => t.status === 'done').length
  const total = groupTasks.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  // members in this group
  const groupMembers = members.filter(m => group.membership_ids.includes(m.id)).slice(0, 4)

  return (
    <button
      onClick={onClick}
      className="group relative rounded-2xl border border-white/7 bg-white/[0.035] backdrop-blur-md overflow-hidden text-left hover:border-white/15 hover:bg-white/[0.06] transition-all"
    >
      {/* color bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: group.color }} />
      <div className="p-5 space-y-3">
        <div>
          <p className="font-heading italic text-lg leading-tight">{group.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{group.membership_ids.length} membre{group.membership_ids.length !== 1 ? 's' : ''}</p>
        </div>
        {/* avatar stack */}
        <div className="flex items-center gap-1">
          {groupMembers.map(m => {
            const n = m.user_profiles.full_name || m.user_profiles.email
            return (
              <span
                key={m.id}
                title={n}
                className="h-6 w-6 flex items-center justify-center rounded-full bg-white/8 text-[9px] font-semibold ring-1 ring-white/10 -ml-1 first:ml-0"
              >
                {getInitials(n)}
              </span>
            )
          })}
          {group.membership_ids.length > 4 && (
            <span className="h-6 w-6 flex items-center justify-center rounded-full bg-white/5 text-[9px] text-muted-foreground ring-1 ring-white/10 -ml-1">
              +{group.membership_ids.length - 4}
            </span>
          )}
        </div>
        {/* progress */}
        {total > 0 ? (
          <div className="space-y-1">
            <div className="h-1 w-full rounded-full bg-white/8 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-400/70 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground">{done}/{total} tâches</p>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground">Aucune tâche</p>
        )}
      </div>
    </button>
  )
}

// ── TaskRow ───────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  members,
  groups,
  scope,
  currentUserId,
  callerRole,
  loadingId,
  onStatusChange,
  onDelete,
}: {
  task: Task
  members: MembershipWithProfile[]
  groups: TaskGroupWithMembers[]
  scope: Scope
  currentUserId: string
  callerRole: Role
  loadingId: string | null
  onStatusChange: (task: Task, status: TaskStatus) => void
  onDelete: (task: Task) => void
}) {
  const isLoading = loadingId === task.id
  const nextStatus: Record<TaskStatus, TaskStatus> = { todo: 'in_progress', in_progress: 'done', done: 'todo' }
  const StatusIcon = STATUSES.find(s => s.value === task.status)?.icon ?? Circle
  const due = task.due_date ? daysUntil(task.due_date) : null
  const overdue = due !== null && due < 0 && task.status !== 'done'
  const soon = due !== null && due >= 0 && due <= 3 && task.status !== 'done'
  const assignee = task.assigned_to ? getMemberName(task.assigned_to, members) : null
  const canDel = task.created_by === currentUserId || ['president', 'secretary'].includes(callerRole)
  const taskGroup = task.group_id ? groups.find(g => g.id === task.group_id) : null

  return (
    <div
      className={cn(
        'group flex items-start gap-4 px-5 py-4 hover:bg-white/4 transition-colors',
        isLoading && 'opacity-50'
      )}
    >
      <button
        onClick={() => onStatusChange(task, nextStatus[task.status])}
        disabled={isLoading}
        className={cn(
          'mt-0.5 shrink-0 transition-colors',
          task.status === 'done' ? 'text-emerald-400' : task.status === 'in_progress' ? 'text-blue-400' : 'text-muted-foreground hover:text-foreground'
        )}
        title="Changer le statut"
      >
        <StatusIcon className="h-5 w-5" />
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', task.status === 'done' && 'line-through text-muted-foreground')}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className={cn('text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md ring-1', PRIORITY_COLORS[task.priority])}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          {/* group badge — shown in team scope */}
          {taskGroup && scope === 'team' && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md ring-1 ring-white/10" style={{ color: taskGroup.color }}>
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: taskGroup.color }} />
              {taskGroup.name}
            </span>
          )}
          {assignee && scope !== 'personal' && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-5 w-5 flex items-center justify-center rounded-full bg-white/8 text-[9px] font-semibold ring-1 ring-white/10">
                {getInitials(assignee)}
              </span>
              {assignee}
            </span>
          )}
          {task.due_date && (
            <span className={cn('flex items-center gap-1 text-xs', overdue ? 'text-red-400 font-semibold' : soon ? 'text-amber-400 font-semibold' : 'text-muted-foreground')}>
              <CalendarDays className="h-3 w-3" />
              {overdue ? `En retard de ${-due!}j` : due === 0 ? "Aujourd'hui" : due === 1 ? 'Demain' : formatDate(task.due_date)}
            </span>
          )}
        </div>
      </div>

      {canDel && (
        <button
          onClick={() => onDelete(task)}
          disabled={isLoading}
          className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          title="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

// ── ProgressHero ──────────────────────────────────────────────────────────────

function ProgressHero({ tasks, label }: { tasks: Task[]; label: string }) {
  const counts = useMemo(() => ({
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  }), [tasks])
  const pct = counts.all > 0 ? Math.round((counts.done / counts.all) * 100) : 0
  if (counts.all === 0) return null

  return (
    <div className="rounded-2xl border border-white/7 bg-white/[0.035] backdrop-blur-md overflow-hidden">
      <div className="flex h-1 w-full">
        {counts.todo > 0 && <div className="bg-white/15 transition-all" style={{ width: `${(counts.todo / counts.all) * 100}%` }} />}
        {counts.in_progress > 0 && <div className="bg-blue-400/70 transition-all" style={{ width: `${(counts.in_progress / counts.all) * 100}%` }} />}
        {counts.done > 0 && <div className="bg-emerald-400/80 transition-all" style={{ width: `${(counts.done / counts.all) * 100}%` }} />}
      </div>
      <div className="flex items-stretch divide-x divide-white/5">
        <div className="flex flex-col justify-center px-6 py-4 shrink-0 min-w-[110px]">
          <span className={cn('text-4xl font-bold tabular-nums tracking-tight leading-none', pct === 100 ? 'text-emerald-300' : 'text-foreground')}>{pct}%</span>
          <span className="text-[11px] text-muted-foreground mt-1.5 font-heading italic">{pct === 100 ? 'tout terminé ✓' : label}</span>
        </div>
        {[
          { label: 'À faire', count: counts.todo, color: 'bg-white/20', text: 'text-muted-foreground' },
          { label: 'En cours', count: counts.in_progress, color: 'bg-blue-400/70', text: 'text-blue-300' },
          { label: 'Terminées', count: counts.done, color: 'bg-emerald-400/80', text: 'text-emerald-300' },
        ].map(stat => (
          <div key={stat.label} className="flex-1 flex items-center gap-3 px-5 py-4">
            <span className={cn('h-2 w-2 rounded-full shrink-0', stat.color)} />
            <div>
              <p className={cn('text-xl font-bold tabular-nums leading-none', stat.count > 0 ? stat.text : 'text-muted-foreground/40')}>{stat.count}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function TasksClient({ tasks, members, groups, associationId, callerRole, currentUserId, onRefresh }: Props) {
  const [scope, setScope] = useState<Scope>('team')
  const [activeStatus, setActiveStatus] = useState<TaskStatus | 'all'>('todo')
  const [query, setQuery] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)

  // Split by scope
  const personalTasks = useMemo(() =>
    tasks.filter(t => t.is_personal && (t.created_by === currentUserId || t.assigned_to === currentUserId)),
    [tasks, currentUserId]
  )
  const teamTasks = useMemo(() =>
    tasks.filter(t => !t.is_personal),
    [tasks]
  )
  const groupTasks = useMemo(() =>
    tasks.filter(t => t.group_id !== null),
    [tasks]
  )
  const activeGroupTasks = useMemo(() =>
    activeGroupId ? tasks.filter(t => t.group_id === activeGroupId) : groupTasks,
    [tasks, activeGroupId, groupTasks]
  )

  const scopedTasks = scope === 'personal' ? personalTasks : scope === 'team' ? teamTasks : activeGroupTasks

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

  const activeGroup = activeGroupId ? groups.find(g => g.id === activeGroupId) : null

  // ── Groups scope content ──────────────────────────────────────────────────

  function renderGroupsContent() {
    if (!activeGroupId) {
      // Grid of group cards + create card
      return (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map(g => (
              <GroupCard
                key={g.id}
                group={g}
                tasks={tasks}
                members={members}
                onClick={() => setActiveGroupId(g.id)}
              />
            ))}
            {/* Create group card */}
            <CreateGroupDialog
              associationId={associationId}
              members={members}
              existingCount={groups.length}
              onSuccess={onRefresh}
            />
          </div>
          {groups.length === 0 && (
            <div className="mt-12 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <FolderOpen className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">Aucun groupe</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Créez un groupe pour organiser les tâches par équipe ou rôle.</p>
            </div>
          )}
        </div>
      )
    }

    // Selected group view
    const groupMembers = members.filter(m => activeGroup?.membership_ids.includes(m.id))
    const groupCountsAll = activeGroupTasks.length
    const groupProgressPct = groupCountsAll > 0 ? Math.round((activeGroupTasks.filter(t => t.status === 'done').length / groupCountsAll) * 100) : 0

    return (
      <div className="flex-1 overflow-y-auto p-8 space-y-5">
        {/* Group header */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: activeGroup?.color }} />
          <h2 className="font-heading italic text-2xl">{activeGroup?.name}</h2>
          <div className="flex items-center gap-1.5 flex-wrap">
            {groupMembers.slice(0, 6).map(m => {
              const n = m.user_profiles.full_name || m.user_profiles.email
              return (
                <span key={m.id} title={n} className="h-6 px-2 flex items-center gap-1 rounded-full bg-white/8 text-[10px] ring-1 ring-white/10">
                  <span className="h-4 w-4 flex items-center justify-center rounded-full bg-white/10 text-[8px] font-semibold">
                    {getInitials(n)}
                  </span>
                  {n.split(' ')[0]}
                </span>
              )
            })}
            {groupMembers.length > 6 && (
              <span className="text-xs text-muted-foreground">+{groupMembers.length - 6}</span>
            )}
          </div>
        </div>

        {/* Create task card */}
        <CreateTaskDialog
          associationId={associationId}
          members={members}
          currentUserId={currentUserId}
          defaultPersonal={false}
          defaultGroupId={activeGroupId}
          groupName={activeGroup?.name}
          asCard
          onCreated={onRefresh}
        />

        {/* Progress */}
        <ProgressHero tasks={activeGroupTasks} label={`${activeGroup?.name ?? 'groupe'}`} />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher une tâche..."
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
              {query ? 'Aucune tâche ne correspond' : activeStatus === 'done' ? 'Aucune tâche terminée' : 'Aucune tâche dans ce groupe'}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/7 bg-white/[0.035] backdrop-blur-md overflow-hidden divide-y divide-white/5">
            {filtered.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                members={members}
                groups={groups}
                scope={scope}
                currentUserId={currentUserId}
                callerRole={callerRole}
                loadingId={loadingId}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/6 shrink-0">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Opérations</p>
          <h1 className="text-[28px] font-semibold mt-1 leading-tight tracking-tight">
            <span className="font-heading italic font-normal text-[32px]">Tâches</span>
          </h1>
        </div>
        {/* Scope toggle */}
        <div className="flex items-center gap-0.5 rounded-xl border border-white/7 bg-white/[0.035] backdrop-blur-md p-1">
          <button
            onClick={() => { setScope('personal'); setActiveStatus('todo') }}
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
            onClick={() => { setScope('team'); setActiveStatus('todo') }}
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
          <button
            onClick={() => { setScope('groups'); setActiveStatus('todo'); setActiveGroupId(null) }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
              scope === 'groups' ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            Groupes
            <span className={cn('text-[10px] tabular-nums rounded-md px-1 py-0.5', scope === 'groups' ? 'bg-white/10' : 'bg-white/5')}>
              {groups.length}
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      {scope !== 'groups' ? (
        <div className="flex-1 overflow-y-auto p-8 space-y-5">

          {/* Create card */}
          <CreateTaskDialog
            associationId={associationId}
            members={members}
            currentUserId={currentUserId}
            defaultPersonal={scope === 'personal'}
            asCard
            onCreated={onRefresh}
          />

          {/* Progress hero */}
          <ProgressHero
            tasks={scopedTasks}
            label={scope === 'personal' ? 'mes tâches' : 'complété'}
          />

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
              {filtered.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  members={members}
                  groups={groups}
                  scope={scope}
                  currentUserId={currentUserId}
                  callerRole={callerRole}
                  loadingId={loadingId}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Groups scope — two-panel layout */
        <div className="flex-1 flex overflow-hidden">
          <CollapsibleRail width="w-56">
            <div className="pt-10 pb-4 px-2 flex flex-col h-full">
              {/* "Tous" option */}
              <button
                onClick={() => setActiveGroupId(null)}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors w-full text-left mb-1',
                  activeGroupId === null ? 'bg-white/8 text-foreground' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                )}
              >
                <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1">Tous les groupes</span>
                <span className="text-[10px] tabular-nums text-muted-foreground/60">{groups.length}</span>
              </button>

              {/* Group list */}
              <div className="flex-1 overflow-y-auto space-y-0.5">
                {groups.map(g => (
                  <GroupRow
                    key={g.id}
                    group={g}
                    active={activeGroupId === g.id}
                    members={members}
                    associationId={associationId}
                    onSelect={() => setActiveGroupId(g.id)}
                    onRefresh={onRefresh}
                  />
                ))}
              </div>

              {/* Create group */}
              <CreateGroupDialog
                associationId={associationId}
                members={members}
                existingCount={groups.length}
                onSuccess={onRefresh}
              />
            </div>
          </CollapsibleRail>

          {/* Right panel */}
          {renderGroupsContent()}
        </div>
      )}
    </div>
  )
}
