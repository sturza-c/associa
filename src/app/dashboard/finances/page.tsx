import { redirect } from 'next/navigation'
import { getActiveMembership } from '@/lib/actions/active-association'
import { getFinances } from '@/lib/actions/finances'
import { getEventBudgets } from '@/lib/actions/budgets'
import { getFinanceCategories } from '@/lib/actions/finance-categories'
import { FinancesView } from '@/features/finances/finances-view'

export default async function FinancesPage() {
  const activeMembership = await getActiveMembership()
  if (!activeMembership) redirect('/onboarding')

  const associationId = activeMembership.association_id
  const [finances, budgets, categories] = await Promise.all([
    getFinances(associationId),
    getEventBudgets(associationId),
    getFinanceCategories(associationId),
  ])

  return (
    <FinancesView
      associationId={associationId}
      callerRole={activeMembership.role}
      initialData={{ finances, budgets, categories }}
    />
  )
}
