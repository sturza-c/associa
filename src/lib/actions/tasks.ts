'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { Task, TaskStatus, TaskPriority, Role } from '@/types/database'

export async function getTasks(associationId: string): Promise<Task[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('association_id', associationId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getTasks error:', error)
    return []
  }
  return data as Task[]
}

export async function createTask(formData: FormData, associationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const assigned_to = formData.get('assigned_to') as string
  const priority = (formData.get('priority') as TaskPriority) || 'medium'
  const due_date = formData.get('due_date') as string
  const is_personal = formData.get('is_personal') === 'true'

  if (!title?.trim()) return { error: 'Le titre est requis' }

  const admin = createAdminClient()
  const { error } = await admin.from('tasks').insert({
    association_id: associationId,
    created_by: user.id,
    assigned_to: assigned_to || null,
    title: title.trim(),
    description: description?.trim() || null,
    priority,
    due_date: due_date || null,
    is_personal,
    status: 'todo',
  })

  if (error) {
    console.error('createTask error:', error)
    return { error: 'Erreur lors de la création de la tâche' }
  }

  revalidatePath('/dashboard/tasks')
  return { success: true }
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)

  if (error) return { error: 'Erreur lors de la mise à jour' }

  revalidatePath('/dashboard/tasks')
  return { success: true }
}

export async function deleteTask(taskId: string, associationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Check caller role
  const { data: membership } = await supabase
    .from('association_memberships')
    .select('role')
    .eq('association_id', associationId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  const callerRole = membership?.role as Role | undefined
  const canDelete = ['president', 'secretary'].includes(callerRole ?? '')

  const { data: task } = await supabase
    .from('tasks')
    .select('created_by')
    .eq('id', taskId)
    .single()

  if (!canDelete && task?.created_by !== user.id) {
    return { error: 'Vous ne pouvez pas supprimer cette tâche' }
  }

  const admin = createAdminClient()
  const { error } = await admin.from('tasks').delete().eq('id', taskId)

  if (error) return { error: 'Erreur lors de la suppression' }

  revalidatePath('/dashboard/tasks')
  return { success: true }
}
