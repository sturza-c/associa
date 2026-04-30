'use client'

import { useState, useMemo, useTransition, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { updateMemberRole, deactivateMember } from '@/lib/actions/members'
import { revokeInvitation, resendInvitation, type PendingInvitation } from '@/lib/actions/invitations'
import { InviteMemberDialog } from './invite-member-dialog'
import { ManagePostesDialog } from './manage-postes-dialog'
import type { MembershipWithProfile, Role, AssociationTitle } from '@/types/database'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, UserMinus, ShieldCheck, Search, Users, Mail, X, Send, Copy, Check, Download, FileText, FileSpreadsheet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { exportMembersCSV, exportMembersPDF } from '@/lib/export'

const ROLE_LABELS: Record<Role, string> = {
  president: 'Président·e',
  treasurer: 'Trésorier·ère',
  secretary: 'Secrétaire',
  member: 'Membre',
}

const ROLE_COLORS: Record<Role, { badge: string; header: string; dot: string }> = {
  president: {
    badge: 'bg-violet-500/10 text-violet-500 dark:text-violet-300 ring-violet-500/25',
    header: 'text-violet-500 dark:text-violet-300',
    dot: 'bg-violet-500',
  },
  treasurer: {
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 ring-emerald-500/25',
    header: 'text-emerald-600 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  secretary: {
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-300 ring-blue-500/25',
    header: 'text-blue-600 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  member: {
    badge: 'bg-foreground/5 text-muted-foreground ring-foreground/10',
    header: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
}

const ALL_ROLES: Role[] = ['president', 'treasurer', 'secretary', 'member']

function getInitials(name: string | null, email: string) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return email[0].toUpperCase()
}

interface Props {
  members: MembershipWithProfile[]
  invitations: PendingInvitation[]
  associationId: string
  associationName: string
  callerRole: Role
  currentUserId: string
  titles: AssociationTitle[]
  memberTitleMap: Record<string, string[]>
}

export function MembersClient({
  members,
  invitations,
  associationId,
  associationName,
  callerRole,
  currentUserId,
  titles,
  memberTitleMap,
}: Props) {
  const router = useRouter()
  const [, startInvTransition] = useTransition()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)
  const isPresident = callerRole === 'president'
  const canInvite = callerRole === 'president' || callerRole === 'secretary'

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const filteredMembers = useMemo(() => {
    if (!query) return members
    const q = query.toLowerCase()
    return members.filter(m =>
      (m.user_profiles.full_name ?? '').toLowerCase().includes(q) ||
      m.user_profiles.email.toLowerCase().includes(q)
    )
  }, [members, query])

  const groupedByRole = useMemo(() => {
    const groups: Record<Role, MembershipWithProfile[]> = {
      president: [], treasurer: [], secretary: [], member: [],
    }
    for (const m of filteredMembers) {
      const role = m.role as Role
      if (groups[role]) groups[role].push(m)
    }
    return groups
  }, [filteredMembers])

  async function handleRoleChange(membershipId: string, role: Role) {
    setLoading(membershipId)
    const result = await updateMemberRole(membershipId, associationId, role)
    if (result.error) toast.error(result.error)
    else toast.success('Rôle mis à jour')
    setLoading(null)
  }

  function handleRevoke(invitationId: string) {
    startInvTransition(async () => {
      const r = await revokeInvitation(invitationId, associationId)
      if (r.error) toast.error(r.error)
      else { toast.success('Invitation supprimée'); router.refresh() }
    })
  }

  function handleResend(invitationId: string) {
    startInvTransition(async () => {
      const r = await resendInvitation(invitationId, associationId)
      if (r.error) toast.error(r.error)
      else { toast.success('Invitation renvoyée'); router.refresh() }
    })
  }

  function handleCopy(url: string, id: string) {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  async function handleDeactivate(membershipId: string) {
    setLoading(membershipId)
    const result = await deactivateMember(membershipId, associationId)
    if (result.error) toast.error(result.error)
    else toast.success('Membre retiré de l\'association')
    setLoading(null)
  }

  // Member card — shared between base-role sections and poste sections
  function MemberCard({ m }: { m: MembershipWithProfile }) {
    const prof = m.user_profiles
    const isCurrentUser = m.user_id === currentUserId
    const colors = ROLE_COLORS[m.role as Role]
    const myTitles = titles.filter(t => (memberTitleMap[m.id] ?? []).includes(t.id))

    return (
      <div
        className={cn(
          'flex items-center gap-4 px-5 py-4 hover:bg-foreground/[0.02] transition-colors',
          loading === m.id && 'opacity-50'
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-foreground/15 to-foreground/5 text-xs font-semibold ring-1 ring-border">
          {getInitials(prof.full_name, prof.email)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium truncate">
              {prof.full_name || prof.email}
            </p>
            {isCurrentUser && (
              <span className="text-[10px] text-muted-foreground bg-foreground/5 rounded-md px-1.5 py-0.5 font-medium">
                vous
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{prof.email}</p>
          {/* Custom poste badges */}
          {myTitles.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {myTitles.map(t => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1"
                  style={{
                    color: t.color,
                    borderColor: `${t.color}55`,
                    backgroundColor: `${t.color}12`,
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                  {t.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <span className={cn(
          'text-[11px] font-medium px-2 py-1 rounded-md ring-1 shrink-0 uppercase tracking-wide',
          colors.badge
        )}>
          {ROLE_LABELS[m.role as Role]}
        </span>

        {isPresident && !isCurrentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors shrink-0 disabled:opacity-50"
              disabled={loading === m.id}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                Changer le rôle
              </div>
              {ALL_ROLES.map(r => (
                <DropdownMenuItem
                  key={r}
                  onClick={() => handleRoleChange(m.id, r)}
                  disabled={m.role === r}
                  className="cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  {ROLE_LABELS[r]}
                  {m.role === r && <span className="ml-auto text-xs text-muted-foreground">actuel</span>}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive cursor-pointer"
                onClick={() => handleDeactivate(m.id)}
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Retirer de l&apos;association
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border shrink-0">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">
            Pilotage
          </p>
          <h1 className="text-[28px] font-semibold mt-1 leading-tight tracking-tight">
            <span className="font-heading italic font-normal text-[32px]">Membres</span> de l&apos;association
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Export dropdown */}
          {members.length > 0 && (
            <div ref={exportRef} className="relative">
              <button
                onClick={() => setExportOpen(v => !v)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-colors"
              >
                <Download className="h-4 w-4" />
                Exporter
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-border bg-popover shadow-2xl p-1 z-50">
                  <button
                    onClick={() => { exportMembersCSV(members); setExportOpen(false) }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-foreground/5 transition-colors"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                    CSV
                  </button>
                  <button
                    onClick={() => { exportMembersPDF(members, associationName); setExportOpen(false) }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-foreground/5 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-red-400" />
                    PDF
                  </button>
                </div>
              )}
            </div>
          )}
          {isPresident && (
            <ManagePostesDialog
              associationId={associationId}
              titles={titles}
              members={members}
              memberTitleMap={memberTitleMap}
            />
          )}
          {canInvite && <InviteMemberDialog associationId={associationId} />}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8">

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un membre..."
            className="w-full rounded-xl border border-border bg-background/50 backdrop-blur-md pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all"
          />
        </div>

        {/* Pending invitations */}
        {canInvite && invitations.length > 0 && (
          <div className="rounded-2xl border border-border bg-card backdrop-blur-md overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                En attente
              </p>
              <span className="text-[10px] tabular-nums rounded-md px-1.5 py-0.5 bg-foreground/5 text-muted-foreground">
                {invitations.length}
              </span>
            </div>
            <div className="divide-y divide-border">
              {invitations.map((inv) => (
                <div key={inv.id} className="flex items-center gap-4 px-5 py-3 hover:bg-foreground/[0.02] transition-colors">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/5 ring-1 ring-border">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{inv.email}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {ROLE_LABELS[inv.role]} · invité·e {inv.inviter_name ? `par ${inv.inviter_name} ` : ''}le {new Date(inv.created_at).toLocaleDateString('fr-CH')}
                    </p>
                  </div>
                  {inv.share_url && (
                    <button
                      onClick={() => handleCopy(inv.share_url!, inv.id)}
                      className="h-8 px-2.5 text-xs rounded-lg border border-border hover:bg-foreground/5 transition-colors flex items-center gap-1.5"
                    >
                      {copiedId === inv.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copiedId === inv.id ? 'Copié' : 'Lien'}
                    </button>
                  )}
                  <button
                    onClick={() => handleResend(inv.id)}
                    className="h-8 px-2.5 text-xs rounded-lg border border-border hover:bg-foreground/5 transition-colors flex items-center gap-1.5"
                  >
                    <Send className="h-3 w-3" />
                    Renvoyer
                  </button>
                  <button
                    onClick={() => handleRevoke(inv.id)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {filteredMembers.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card backdrop-blur-md flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-2xl bg-foreground/5 flex items-center justify-center mb-4">
              <Users className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              {query ? 'Aucun membre ne correspond' : 'Aucun membre pour l\'instant'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── Base role sections ── */}
            {ALL_ROLES.map(role => {
              const group = groupedByRole[role]
              if (group.length === 0) return null
              const colors = ROLE_COLORS[role]

              return (
                <section key={role}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={cn('h-2 w-2 rounded-full', colors.dot)} />
                    <h2 className={cn('text-xs font-semibold uppercase tracking-[0.18em]', colors.header)}>
                      {ROLE_LABELS[role]}
                    </h2>
                    <span className="text-[11px] tabular-nums text-muted-foreground/60">
                      {group.length}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="rounded-2xl border border-border bg-card backdrop-blur-md overflow-hidden divide-y divide-border">
                    {group.map(m => <MemberCard key={m.id} m={m} />)}
                  </div>
                </section>
              )
            })}

            {/* ── Custom poste sections ── */}
            {titles.map(title => {
              const group = filteredMembers.filter(m =>
                (memberTitleMap[m.id] ?? []).includes(title.id)
              )
              if (group.length === 0) return null

              return (
                <section key={title.id}>
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: title.color }}
                    />
                    <h2
                      className="text-xs font-semibold uppercase tracking-[0.18em]"
                      style={{ color: title.color }}
                    >
                      {title.name}
                    </h2>
                    <span className="text-[11px] tabular-nums text-muted-foreground/60">
                      {group.length}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="rounded-2xl border border-border bg-card backdrop-blur-md overflow-hidden divide-y divide-border">
                    {group.map(m => <MemberCard key={m.id} m={m} />)}
                  </div>
                </section>
              )
            })}

          </div>
        )}
      </div>
    </div>
  )
}
