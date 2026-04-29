import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveMembership } from '@/lib/actions/active-association'
import { getFinances } from '@/lib/actions/finances'
import { getEventBudgets } from '@/lib/actions/budgets'
import { getFinanceCategories } from '@/lib/actions/finance-categories'
import { FinancesShell } from '@/features/finances/finances-shell'

export default async function FinancesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const activeMembership = await getActiveMembership()
  if (!activeMembership) redirect('/onboarding')

  const [finances, budgets, categories] = await Promise.all([
    getFinances(activeMembership.association_id),
    getEventBudgets(activeMembership.association_id),
    getFinanceCategories(activeMembership.association_id),
  ])

  return (
    <FinancesShell
      finances={finances}
      budgets={budgets}
      categories={categories}
      associationId={activeMembership.association_id}
      callerRole={activeMembership.role}
    />
  )
}
