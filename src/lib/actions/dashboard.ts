'use server'

import { createClient } from '@/lib/supabase/server'

export interface DashboardStats {
  memberCount: number
  tasksTodo: number
  tasksInProgress: number
  tasksDone: number
  documentCount: number
  balance: number
  income: number
  expenses: number
  unreadMessages: number
}

export async function getDashboardStats(associationId: string): Promise<DashboardStats> {
  const supabase = await createClient()

  const [members, tasks, documents, finances] = await Promise.all([
    supabase
      .from('association_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('association_id', associationId)
      .eq('is_active', true),
    supabase
      .from('tasks')
      .select('status')
      .eq('association_id', associationId),
    supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('association_id', associationId),
    supabase
      .from('finances')
      .select('type, amount')
      .eq('association_id', associationId),
  ])

  const taskData = tasks.data ?? []
  const financeData = finances.data ?? []

  const income = financeData
    .filter(f => f.type === 'income')
    .reduce((sum, f) => sum + f.amount, 0)
  const expenses = financeData
    .filter(f => f.type === 'expense')
    .reduce((sum, f) => sum + f.amount, 0)

  return {
    memberCount: members.count ?? 0,
    tasksTodo: taskData.filter(t => t.status === 'todo').length,
    tasksInProgress: taskData.filter(t => t.status === 'in_progress').length,
    tasksDone: taskData.filter(t => t.status === 'done').length,
    documentCount: documents.count ?? 0,
    balance: income - expenses,
    income,
    expenses,
    unreadMessages: 0,
  }
}
