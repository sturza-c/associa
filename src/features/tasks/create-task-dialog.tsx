'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createTask } from '@/lib/actions/tasks'
import type { MembershipWithProfile } from '@/types/database'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, User, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  associationId: string
  members: MembershipWithProfile[]
  currentUserId: string
  defaultPersonal?: boolean
  onCreated?: () => void
}

export function CreateTaskDialog({ associationId, members, currentUserId, defaultPersonal = false, onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isPersonal, setIsPersonal] = useState(defaultPersonal)

  // Sync with parent scope when dialog opens
  useEffect(() => {
    if (open) setIsPersonal(defaultPersonal)
  }, [open, defaultPersonal])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('is_personal', String(isPersonal))
    // For personal tasks, assign to self
    if (isPersonal) formData.set('assigned_to', currentUserId)
    const result = await createTask(formData, associationId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Tâche créée')
      setOpen(false)
      onCreated?.()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
        <Plus className="h-4 w-4" />
        Nouvelle tâche
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading italic font-normal text-xl">Créer une tâche</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Scope toggle */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-background/50 p-1 w-fit">
            <button
              type="button"
              onClick={() => setIsPersonal(false)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                !isPersonal ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Users className="h-3.5 w-3.5" />
              Équipe
            </button>
            <button
              type="button"
              onClick={() => setIsPersonal(true)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                isPersonal ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <User className="h-3.5 w-3.5" />
              Personnelle
            </button>
          </div>
          {isPersonal && (
            <p className="text-xs text-muted-foreground -mt-2">
              Visible uniquement par vous. Idéal pour vos notes et rappels personnels.
            </p>
          )}

          <div className="space-y-1.5">
            <label htmlFor="title" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Titre</label>
            <input
              id="title" name="title"
              placeholder="Ex: Préparer l'assemblée générale"
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Description <span className="font-normal normal-case tracking-normal text-muted-foreground/60">(optionnel)</span>
            </label>
            <textarea
              id="description" name="description"
              placeholder="Détails, contexte, liens utiles..."
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="priority" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Priorité</label>
              <select
                id="priority" name="priority" defaultValue="medium"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="due_date" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Échéance <span className="font-normal normal-case tracking-normal text-muted-foreground/60">(optionnel)</span>
              </label>
              <input
                id="due_date" name="due_date" type="date"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>

          {!isPersonal && (
            <div className="space-y-1.5">
              <label htmlFor="assigned_to" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Assigner à <span className="font-normal normal-case tracking-normal text-muted-foreground/60">(optionnel)</span>
              </label>
              <select
                id="assigned_to" name="assigned_to"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="">— Personne —</option>
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.user_profiles.full_name || m.user_profiles.email}
                    {m.user_id === currentUserId ? ' (moi)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <DialogFooter>
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-foreground/5 transition-colors">
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
