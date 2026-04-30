'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createFinanceEntry } from '@/lib/actions/finances'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { FinanceCategory } from '@/types/database'
import { Plus } from 'lucide-react'

interface Props {
  associationId: string
  categories?: FinanceCategory[]
  defaultCategoryId?: string | null
  /** Controlled mode — when provided, no trigger button is rendered */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Called after a successful save (use to invalidate SWR cache) */
  onSuccess?: () => void
}

export function AddFinanceDialog({
  associationId,
  categories = [],
  defaultCategoryId,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<'income' | 'expense'>('income')

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled
    ? (v: boolean) => onOpenChange?.(v)
    : setInternalOpen

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('type', type)
    const result = await createFinanceEntry(formData, associationId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Entrée ajoutée')
      setOpen(false)
      onSuccess?.()
    }
    setLoading(false)
  }

  const dialogContent = (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Ajouter une entrée</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType('income')}
            className={`rounded-lg py-2 text-sm font-medium transition-colors border ${
              type === 'income'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'border-border text-muted-foreground hover:bg-muted/50'
            }`}
          >
            Recette
          </button>
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`rounded-lg py-2 text-sm font-medium transition-colors border ${
              type === 'expense'
                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                : 'border-border text-muted-foreground hover:bg-muted/50'
            }`}
          >
            Dépense
          </button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="label">Libellé</Label>
          <Input id="label" name="label" placeholder="Ex: Cotisations membres" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Montant (CHF)</Label>
            <Input id="amount" name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
        </div>

        {categories.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="category_id">
              Dossier <span className="text-muted-foreground">(optionnel)</span>
            </Label>
            <select
              id="category_id"
              name="category_id"
              defaultValue={defaultCategoryId ?? ''}
              className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/15"
            >
              <option value="">— Sans dossier —</option>
              {categories.map(c => (
                <option key={c.id} value={c.id} className="bg-background">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="description">
            Description <span className="text-muted-foreground">(optionnel)</span>
          </Label>
          <Input id="description" name="description" placeholder="Détails..." />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Ajout...' : 'Ajouter'}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )

  if (isControlled) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {dialogContent}
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
        <Plus className="h-4 w-4" />
        Nouvelle entrée
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  )
}
