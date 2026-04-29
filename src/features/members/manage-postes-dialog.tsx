'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  createTitle,
  updateTitle,
  deleteTitle,
  assignTitle,
  unassignTitle,
} from '@/lib/actions/association-settings'
import type { AssociationTitle, MembershipWithProfile } from '@/types/database'
import { Settings2, Plus, Pencil, Trash2, Check, X, ChevronRight, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const COLOR_PRESETS = [
  '#94a3b8', '#a78bfa', '#f472b6', '#fb7185',
  '#fbbf24', '#34d399', '#22d3ee', '#60a5fa',
]

function ColorDots({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      {COLOR_PRESETS.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            'h-4 w-4 rounded-full transition-transform',
            value.toLowerCase() === c ? 'scale-125 ring-2 ring-offset-1 ring-offset-background ring-foreground/30' : 'hover:scale-110'
          )}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  )
}

interface Props {
  associationId: string
  titles: AssociationTitle[]
  members: MembershipWithProfile[]
  memberTitleMap: Record<string, string[]>
}

type View = 'list' | 'assign'

export function ManagePostesDialog({ associationId, titles, members, memberTitleMap }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [view, setView] = useState<View>('list')
  const [activeTitle, setActiveTitle] = useState<AssociationTitle | null>(null)

  // Create state
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLOR_PRESETS[0])

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  function reset() {
    setView('list')
    setActiveTitle(null)
    setCreating(false)
    setNewName('')
    setNewColor(COLOR_PRESETS[0])
    setEditingId(null)
  }

  function handleCreate() {
    if (!newName.trim()) return
    startTransition(async () => {
      const res = await createTitle(associationId, { name: newName.trim(), color: newColor })
      if (res.error) toast.error(res.error)
      else {
        toast.success('Poste créé')
        setCreating(false)
        setNewName('')
        setNewColor(COLOR_PRESETS[0])
        router.refresh()
      }
    })
  }

  function handleEdit() {
    if (!editingId || !editName.trim()) return
    const id = editingId
    startTransition(async () => {
      const res = await updateTitle(id, associationId, { name: editName.trim(), color: editColor })
      if (res.error) toast.error(res.error)
      else {
        toast.success('Poste modifié')
        setEditingId(null)
        // Update activeTitle if we were on assign view
        if (activeTitle?.id === id) {
          setActiveTitle(t => t ? { ...t, name: editName.trim(), color: editColor } : t)
        }
        router.refresh()
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteTitle(id, associationId)
      if (res.error) toast.error(res.error)
      else {
        toast.success('Poste supprimé')
        if (activeTitle?.id === id) { setView('list'); setActiveTitle(null) }
        router.refresh()
      }
    })
  }

  function handleToggleAssign(membershipId: string, titleId: string, has: boolean) {
    startTransition(async () => {
      const res = has
        ? await unassignTitle(membershipId, titleId, associationId)
        : await assignTitle(membershipId, titleId, associationId)
      if (res.error) toast.error(res.error)
      else router.refresh()
    })
  }

  function openAssign(title: AssociationTitle) {
    setActiveTitle(title)
    setView('assign')
    setEditingId(null)
  }

  return (
    <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) reset() }}>
      <DialogTrigger className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors">
        <Settings2 className="h-3.5 w-3.5" />
        Gérer les postes
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          {view === 'assign' && activeTitle ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setView('list'); setActiveTitle(null) }}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                ← Postes
              </button>
              <span className="text-muted-foreground">/</span>
              <span
                className="text-sm font-medium"
                style={{ color: activeTitle.color }}
              >
                {activeTitle.name}
              </span>
            </div>
          ) : (
            <DialogTitle className="font-heading italic font-normal text-xl">
              Gérer les postes
            </DialogTitle>
          )}
        </DialogHeader>

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <div className="space-y-1 mt-1">
            {titles.length === 0 && !creating && (
              <p className="text-sm text-muted-foreground/60 italic py-4 text-center">
                Aucun poste pour le moment.
              </p>
            )}

            {titles.map(t => {
              const isEditing = editingId === t.id
              const assignedCount = members.filter(m =>
                (memberTitleMap[m.id] ?? []).includes(t.id)
              ).length

              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-foreground/[0.03] group"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: isEditing ? editColor : t.color }}
                  />

                  {isEditing ? (
                    <>
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleEdit(); if (e.key === 'Escape') setEditingId(null) }}
                        className="flex-1 bg-transparent border-0 border-b border-border py-0.5 text-sm focus:outline-none focus:border-foreground/40 transition-colors"
                        autoFocus
                      />
                      <ColorDots value={editColor} onChange={setEditColor} />
                      <button
                        onClick={handleEdit}
                        disabled={pending || !editName.trim()}
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/8 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium">{t.name}</span>
                      <span className="text-xs text-muted-foreground/50 tabular-nums">
                        {assignedCount > 0 ? `${assignedCount} membre${assignedCount > 1 ? 's' : ''}` : ''}
                      </span>

                      {/* Assign button */}
                      <button
                        onClick={() => openAssign(t)}
                        className="opacity-0 group-hover:opacity-100 h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/8 hover:text-foreground transition-all"
                        title="Attribuer à des membres"
                      >
                        <Users className="h-3.5 w-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => { setEditingId(t.id); setEditName(t.name); setEditColor(t.color) }}
                        className="opacity-0 group-hover:opacity-100 h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/8 hover:text-foreground transition-all"
                        title="Renommer"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={pending}
                        className="opacity-0 group-hover:opacity-100 h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all disabled:opacity-40"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>

                      {/* Chevron to assign */}
                      <button
                        onClick={() => openAssign(t)}
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              )
            })}

            {/* New poste form */}
            {creating ? (
              <div className="flex items-center gap-3 px-2 py-2 rounded-xl border border-border bg-foreground/[0.02]">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: newColor }} />
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreating(false); setNewName('') } }}
                  placeholder="Nom du poste"
                  className="flex-1 bg-transparent border-0 border-b border-border py-0.5 text-sm focus:outline-none focus:border-foreground/40 placeholder:text-muted-foreground/40 transition-colors"
                  autoFocus
                />
                <ColorDots value={newColor} onChange={setNewColor} />
                <button
                  onClick={handleCreate}
                  disabled={pending || !newName.trim()}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => { setCreating(false); setNewName('') }}
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-foreground/8 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-2 w-full px-2 py-2 text-sm text-muted-foreground hover:text-foreground rounded-xl hover:bg-foreground/[0.03] transition-colors mt-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter un poste
              </button>
            )}
          </div>
        )}

        {/* ── ASSIGN VIEW ── */}
        {view === 'assign' && activeTitle && (
          <div className="space-y-1 mt-1">
            <p className="text-xs text-muted-foreground px-2 pb-2">
              Cliquez sur un membre pour lui attribuer ou retirer ce poste.
            </p>
            {members.length === 0 && (
              <p className="text-sm text-muted-foreground/60 italic text-center py-4">
                Aucun membre.
              </p>
            )}
            {members.map(m => {
              const prof = m.user_profiles
              const has = (memberTitleMap[m.id] ?? []).includes(activeTitle.id)
              const initials = prof.full_name
                ? prof.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                : prof.email[0].toUpperCase()

              return (
                <button
                  key={m.id}
                  onClick={() => handleToggleAssign(m.id, activeTitle.id, has)}
                  disabled={pending}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left',
                    has
                      ? 'bg-foreground/[0.04]'
                      : 'hover:bg-foreground/[0.03]'
                  )}
                >
                  <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-foreground/15 to-foreground/5 flex items-center justify-center text-xs font-semibold ring-1 ring-border">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{prof.full_name || prof.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{prof.email}</p>
                  </div>
                  <div
                    className={cn(
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                      has
                        ? 'border-transparent'
                        : 'border-border'
                    )}
                    style={has ? { backgroundColor: activeTitle.color } : undefined}
                  >
                    {has && <Check className="h-3 w-3 text-white" />}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
