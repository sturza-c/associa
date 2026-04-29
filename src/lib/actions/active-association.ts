'use server'

import { cookies } from 'next/headers'
import { getUserMemberships } from './associations'
import type { MembershipWithAssociation } from '@/types/database'

const COOKIE_NAME = 'associa_active_id'

export async function getActiveMembership(): Promise<MembershipWithAssociation | null> {
  const memberships = await getUserMemberships()
  if (memberships.length === 0) return null

  const cookieStore = await cookies()
  const storedId = cookieStore.get(COOKIE_NAME)?.value

  const found = storedId
    ? memberships.find(m => m.association_id === storedId)
    : null

  return found ?? memberships[0]
}

export async function setActiveAssociationCookie(associationId: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, associationId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
    sameSite: 'lax',
  })
}
