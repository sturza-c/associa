import type { Role, RoleLabels } from '@/types/database'

export const DEFAULT_ROLE_LABELS: Record<Role, string> = {
  president: 'Président·e',
  treasurer: 'Trésorier·ère',
  secretary: 'Secrétaire',
  member: 'Membre',
}

export const ROLE_ORDER: Role[] = ['president', 'treasurer', 'secretary', 'member']

export function roleLabel(role: Role, custom?: RoleLabels | null): string {
  const c = custom?.[role]?.trim()
  if (c) return c
  return DEFAULT_ROLE_LABELS[role]
}
