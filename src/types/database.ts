export type Role = 'president' | 'treasurer' | 'secretary' | 'member'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'
export type FinanceType = 'income' | 'expense'

export type RoleLabels = Partial<Record<Role, string>>

export interface Association {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  accent_color: string
  role_labels: RoleLabels | null
  created_at: string
  updated_at: string
}

export interface AssociationTitle {
  id: string
  association_id: string
  name: string
  color: string
  description: string | null
  position: number
  created_at: string
  updated_at: string
}

export interface MembershipTitle {
  membership_id: string
  title_id: string
  created_at: string
}

export interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string
  created_at: string
  updated_at: string
}

export interface AssociationMembership {
  id: string
  association_id: string
  user_id: string
  role: Role
  is_active: boolean
  joined_at: string
  updated_at: string
}

export interface Task {
  id: string
  association_id: string
  created_by: string
  assigned_to: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  is_personal: boolean
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  association_id: string
  uploaded_by: string
  name: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  folder: string
  folder_id: string | null
  created_at: string
}

export interface DocumentFolder {
  id: string
  association_id: string
  name: string
  color: string
  position: number
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  association_id: string
  title: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface ConversationParticipant {
  conversation_id: string
  user_id: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

export interface FinanceCategory {
  id: string
  association_id: string
  name: string
  color: string
  position: number
  created_at: string
}

export interface Finance {
  id: string
  association_id: string
  created_by: string
  type: FinanceType
  amount: number
  label: string
  description: string | null
  date: string
  category_id: string | null
  created_at: string
}

export type EventBudgetStatus = 'planned' | 'active' | 'closed'

export interface EventBudget {
  id: string
  association_id: string
  created_by: string
  name: string
  description: string | null
  event_date: string | null
  status: EventBudgetStatus
  created_at: string
  updated_at: string
}

export interface EventBudgetLine {
  id: string
  budget_id: string
  type: FinanceType
  label: string
  planned_amount: number
  actual_amount: number
  notes: string | null
  created_at: string
}

export interface EventBudgetWithLines extends EventBudget {
  lines: EventBudgetLine[]
}

export interface MembershipWithProfile extends AssociationMembership {
  user_profiles: UserProfile
}

export interface MembershipWithAssociation extends AssociationMembership {
  associations: Association
}
