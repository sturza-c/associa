'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { TaskGroupWithMembers } from '@/types/database'

const REVALIDATE = () => revalidatePath('/dashboard/tasks')

async function assertMember(associationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' as const }
  const { data: m } = await supabase
    .from('association_memberships')
    .select('role')
    .eq('association_id', associationId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()
  if (!m) return { error: 'Non membre' as const }
  return { user }
}

export async function getTaskGroups(associationId: string): Promise<TaskGroupWithMembers[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('task_groups')
    .select('*, task_group_members(membership_id)')
    .eq('association_id', associationId)
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return data.map((g) => {
    const row = g as unknown as Record<string, unknown>
    const members = (row.task_group_members ?? []) as { membership_id: string }[]
    return {
      ...(row as unknown as TaskGroupWithMembers),
      membership_ids: members.map(m => m.membership_id),
    }
  })
}

export async function createTaskGroup(
  associationId: string,
  name: string,
  color: string,
  membershipIds: string[],
) {
  const auth = await assertMember(associationId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { data: group, error } = await admin
    .from('task_groups')
    .insert({ association_id: associationId, name: name.trim(), color, created_by: auth.user.id })
    .select()
    .single()

  if (error || !group) return { error: 'Erreur lors de la création du groupe' }

  if (membershipIds.length > 0) {
    await admin.from('task_group_members').insert(
      membershipIds.map(mid => ({ group_id: group.id, membership_id: mid }))
    )
  }

  REVALIDATE()
  return { success: true, group: group as { id: string; name: string } }
}

export async function updateTaskGroup(
  groupId: string,
  associationId: string,
  updates: { name?: string; color?: string; membershipIds?: string[] },
) {
  const auth = await assertMember(associationId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()

  if (updates.name !== undefined || updates.color !== undefined) {
    const patch: Record<string, string> = { updated_at: new Date().toISOString() }
    if (updates.name !== undefined) patch.name = updates.name.trim()
    if (updates.color !== undefined) patch.color = updates.color
    await admin.from('task_groups').update(patch).eq('id', groupId)
  }

  if (updates.membershipIds !== undefined) {
    await admin.from('task_group_members').delete().eq('group_id', groupId)
    if (updates.membershipIds.length > 0) {
      await admin.from('task_group_members').insert(
        updates.membershipIds.map(mid => ({ group_id: groupId, membership_id: mid }))
      )
    }
  }

  REVALIDATE()
  return { success: true }
}

export async function deleteTaskGroup(groupId: string, associationId: string) {
  const auth = await assertMember(associationId)
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin.from('task_groups').delete().eq('id', groupId)
  if (error) return { error: 'Erreur lors de la suppression' }

  REVALIDATE()
  return { success: true }
}
