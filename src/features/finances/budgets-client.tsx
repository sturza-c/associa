'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import {
  addBudgetLine,
  updateBudgetLineActual,
  deleteBudgetLine,
  deleteEventBudget,
  updateBudgetStatus,
} from '@/lib/actions/budgets'
import type {
  EventBudgetWithLines,
  EventBudgetStatus,
  FinanceType,
  Role,
} from '@/types/database'
import { CalendarDays, ChevronRight, ArrowLeft, Plus, Trash2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatAmount(amount: number) {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(date: string | null) {
  if (!date) return null
  return new Date(date + 'T00:00:00').toLocaleDateString('fr-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const STATUS_LABELS: Record<EventBudgetStatus, string> = {
  planned: 'Planifié',
  active: 'En cours',
  closed: 'Clôturé',
}

const STATUS_COLORS: Record<EventBudgetStatus, string> = {
  planned: 'bg-blue-500/10 text-blue-300 ring-blue-500/25',
  active: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/25',
  closed: 'bg-white/5 text-muted-foreground ring-white/10',
}

interface Props {
  budgets: EventBudgetWithLines[]
  associationId: string
  callerRole: Role
}

function summarize(budget: EventBudgetWithLines) {
  const planned_income = budget.lines.filter(l => l.type === 'income').reduce((s, l) => s + l.planned_amount, 0)
  const planned_expense = budget.lines.filter(l => l.type === 'expense').reduce((s, l) => s + l.planned_amount, 0)
  const actual_income = budget.lines.filter(l => l.type === 'income').reduce((s, l) => s + l.actual_amount, 0)
  const actual_expense = budget.lines.filter(l => l.type === 'expense').reduce((s, l) => s + l.actual_amount, 0)
  return {
    planned_income,
    planned_expense,
    actual_income,
    actual_expense,
    planned_balance: planned_income - planned_expense,
    actual_balance: actual_income - actual_expense,
  }
}

export function BudgetsClient({ budgets, associationId, callerRole }: Props) {
  const canManage = ['president', 'treasurer'].includes(callerRole)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = useMemo(
    () => budgets.find(b => b.id === selectedId) ?? null,
    [budgets, selectedId]
  )

  if (selected) {
    return (
      <BudgetDetail
        budget={selected}
        associationId={associationId}
        canManage={canManage}
        onBack={() => setSelectedId(null)}
      />
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-6">
        {budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/20 mb-4" />
            <p className="text-sm text-muted-foreground font-heading italic">
              Aucun budget d&apos;événement
            </p>
            {canManage && (
              <p className="text-xs text-muted-foreground/60 mt-2">
                Créez-en un pour planifier recettes et dépenses prévues.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {budgets.map(b => {
              const s = summarize(b)
              const total_planned = s.planned_income + s.planned_expense
              const incomePct = total_planned > 0 ? (s.planned_income / total_planned) * 100 : 0
              const expensePct = total_planned > 0 ? (s.planned_expense / total_planned) * 100 : 0
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedId(b.id)}
                  className="group w-full text-left rounded-2xl border border-white/7 bg-white/[0.035] backdrop-blur-md p-5 hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md ring-1',
                          STATUS_COLORS[b.status]
                        )}>
                          {STATUS_LABELS[b.status]}
                        </span>
                        {b.event_date && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <CalendarDays className="h-3 w-3" />
                            {formatDate(b.event_date)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold tracking-tight truncate">
                        {b.name}
                      </h3>
                      {b.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {b.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </div>

                  {/* Planned vs actual summary */}
                  <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-1">Prévu</p>
                      <p className={cn(
                        'text-sm font-semibold tabular-nums',
                        s.planned_balance < 0 && 'text-red-400'
                      )}>
                        {s.planned_balance >= 0 ? '+' : ''}{formatAmount(s.planned_balance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-1">Réel</p>
                      <p className={cn(
                        'text-sm font-semibold tabular-nums',
                        s.actual_balance < 0 && 'text-red-400'
                      )}>
                        {s.actual_balance >= 0 ? '+' : ''}{formatAmount(s.actual_balance)}
                      </p>
                    </div>
                  </div>

                  {total_planned > 0 && (
                    <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div className="bg-emerald-400/70" style={{ width: `${incomePct}%` }} />
                      <div className="bg-red-400/70" style={{ width: `${expensePct}%` }} />
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{b.lines.length} ligne{b.lines.length > 1 ? 's' : ''}</span>
                    <span className="tabular-nums">
                      Recettes prévues <span className="text-foreground font-medium">{formatAmount(s.planned_income)}</span>
                      {' · '}
                      Dépenses <span className="text-foreground font-medium">{formatAmount(s.planned_expense)}</span>
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Budget detail
// =============================================================================

export function BudgetDetail({
  budget,
  associationId,
  canManage,
  onBack,
}: {
  budget: EventBudgetWithLines
  associationId: string
  canManage: boolean
  onBack: () => void
}) {
  const [showAddLine, setShowAddLine] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const s = useMemo(() => summarize(budget), [budget])
  const incomeLines = budget.lines.filter(l => l.type === 'income')
  const expenseLines = budget.lines.filter(l => l.type === 'expense')

  async function handleAddLine(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const result = await addBudgetLine(budget.id, associationId, {
      type: fd.get('type') as FinanceType,
      label: fd.get('label') as string,
      planned_amount: parseFloat(fd.get('planned_amount') as string),
      actual_amount: parseFloat(fd.get('actual_amount') as string) || 0,
    })
    if (result.error) toast.error(result.error)
    else {
      toast.success('Ligne ajoutée')
      setShowAddLine(false)
      ;(e.target as HTMLFormElement).reset()
    }
  }

  async function handleUpdateActual(lineId: string, value: string) {
    const num = parseFloat(value)
    if (isNaN(num)) return
    setLoadingId(lineId)
    const result = await updateBudgetLineActual(lineId, associationId, num)
    if (result.error) toast.error(result.error)
    setLoadingId(null)
  }

  async function handleDeleteLine(lineId: string) {
    setLoadingId(lineId)
    const result = await deleteBudgetLine(lineId, associationId)
    if (result.error) toast.error(result.error)
    else toast.success('Ligne supprimée')
    setLoadingId(null)
  }

  async function handleDeleteBudget() {
    if (!confirm('Supprimer ce budget et toutes ses lignes ?')) return
    const result = await deleteEventBudget(budget.id, associationId)
    if (result.error) toast.error(result.error)
    else {
      toast.success('Budget supprimé')
      onBack()
    }
  }

  async function handleStatusChange(status: EventBudgetStatus) {
    setStatusUpdating(true)
    const result = await updateBudgetStatus(budget.id, associationId, status)
    if (result.error) toast.error(result.error)
    setStatusUpdating(false)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-10">

        {/* Header with back */}
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-3 w-3" />
            Retour aux budgets
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                {canManage ? (
                  <select
                    value={budget.status}
                    onChange={e => handleStatusChange(e.target.value as EventBudgetStatus)}
                    disabled={statusUpdating}
                    className={cn(
                      'text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md ring-1 bg-transparent cursor-pointer',
                      STATUS_COLORS[budget.status]
                    )}
                  >
                    {(['planned', 'active', 'closed'] as EventBudgetStatus[]).map(st => (
                      <option key={st} value={st} className="bg-background text-foreground">
                        {STATUS_LABELS[st]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={cn(
                    'text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md ring-1',
                    STATUS_COLORS[budget.status]
                  )}>
                    {STATUS_LABELS[budget.status]}
                  </span>
                )}
                {budget.event_date && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(budget.event_date)}
                  </span>
                )}
              </div>
              <h2 className="font-heading italic font-normal text-4xl leading-tight tracking-tight">
                {budget.name}
              </h2>
              {budget.description && (
                <p className="text-sm text-muted-foreground mt-2">{budget.description}</p>
              )}
            </div>
            {canManage && (
              <button
                onClick={handleDeleteBudget}
                className="text-muted-foreground/60 hover:text-red-400 transition-colors p-2"
                title="Supprimer le budget"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-6 pb-6 border-b border-white/6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Budget prévu
            </p>
            <p className={cn(
              'text-3xl font-bold tabular-nums tracking-tight',
              s.planned_balance < 0 && 'text-red-400'
            )}>
              {s.planned_balance >= 0 ? '+' : ''}{formatAmount(s.planned_balance)}
            </p>
            <p className="text-xs text-muted-foreground mt-2 tabular-nums">
              +{formatAmount(s.planned_income)} · −{formatAmount(s.planned_expense)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Budget réel
            </p>
            <p className={cn(
              'text-3xl font-bold tabular-nums tracking-tight',
              s.actual_balance < 0 && 'text-red-400'
            )}>
              {s.actual_balance >= 0 ? '+' : ''}{formatAmount(s.actual_balance)}
            </p>
            <p className="text-xs text-muted-foreground mt-2 tabular-nums">
              +{formatAmount(s.actual_income)} · −{formatAmount(s.actual_expense)}
            </p>
          </div>
        </div>

        {/* Sections: Recettes, Dépenses */}
        {(['income', 'expense'] as FinanceType[]).map(type => {
          const lines = type === 'income' ? incomeLines : expenseLines
          return (
            <section key={type}>
              <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-white/5">
                <h3 className="text-xs font-medium text-muted-foreground capitalize font-heading italic">
                  {type === 'income' ? 'Recettes' : 'Dépenses'}
                </h3>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {lines.length} ligne{lines.length > 1 ? 's' : ''}
                </span>
              </div>

              {lines.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 italic font-heading py-4">
                  Aucune ligne pour l&apos;instant.
                </p>
              ) : (
                <div>
                  {/* header */}
                  <div className="grid items-center gap-4 py-2 text-[10px] uppercase tracking-widest text-muted-foreground/60"
                    style={{ gridTemplateColumns: '1fr 7rem 8rem 1.5rem' }}
                  >
                    <span>Libellé</span>
                    <span className="text-right">Prévu</span>
                    <span className="text-right">Réel</span>
                    <span />
                  </div>
                  {lines.map(line => {
                    const variance = line.actual_amount - line.planned_amount
                    const variancePct = line.planned_amount > 0
                      ? (line.actual_amount / line.planned_amount) * 100
                      : 0
                    const overBudget = type === 'expense' ? variance > 0 : variance < 0
                    return (
                      <div
                        key={line.id}
                        className={cn(
                          'grid items-center gap-4 py-3 border-b border-white/[0.04] transition-opacity',
                          loadingId === line.id && 'opacity-40'
                        )}
                        style={{ gridTemplateColumns: '1fr 7rem 8rem 1.5rem' }}
                      >
                        <div className="min-w-0">
                          <p className="text-sm truncate">{line.label}</p>
                          {line.planned_amount > 0 && (
                            <div className="mt-1.5 h-1 w-full max-w-[140px] rounded-full bg-white/5 overflow-hidden">
                              <div
                                className={cn(
                                  'h-full transition-all',
                                  overBudget ? 'bg-red-400/70' : 'bg-emerald-400/60'
                                )}
                                style={{ width: `${Math.min(100, variancePct)}%` }}
                              />
                            </div>
                          )}
                        </div>
                        <p className="text-sm tabular-nums text-right text-muted-foreground">
                          {formatAmount(line.planned_amount)}
                        </p>
                        {canManage ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={line.actual_amount}
                            onBlur={e => {
                              const v = parseFloat(e.target.value)
                              if (!isNaN(v) && v !== line.actual_amount) handleUpdateActual(line.id, e.target.value)
                            }}
                            className={cn(
                              'text-sm tabular-nums text-right bg-transparent border-none outline-none focus:ring-1 focus:ring-white/15 rounded-md px-1 py-0.5 -my-0.5',
                              overBudget && 'text-red-400'
                            )}
                          />
                        ) : (
                          <p className={cn(
                            'text-sm tabular-nums text-right',
                            overBudget && 'text-red-400'
                          )}>
                            {formatAmount(line.actual_amount)}
                          </p>
                        )}
                        {canManage ? (
                          <button
                            onClick={() => handleDeleteLine(line.id)}
                            disabled={loadingId === line.id}
                            className="flex items-center justify-center text-muted-foreground/0 hover:!text-red-400 transition-colors disabled:pointer-events-none [.group:hover_&]:text-muted-foreground/60"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        ) : <span />}
                      </div>
                    )
                  })}
                </div>
              )}

              {canManage && (
                <button
                  onClick={() => setShowAddLine(true)}
                  className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Ajouter une ligne {type === 'income' ? 'de recette' : 'de dépense'}
                </button>
              )}
            </section>
          )
        })}

        {/* Add line inline form */}
        {canManage && showAddLine && (
          <form
            onSubmit={handleAddLine}
            className="rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-md p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">
                <span className="font-heading italic font-normal">Nouvelle</span> ligne
              </h4>
              <button
                type="button"
                onClick={() => setShowAddLine(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Annuler
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select
                name="type"
                defaultValue="expense"
                className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/15"
              >
                <option value="income" className="bg-background">Recette</option>
                <option value="expense" className="bg-background">Dépense</option>
              </select>
              <input
                name="label"
                placeholder="Libellé"
                required
                className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/15"
              />
              <input
                name="planned_amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Prévu (CHF)"
                required
                className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/15"
              />
              <input
                name="actual_amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Réel (CHF, optionnel)"
                className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/15"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Ajouter la ligne
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
