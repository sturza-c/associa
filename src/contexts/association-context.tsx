'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { Association, AssociationMembership, MembershipWithAssociation } from '@/types/database'

interface AssociationContextValue {
  activeAssociation: Association | null
  activeMembership: AssociationMembership | null
  memberships: MembershipWithAssociation[]
  setActive: (membership: MembershipWithAssociation) => void
  /** Optimistically patch fields of the active association (e.g. logo_url after upload) */
  patchActiveAssociation: (patch: Partial<Association>) => void
}

const AssociationContext = createContext<AssociationContextValue | null>(null)

export function AssociationProvider({
  children,
  memberships,
  defaultAssociationId,
}: {
  children: React.ReactNode
  memberships: MembershipWithAssociation[]
  /** Server-computed active association ID — eliminates the useEffect waterfall */
  defaultAssociationId?: string
}) {
  // Initialise synchronously from the server-provided ID.
  // No useEffect, no localStorage read on mount → context is non-null on the very first render.
  const [activeMembership, setActiveMembership] = useState<MembershipWithAssociation | null>(
    () => {
      if (memberships.length === 0) return null
      if (defaultAssociationId) {
        return memberships.find(m => m.association_id === defaultAssociationId) ?? memberships[0]
      }
      return memberships[0]
    }
  )

  const setActive = useCallback((membership: MembershipWithAssociation) => {
    // Persist choice so the server reads the same association on next navigation
    document.cookie = `associa_active_id=${membership.association_id}; path=/; max-age=31536000; samesite=lax`
    try { localStorage.setItem('associa_active_id', membership.association_id) } catch {}
    setActiveMembership(membership)
  }, [])

  const patchActiveAssociation = useCallback((patch: Partial<Association>) => {
    setActiveMembership(prev => {
      if (!prev) return prev
      return { ...prev, associations: { ...prev.associations, ...patch } }
    })
  }, [])

  return (
    <AssociationContext.Provider
      value={{
        activeAssociation: activeMembership?.associations ?? null,
        activeMembership: activeMembership,
        memberships,
        setActive,
        patchActiveAssociation,
      }}
    >
      {children}
    </AssociationContext.Provider>
  )
}

export function useAssociation() {
  const ctx = useContext(AssociationContext)
  if (!ctx) throw new Error('useAssociation must be used inside AssociationProvider')
  return ctx
}
