'use client'

import { useRouter } from 'next/navigation'
import type { MembershipWithAssociation } from '@/types/database'
import { Building2, ArrowRight } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  president: 'Président·e',
  treasurer: 'Trésorier·ère',
  secretary: 'Secrétaire',
  member: 'Membre',
}

const ROLE_COLORS: Record<string, string> = {
  president: 'bg-violet-500/10 text-violet-300 ring-violet-500/25',
  treasurer: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/25',
  secretary: 'bg-blue-500/10 text-blue-300 ring-blue-500/25',
  member: 'bg-white/5 text-muted-foreground ring-white/10',
}

function getAssocInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function AssociationPicker({ memberships }: { memberships: MembershipWithAssociation[] }) {
  const router = useRouter()

  function handleSelect(membership: MembershipWithAssociation) {
    localStorage.setItem('associa_active_id', membership.association_id)
    document.cookie = `associa_active_id=${membership.association_id}; path=/; max-age=31536000; samesite=lax`
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl shadow-2xl overflow-hidden divide-y divide-white/5">
      {memberships.map((membership) => {
        const accent = membership.associations.accent_color ?? '#6366f1'
        return (
          <button
            key={membership.id}
            onClick={() => handleSelect(membership)}
            className="group w-full text-left flex items-center gap-4 px-5 py-4 hover:bg-white/4 transition-colors"
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ring-1 ring-white/10"
              style={{ backgroundColor: accent + '22', color: accent }}
            >
              {membership.associations.name
                ? getAssocInitials(membership.associations.name)
                : <Building2 className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{membership.associations.name}</p>
              {membership.associations.description ? (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {membership.associations.description}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground/50 italic font-heading mt-0.5">
                  Pas de description
                </p>
              )}
            </div>
            <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-md ring-1 shrink-0 ${ROLE_COLORS[membership.role] ?? ROLE_COLORS.member}`}>
              {ROLE_LABELS[membership.role] ?? membership.role}
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        )
      })}
    </div>
  )
}
