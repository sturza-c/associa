'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { inviteByEmail } from '@/lib/actions/invitations'
import type { Role } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { UserPlus, Copy, Check } from 'lucide-react'

const ROLES: { value: Role; label: string }[] = [
  { value: 'member', label: 'Membre' },
  { value: 'secretary', label: 'Secrétaire' },
  { value: 'treasurer', label: 'Trésorier·ère' },
  { value: 'president', label: 'Président·e' },
]

export function InviteMemberDialog({ associationId }: { associationId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('member')
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function reset() {
    setEmail('')
    setRole('member')
    setShareUrl(null)
    setCopied(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    const result = await inviteByEmail(associationId, email.trim(), role)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Invitation envoyée')
    setShareUrl(result.share_url ?? null)
  }

  function copy() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
      <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
        <UserPlus className="h-4 w-4" />
        Inviter
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inviter un membre</DialogTitle>
          <DialogDescription>
            Un e-mail avec un lien d&apos;invitation est envoyé. Le lien reste valide 14 jours.
          </DialogDescription>
        </DialogHeader>

        {!shareUrl ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Adresse e-mail</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="membre@exemple.ch"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Rôle</Label>
              <select
                id="invite-role"
                value={role}
                onChange={e => setRole(e.target.value as Role)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Envoi...' : 'Envoyer l\'invitation'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
              Invitation créée. Si l&apos;e-mail n&apos;arrive pas, partage le lien ci-dessous manuellement.
            </div>
            <div className="space-y-2">
              <Label>Lien d&apos;invitation</Label>
              <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
                <input
                  readOnly
                  value={shareUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 bg-transparent text-xs font-mono outline-none truncate"
                />
                <button
                  onClick={copy}
                  type="button"
                  className="h-7 px-2 text-xs rounded-md border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-1"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copié' : 'Copier'}
                </button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={reset}>
                Inviter quelqu&apos;un d&apos;autre
              </Button>
              <Button type="button" onClick={() => setOpen(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
