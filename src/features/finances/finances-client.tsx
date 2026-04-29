'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { deleteFinanceEntry } from '@/lib/actions/finances'
import { AddFinanceDialog } from './add-finance-dialog'
import type { Finance, Role } from '@/types/database'
import { Trash2, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatAmount(amount: number) {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('fr-CH', { day: '2-digit', month: 'short' })
}

function formatMonthYear(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' })
}

function getMonthKey(date: string) {
  const d = new Date(date + 'T00:00:00')
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

interface FinanceWithBalance extends Finance {
  runningBalance: number
}

interface Props {
  finances: Finance[]
  associationId: string
  callerRole: Role
}

export function FinancesClient({ finances, associationId, callerRole }: Props) {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const canManage = ['president', 'treasurer'].includes(callerRole)

  const totalIncome = finances.filter(f => f.type === 'income').reduce((s, f) => s + f.amount, 0)
  const totalExpense = finances.filter(f => f.type === 'expense').reduce((s, f) => s + f.amount, 0)
  const balance = totalIncome - totalExpense

  const withBalance = useMemo<FinanceWithBalance[]>(() => {
    const sorted = [...finances].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    let running = 0
    return sorted.map(f => {
      running += f.type === 'income' ? f.amount : -f.amount
      return { ...f, runningBalance: running }
    }).reverse()
  }, [finances])

  const filtered = filter === 'all' ? withBalance : withBalance.filter(f => f.type === filter)

  const grouped = useMemo(() => {
    const map = new Map<string, FinanceWithBalance[]>()
    for (const entry of filtered) {
      const key = getMonthKey(entry.date)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(entry)
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  async function handleDelete(id: string) {
    setLoadingId(id)
    const result = await deleteFinanceEntry(id, associationId)
    if (result.error) toast.error(result.error)
    else toast.success('Entrée supprimée')
    setLoadingId(null)
  }

  const tabs = [
    { value: 'all' as const, label: 'Toutes', count: finances.length },
    { value: 'income' as const, label: 'Recettes', count: finances.filter(f => f.type === 'income').length },
    { value: 'expense' as const, label: 'Dépenses', count: finances.filter(f => f.type === 'expense').length },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-10">

          {/* Hero balance — minimal */}
          <div className="flex items-baseline justify-between gap-8 pb-8 border-b border-white/6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                Solde net
              </p>
              <p className={cn(
                'text-5xl font-bold tabular-nums tracking-tight',
                balance < 0 && 'text-red-400'
              )}>
                {formatAmount(balance)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 text-sm tabular-nums">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-xs">Recettes</span>
                <span className="font-medium">+{formatAmount(totalIncome)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-xs">Dépenses</span>
                <span className="font-medium">−{formatAmount(totalExpense)}</span>
              </div>
            </div>
          </div>

          {/* Filter tabs — minimal text-only */}
          <div className="flex items-center gap-6 text-sm">
            {tabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={cn(
                  'flex items-center gap-1.5 transition-colors pb-2 border-b -mb-px',
                  filter === tab.value
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
                <span className="text-xs text-muted-foreground tabular-nums">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Entries */}
          {grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Wallet className="h-8 w-8 text-muted-foreground/20 mb-4" />
              <p className="text-sm text-muted-foreground font-heading italic">
                Aucune entrée pour l&apos;instant
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {grouped.map(([monthKey, entries]) => {
                const monthIncome = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0)
                const monthExpense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0)
                const monthBalance = monthIncome - monthExpense

                return (
                  <div key={monthKey}>
                    {/* Month header — minimal */}
                    <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-white/5">
                      <h3 className="text-xs font-medium text-muted-foreground capitalize font-heading italic">
                        {formatMonthYear(entries[0].date)}
                      </h3>
                      <span className={cn(
                        'text-xs tabular-nums',
                        monthBalance >= 0 ? 'text-muted-foreground' : 'text-red-400'
                      )}>
                        {monthBalance >= 0 ? '+' : ''}{formatAmount(monthBalance)}
                      </span>
                    </div>

                    {/* Rows — borderless */}
                    <div>
                      {entries.map(entry => (
                        <div
                          key={entry.id}
                          className={cn(
                            'group grid items-center gap-4 py-3 border-b border-white/[0.04] transition-opacity',
                            loadingId === entry.id && 'opacity-40'
                          )}
                          style={{ gridTemplateColumns: '3.5rem 1fr 7rem 7rem 1.5rem' }}
                        >
                          {/* Date */}
                          <span className="text-xs text-muted-foreground/70 tabular-nums">
                            {formatDate(entry.date)}
                          </span>

                          {/* Label */}
                          <div className="min-w-0">
                            <p className="text-sm truncate">{entry.label}</p>
                            {entry.description && (
                              <p className="text-xs text-muted-foreground/60 truncate mt-0.5">
                                {entry.description}
                              </p>
                            )}
                          </div>

                          {/* Amount */}
                          <p className={cn(
                            'text-sm tabular-nums text-right',
                            entry.type === 'income' ? 'text-foreground' : 'text-red-400'
                          )}>
                            {entry.type === 'income' ? '+' : '−'}{formatAmount(entry.amount)}
                          </p>

                          {/* Running balance */}
                          <p className="text-xs tabular-nums text-right text-muted-foreground/60">
                            {formatAmount(entry.runningBalance)}
                          </p>

                          {/* Delete */}
                          {canManage ? (
                            <button
                              onClick={() => handleDelete(entry.id)}
                              disabled={loadingId === entry.id}
                              className="flex items-center justify-center text-muted-foreground/0 group-hover:text-muted-foreground/60 hover:!text-red-400 transition-colors disabled:pointer-events-none"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          ) : <span />}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
  )
}
