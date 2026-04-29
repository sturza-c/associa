'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createConversation } from '@/lib/actions/messages'
import type { MembershipWithProfile } from '@/types/database'
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
import { SquarePen, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  associationId: string
  members: MembershipWithProfile[]
  currentUserId: string
  onCreated: (conv: unknown) => void
}

export function NewConversationDialog({ associationId, members, currentUserId, onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  const otherMembers = members.filter(m => m.user_id !== currentUserId)

  function toggleMember(userId: string) {
    setSelected(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selected.length === 0) return toast.error('Sélectionnez au moins un participant')

    setLoading(true)
    const result = await createConversation(associationId, title, selected)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Conversation créée')
      setTitle('')
      setSelected([])
      setOpen(false)
      window.location.reload()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
        <SquarePen className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvelle conversation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre <span className="text-muted-foreground">(optionnel)</span></Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Préparation AG"
            />
          </div>

          <div className="space-y-2">
            <Label>Participants</Label>
            {otherMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun autre membre dans l&apos;association.</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {otherMembers.map(m => {
                  const isSelected = selected.includes(m.user_id)
                  return (
                    <button
                      key={m.user_id}
                      type="button"
                      onClick={() => toggleMember(m.user_id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors border',
                        isSelected
                          ? 'bg-primary/10 border-primary/30 text-foreground'
                          : 'border-border/50 hover:bg-muted/50 text-muted-foreground'
                      )}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {(m.user_profiles.full_name || m.user_profiles.email)[0].toUpperCase()}
                      </div>
                      <span className="flex-1 text-left">
                        {m.user_profiles.full_name || m.user_profiles.email}
                      </span>
                      {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={loading || selected.length === 0}>
              {loading ? 'Création...' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
