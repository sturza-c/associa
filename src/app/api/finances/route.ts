import { NextRequest, NextResponse } from 'next/server'
import { getFinances } from '@/lib/actions/finances'
import { getEventBudgets } from '@/lib/actions/budgets'
import { getFinanceCategories } from '@/lib/actions/finance-categories'

export async function GET(request: NextRequest) {
  const associationId = request.nextUrl.searchParams.get('associationId')
  if (!associationId) return NextResponse.json({ error: 'Missing associationId' }, { status: 400 })

  const [finances, budgets, categories] = await Promise.all([
    getFinances(associationId),
    getEventBudgets(associationId),
    getFinanceCategories(associationId),
  ])

  return NextResponse.json({ finances, budgets, categories })
}
