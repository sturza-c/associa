'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Association, AssociationMembership, MembershipWithAssociation } from '@/types/database'

interface AssociationContextValue {
  activeAssociation: Association | null
  activeMembership: AssociationMembership | null
  memberships: MembershipWithAssociation[]
  setActive: (membership: MembershipWithAssociation) => void
}

const AssociationContext = createContext<AssociationContextValue | null>(null)

const STORAGE_KEY = 'associa_active_id'

export function AssociationProvider({
  children,
  memberships,
}: {
  children: React.ReactNode
  memberships: MembershipWithAssociation[]
}) {
  const [activeMembership, setActiveMembership] = useState<MembershipWithAssociation | null>(null)

  useEffect(() => {
    if (memberships.length === 0) return

    const stored = localStorage.getItem(STORAGE_KEY)
    const found = stored
      ? memberships.find(m => m.association_id === stored)
      : null

    const active = found ?? memberships[0]
    document.cookie = `associa_active_id=${active.association_id}; path=/; max-age=31536000; samesite=lax`
    setActiveMembership(active)
  }, [memberships])

  const setActive = useCallback((membership: MembershipWithAssociation) => {
    localStorage.setItem(STORAGE_KEY, membership.association_id)
    document.cookie = `associa_active_id=${membership.association_id}; path=/; max-age=31536000; samesite=lax`
    setActiveMembership(membership)
  }, [])

  return (
    <AssociationContext.Provider
      value={{
        activeAssociation: activeMembership?.associations ?? null,
        activeMembership: activeMembership,
        memberships,
        setActive,
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
