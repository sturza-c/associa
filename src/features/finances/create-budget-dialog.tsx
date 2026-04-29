'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createEventBudget } from '@/lib/actions/budgets'
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
import { Plus } from 'lucide-react'

export function CreateBudgetDialog({ associationId }: { associationId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await createEventBudget(formData, associationId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Budget créé')
      setOpen(false)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
        title="Nouveau budget"
      >
        <Plus className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <span className="font-heading italic font-normal">Nouveau</span> budget d&apos;événement
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de l&apos;événement</Label>
            <Input id="name" name="name" placeholder="Ex: Tournoi annuel 2026" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_date">
              Date <span className="text-muted-foreground">(optionnel)</span>
            </Label>
            <Input id="event_date" name="event_date" type="date" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-muted-foreground">(optionnel)</span>
            </Label>
            <Input id="description" name="description" placeholder="Détails, lieu..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer le budget'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
