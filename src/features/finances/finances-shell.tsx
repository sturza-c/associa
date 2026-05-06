'use client'

import { useState, useMemo, useTransition, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { deleteFinanceEntry } from '@/lib/actions/finances'
import {
  createFinanceCategory,
  updateFinanceCategory,
  deleteFinanceCategory,
} from '@/lib/actions/finance-categories'
import { AddFinanceDialog } from './add-finance-dialog'
import { CreateBudgetDialog } from './create-budget-dialog'
import { BudgetDetail } from './budgets-client'
import type { Finance, FinanceCategory, Role, EventBudgetWithLines, EventBudgetStatus } from '@/types/database'
import {
  Trash2, Wallet, TrendingUp, TrendingDown, Inbox,
  Plus, Pencil, Check, X, ChevronLeft, FolderOpen,
  Download, FileText, FileSpreadsheet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CollapsibleRail } from '@/components/collapsible-rail'
import { exportFinancesCSV, exportFinancesPDF } from '@/lib/export'
import { EmptyState } from '@/components/ui/empty-state'

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_PRESETS = [
  '#60a5fa', '#34d399', '#a78bfa', '#f472b6',
  '#fbbf24', '#f87171', '#94a3b8', '#22d3ee',
]

const STATUS_DOT: Record<EventBudgetStatus, string> = {
  planned: '#60a5fa', active: '#34d399', closed: '#94a3b8',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount: number) {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency', currency: 'CHF', minimumFractionDigits: 2,
  }).format(amount)
}

function fmtDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('fr-CH', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fmtShort(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('fr-CH', {
    day: '2-digit', month: 'short',
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveKey = 'all' | { type: 'category'; id: string } | { type: 'budget'; id: string }

interface Props {
  finances: Finance[]
  budgets: EventBudgetWithLines[]
  categories: FinanceCategory[]
  associationId: string
  associationName: string
  callerRole: Role
  onRefresh: () => void
}

// ─── Main shell ───────────────────────────────────────────────────────────────

export function FinancesShell({
  finances, budgets, categories, associationId, associationName, callerRole, onRefresh,
}: Props) {
  const [active, setActive] = useState<ActiveKey>('all')
  const [, startTransition] = useTransition()
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  // Close export dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Controlled add-dialog (single instance, opened from dossier cards)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addDialogCategoryId, setAddDialogCategoryId] = useState<string | null>(null)

  const canManage = ['president', 'treasurer', 'secretary'].includes(callerRole)

  const activeBudgetId = typeof active === 'object' && active.type === 'budget' ? active.id : null
  const activeCategoryId = typeof active === 'object' && active.type === 'category' ? active.id : null
  const activeBudget = activeBudgetId ? budgets.find(b => b.id === activeBudgetId) ?? null : null
  const activeCategory = activeCategoryId ? categories.find(c => c.id === activeCategoryId) ?? null : null

  // Global stats
  const totalIncome = finances.filter(f => f.type === 'income').reduce((s, f) => s + f.amount, 0)
  const totalExpense = finances.filter(f => f.type === 'expense').reduce((s, f) => s + f.amount, 0)
  const balance = totalIncome - totalExpense

  function openAddDialog(categoryId: string | null = null) {
    setAddDialogCategoryId(categoryId)
    setAddDialogOpen(true)
  }

  function handleCreateCategory(name: string, color: string) {
    startTransition(async () => {
      const r = await createFinanceCategory(associationId, { name, color })
      if (r.error) toast.error(r.error)
      else {
        toast.success('Dossier créé')
        if (r.category) setActive({ type: 'category', id: r.category.id })
        onRefresh()
      }
    })
  }

  function handleRenameCategory(id: string, name: string) {
    startTransition(async () => {
      const r = await updateFinanceCategory(id, associationId, { name })
      if (r.error) toast.error(r.error)
      else onRefresh()
    })
  }

  function handleRecolorCategory(id: string, color: string) {
    startTransition(async () => {
      const r = await updateFinanceCategory(id, associationId, { color })
      if (r.error) toast.error(r.error)
      else onRefresh()
    })
  }

  function handleDeleteCategory(id: string) {
    if (!confirm('Supprimer ce dossier ? Les entrées resteront accessibles sans dossier.')) return
    startTransition(async () => {
      const r = await deleteFinanceCategory(id, associationId)
      if (r.error) toast.error(r.error)
      else {
        toast.success('Dossier supprimé')
        if (activeCategoryId === id) setActive('all')
        onRefresh()
      }
    })
  }

  async function handleDeleteEntry(id: string) {
    const r = await deleteFinanceEntry(id, associationId)
    if (r.error) toast.error(r.error)
    else { toast.success('Entrée supprimée'); onRefresh() }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border shrink-0">
        <div className="flex items-center gap-4">
          {(activeCategoryId || activeBudgetId) && (
            <button
              onClick={() => setActive('all')}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Retour
            </button>
          )}
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Opérations</p>
            <h1 className="text-[28px] font-semibold mt-1 leading-tight tracking-tight">
              {activeCategory ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full inline-block" style={{ backgroundColor: activeCategory.color }} />
                  <span className="font-heading italic font-normal text-[32px]">{activeCategory.name}</span>
                </span>
              ) : activeBudget ? (
                <span className="font-heading italic font-normal text-[32px]">{activeBudget.name}</span>
              ) : (
                <span className="font-heading italic font-normal text-[32px]">Finances</span>
              )}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Export dropdown */}
          {!activeBudgetId && finances.length > 0 && (
            <div ref={exportRef} className="relative">
              <button
                onClick={() => setExportOpen(v => !v)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-colors"
              >
                <Download className="h-4 w-4" />
                Exporter
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-border bg-popover shadow-2xl p-1 z-50">
                  <button
                    onClick={() => { exportFinancesCSV(finances, categories); setExportOpen(false) }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-foreground/5 transition-colors"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                    CSV
                  </button>
                  <button
                    onClick={() => { exportFinancesPDF(finances, categories, associationName); setExportOpen(false) }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-foreground/5 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-red-400" />
                    PDF
                  </button>
                </div>
              )}
            </div>
          )}
          {canManage && !activeBudgetId && (
            <button
              onClick={() => openAddDialog(activeCategoryId)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nouvelle entrée
            </button>
          )}
        </div>
      </div>

      {/* Controlled add dialog (single instance) */}
      <AddFinanceDialog
        associationId={associationId}
        categories={categories}
        defaultCategoryId={addDialogCategoryId}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={onRefresh}
      />

      <div className="flex-1 overflow-hidden flex">
        {/* ── Left rail ── */}
        <CollapsibleRail>
          <div className="overflow-y-auto h-full p-4 space-y-5">

            {/* Solde global mini */}
            <div className="px-3 py-2 rounded-xl bg-muted/50 border border-border space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Solde net
              </p>
              <p className={cn('text-lg font-bold tabular-nums leading-none', balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground')}>
                {balance >= 0 ? '+' : ''}{fmt(balance)}
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 tabular-nums">+{fmt(totalIncome)}</span>
                <span className="text-border">·</span>
                <span className="text-[10px] text-red-600 dark:text-red-400 tabular-nums">−{fmt(totalExpense)}</span>
              </div>
            </div>

            {/* Vue globale */}
            <div>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Vue</p>
              <nav className="space-y-0.5">
                <RailRow
                  icon={<Inbox className="h-3.5 w-3.5 text-muted-foreground" />}
                  label="Vue d'ensemble"
                  active={active === 'all'}
                  onClick={() => setActive('all')}
                />
              </nav>
            </div>

            {/* Dossiers */}
            <div>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Dossiers</p>
              <nav className="space-y-0.5">
                {categories.map(cat => {
                  const catBalance = finances
                    .filter(f => f.category_id === cat.id)
                    .reduce((s, f) => s + (f.type === 'income' ? f.amount : -f.amount), 0)
                  return (
                    <CategoryRailItem
                      key={cat.id}
                      category={cat}
                      balance={catBalance}
                      active={activeCategoryId === cat.id}
                      canManage={canManage}
                      onSelect={() => setActive({ type: 'category', id: cat.id })}
                      onRename={(name) => handleRenameCategory(cat.id, name)}
                      onRecolor={(color) => handleRecolorCategory(cat.id, color)}
                      onDelete={() => handleDeleteCategory(cat.id)}
                    />
                  )
                })}
                {/* Uncategorized if any */}
                {finances.some(f => !f.category_id) && (
                  <RailRow
                    icon={<FolderOpen className="h-3.5 w-3.5 text-muted-foreground/50" />}
                    label="Sans dossier"
                    active={active === 'all'}
                    onClick={() => setActive('all')}
                    dim
                  />
                )}
              </nav>
              {canManage && (
                <NewCategoryInline onCreate={handleCreateCategory} existingCount={categories.length} />
              )}
            </div>

            {/* Budgets */}
            <div>
              <div className="flex items-center justify-between px-3 pb-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Budgets</p>
                {canManage && <CreateBudgetDialog associationId={associationId} onSuccess={onRefresh} />}
              </div>
              <nav className="space-y-0.5">
                {budgets.length === 0 ? (
                  <p className="px-3 py-1.5 text-xs text-muted-foreground/50 italic font-heading">Aucun budget</p>
                ) : (
                  budgets.map(b => (
                    <RailRow
                      key={b.id}
                      icon={<span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_DOT[b.status] }} />}
                      label={b.name}
                      active={activeBudgetId === b.id}
                      onClick={() => setActive({ type: 'budget', id: b.id })}
                    />
                  ))
                )}
              </nav>
            </div>
          </div>
        </CollapsibleRail>

        {/* ── Right pane ── */}
        <div className="flex-1 overflow-y-auto">
          {activeBudget ? (
            <BudgetDetail
              budget={activeBudget}
              associationId={associationId}
              canManage={canManage}
              onBack={() => setActive('all')}
            />
          ) : activeCategoryId && activeCategory ? (
            <DossierDetailView
              category={activeCategory}
              finances={finances.filter(f => f.category_id === activeCategoryId)}
              canManage={canManage}
              onDelete={handleDeleteEntry}
              onAdd={() => openAddDialog(activeCategoryId)}
            />
          ) : (
            <OverviewView
              finances={finances}
              categories={categories}
              canManage={canManage}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              balance={balance}
              onSelectCategory={(id) => setActive({ type: 'category', id })}
              onAddToCategory={openAddDialog}
              onCreateCategory={handleCreateCategory}
              onRenameCategory={handleRenameCategory}
              onRecolorCategory={handleRecolorCategory}
              onDeleteCategory={handleDeleteCategory}
              onDeleteEntry={handleDeleteEntry}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Overview view ────────────────────────────────────────────────────────────

function OverviewView({
  finances, categories, canManage,
  totalIncome, totalExpense, balance,
  onSelectCategory, onAddToCategory, onCreateCategory,
  onRenameCategory, onRecolorCategory, onDeleteCategory,
  onDeleteEntry,
}: {
  finances: Finance[]
  categories: FinanceCategory[]
  canManage: boolean
  totalIncome: number
  totalExpense: number
  balance: number
  onSelectCategory: (id: string) => void
  onAddToCategory: (categoryId: string | null) => void
  onCreateCategory: (name: string, color: string) => void
  onRenameCategory: (id: string, name: string) => void
  onRecolorCategory: (id: string, color: string) => void
  onDeleteCategory: (id: string) => void
  onDeleteEntry: (id: string) => Promise<void>
}) {
  const uncategorized = finances.filter(f => !f.category_id)
  const recent = [...finances].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)

  return (
    <div className="px-8 py-6 space-y-8">
      {/* Global balance bar */}
      <div className="grid grid-cols-3 gap-4">
        <BalanceTile
          label="Solde net"
          amount={balance}
          sign={balance >= 0 ? '+' : ''}
          variant="balance"
          isNegative={balance < 0}
          subLabel={`${finances.length} entrée${finances.length !== 1 ? 's' : ''}`}
        />
        <BalanceTile
          label="Total recettes"
          amount={totalIncome}
          sign="+"
          variant="income"
          isNegative={false}
          subLabel={`${finances.filter(f => f.type === 'income').length} recette${finances.filter(f => f.type === 'income').length !== 1 ? 's' : ''}`}
        />
        <BalanceTile
          label="Total dépenses"
          amount={totalExpense}
          sign="−"
          variant="expense"
          isNegative={false}
          subLabel={`${finances.filter(f => f.type === 'expense').length} dépense${finances.filter(f => f.type === 'expense').length !== 1 ? 's' : ''}`}
        />
      </div>

      {/* Dossiers grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-[0.15em] text-[10px]">
            Dossiers
          </h2>
          <span className="text-xs text-muted-foreground/50">{categories.length} dossier{categories.length !== 1 ? 's' : ''}</span>
        </div>

        {categories.length === 0 && !canManage && (
          <p className="text-sm text-muted-foreground/60 font-heading italic py-4">
            Aucun dossier. Le président ou le trésorier peut en créer.
          </p>
        )}

        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {categories.map(cat => {
            const catFinances = finances.filter(f => f.category_id === cat.id)
            const catIncome = catFinances.filter(f => f.type === 'income').reduce((s, f) => s + f.amount, 0)
            const catExpense = catFinances.filter(f => f.type === 'expense').reduce((s, f) => s + f.amount, 0)
            const catBalance = catIncome - catExpense
            return (
              <DossierCard
                key={cat.id}
                category={cat}
                income={catIncome}
                expense={catExpense}
                balance={catBalance}
                count={catFinances.length}
                canManage={canManage}
                onClick={() => onSelectCategory(cat.id)}
                onAdd={() => onAddToCategory(cat.id)}
                onRename={(name) => onRenameCategory(cat.id, name)}
                onRecolor={(color) => onRecolorCategory(cat.id, color)}
                onDelete={() => onDeleteCategory(cat.id)}
              />
            )
          })}

          {/* "Sans dossier" card if needed */}
          {uncategorized.length > 0 && (
            <UncategorizedCard
              finances={uncategorized}
              canManage={canManage}
              onAdd={() => onAddToCategory(null)}
            />
          )}

          {/* Empty "create" card for managers */}
          {canManage && (
            <NewDossierCard existingCount={categories.length} onCreate={onCreateCategory} />
          )}
        </div>
      </section>

      {/* Recent transactions */}
      {recent.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">
            Entrées récentes
          </h2>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="divide-y divide-border">
              {recent.map(entry => (
                <TransactionRow
                  key={entry.id}
                  entry={entry}
                  category={categories.find(c => c.id === entry.category_id)}
                  canDelete={canManage}
                  onDelete={() => onDeleteEntry(entry.id)}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

// ─── Balance tile ─────────────────────────────────────────────────────────────

function BalanceTile({ label, amount, sign, variant, isNegative, subLabel }: {
  label: string
  amount: number
  sign: string
  variant: 'balance' | 'income' | 'expense'
  isNegative: boolean
  subLabel: string
}) {
  const topBarColor =
    variant === 'income' ? '#10b981' :
    variant === 'expense' ? '#ef4444' :
    isNegative ? '#ef4444' : '#10b981'

  const amountClass =
    variant === 'income' ? 'text-emerald-600 dark:text-emerald-400' :
    variant === 'expense' ? 'text-red-600 dark:text-red-400' :
    isNegative ? 'text-red-600 dark:text-red-400' : 'text-foreground'

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="h-1 w-full" style={{ backgroundColor: topBarColor }} />
      <div className="p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1.5">{label}</p>
        <p className={cn('text-2xl font-bold tabular-nums leading-none', amountClass)}>
          {sign}{fmt(amount)}
        </p>
        <p className="text-[11px] text-muted-foreground/60 mt-1.5">{subLabel}</p>
      </div>
    </div>
  )
}

// ─── Dossier card ─────────────────────────────────────────────────────────────

function DossierCard({
  category, income, expense, balance, count, canManage,
  onClick, onAdd, onRename, onRecolor, onDelete,
}: {
  category: FinanceCategory
  income: number; expense: number; balance: number; count: number
  canManage: boolean
  onClick: () => void
  onAdd: () => void
  onRename: (name: string) => void
  onRecolor: (color: string) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const [colorOpen, setColorOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const colorRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setName(category.name) }, [category.name])
  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])
  useEffect(() => {
    if (!colorOpen) return
    function onDoc(e: MouseEvent) {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) setColorOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [colorOpen])

  function commitName() {
    const n = name.trim()
    if (n && n !== category.name) onRename(n)
    else setName(category.name)
    setEditing(false)
  }

  const isPositive = balance >= 0
  const total = income + expense
  const incomeRatio = total > 0 ? (income / total) * 100 : 0

  return (
    <div className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:border-border/80 hover:bg-muted/40 transition-all">
      {/* Color top bar */}
      <div className="h-1 w-full" style={{ backgroundColor: category.color }} />

      <div className="p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={() => canManage && setColorOpen(true)}
              className={cn('shrink-0 h-2.5 w-2.5 rounded-full', canManage && 'cursor-pointer hover:scale-125 transition-transform')}
              style={{ backgroundColor: category.color }}
              title={canManage ? 'Changer la couleur' : undefined}
            />
            {editing ? (
              <input
                ref={inputRef}
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={commitName}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); commitName() }
                  if (e.key === 'Escape') { setName(category.name); setEditing(false) }
                }}
                onClick={e => e.stopPropagation()}
                className="flex-1 bg-muted border border-border rounded-lg px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
                maxLength={60}
              />
            ) : (
              <button
                onClick={onClick}
                className="flex-1 text-left text-sm font-semibold truncate hover:text-foreground transition-colors"
              >
                {category.name}
              </button>
            )}
          </div>

          {canManage && !editing && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={e => { e.stopPropagation(); setEditing(true) }}
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete() }}
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-destructive/15 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Balance */}
        <div
          className="cursor-pointer"
          onClick={onClick}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70 mb-1">
            Solde du dossier
          </p>
          <p className={cn('text-3xl font-bold tabular-nums leading-none', isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
            {isPositive ? '+' : '−'}{fmt(Math.abs(balance))}
          </p>
        </div>

        {/* Income / Expense breakdown */}
        <div
          className="grid grid-cols-2 gap-2 cursor-pointer"
          onClick={onClick}
        >
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
            <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium uppercase tracking-wider mb-0.5 opacity-70">Recettes</p>
            <p className="text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">+{fmt(income)}</p>
          </div>
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2">
            <p className="text-[10px] text-red-700 dark:text-red-300 font-medium uppercase tracking-wider mb-0.5 opacity-70">Dépenses</p>
            <p className="text-sm font-semibold tabular-nums text-red-700 dark:text-red-300">−{fmt(expense)}</p>
          </div>
        </div>

        {/* Income/expense ratio bar */}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden" onClick={onClick}>
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${incomeRatio}%` }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onClick}
            className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            {count} entrée{count !== 1 ? 's' : ''}
          </button>
          {canManage && (
            <button
              onClick={e => { e.stopPropagation(); onAdd() }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors border border-border"
            >
              <Plus className="h-3 w-3" />
              Ajouter
            </button>
          )}
        </div>
      </div>

      {/* Color picker popover */}
      {colorOpen && (
        <div
          ref={colorRef}
          className="absolute left-4 top-12 z-20 flex flex-wrap gap-1.5 p-2 rounded-xl border border-border bg-popover/95 backdrop-blur-2xl shadow-xl w-[160px]"
        >
          {COLOR_PRESETS.map(c => (
            <button
              key={c}
              onClick={() => { onRecolor(c); setColorOpen(false) }}
              className={cn('h-6 w-6 rounded-full transition-transform hover:scale-110 ring-1',
                c.toLowerCase() === category.color.toLowerCase() ? 'ring-foreground' : 'ring-border')}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Uncategorized card ───────────────────────────────────────────────────────

function UncategorizedCard({ finances, canManage, onAdd }: {
  finances: Finance[]
  canManage: boolean
  onAdd: () => void
}) {
  const income = finances.filter(f => f.type === 'income').reduce((s, f) => s + f.amount, 0)
  const expense = finances.filter(f => f.type === 'expense').reduce((s, f) => s + f.amount, 0)
  const balance = income - expense

  return (
    <div className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden opacity-70 hover:opacity-100 transition-all">
      <div className="h-1 w-full bg-muted-foreground/20" />
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="text-sm font-medium text-muted-foreground">Sans dossier</span>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider mb-1">Solde</p>
          <p className={cn('text-2xl font-bold tabular-nums', balance >= 0 ? 'text-foreground/70' : 'text-red-600/70 dark:text-red-400/70')}>
            {balance >= 0 ? '+' : '−'}{fmt(Math.abs(balance))}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
            <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium uppercase tracking-wider mb-0.5 opacity-60">Recettes</p>
            <p className="text-xs font-semibold tabular-nums text-emerald-700/70 dark:text-emerald-300/70">+{fmt(income)}</p>
          </div>
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2">
            <p className="text-[10px] text-red-700 dark:text-red-300 font-medium uppercase tracking-wider mb-0.5 opacity-60">Dépenses</p>
            <p className="text-xs font-semibold tabular-nums text-red-700/70 dark:text-red-300/70">−{fmt(expense)}</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground/40">{finances.length} entrée{finances.length !== 1 ? 's' : ''}</span>
          {canManage && (
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors border border-border"
            >
              <Plus className="h-3 w-3" />
              Ajouter
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── New dossier placeholder card ─────────────────────────────────────────────

function NewDossierCard({ existingCount, onCreate }: { existingCount: number; onCreate: (name: string, color: string) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLOR_PRESETS[existingCount % COLOR_PRESETS.length])
  const inputRef = useRef<HTMLInputElement>(null)
  const [, startTransition] = useTransition()

  useEffect(() => { if (open) inputRef.current?.focus() }, [open])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border hover:bg-muted/40 hover:border-border/80 transition-all min-h-[200px] gap-2 text-muted-foreground/50 hover:text-muted-foreground"
      >
        <Plus className="h-6 w-6" />
        <span className="text-sm font-medium">Nouveau dossier</span>
      </button>
    )
  }

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden">
      <div className="h-1 w-full" style={{ backgroundColor: color }} />
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {}}
            className="shrink-0 h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <input
            ref={inputRef}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') { setName(''); setOpen(false) }
            }}
            placeholder="Nom du dossier"
            maxLength={60}
            className="flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground/40"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_PRESETS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn('h-5 w-5 rounded-full transition-transform hover:scale-110 ring-1', c === color ? 'ring-foreground' : 'ring-border')}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => { setName(''); setOpen(false) }}
            className="h-8 px-3 text-xs rounded-lg hover:bg-muted text-muted-foreground transition-colors flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Annuler
          </button>
          <button
            onClick={() => {
              const n = name.trim()
              if (!n) return
              onCreate(n, color)
              setName(''); setOpen(false)
            }}
            className="h-8 px-3 text-xs rounded-lg bg-foreground text-background hover:opacity-90 flex items-center gap-1 font-medium"
          >
            <Check className="h-3 w-3" /> Créer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Dossier detail view ──────────────────────────────────────────────────────

function DossierDetailView({
  category, finances, canManage, onDelete, onAdd,
}: {
  category: FinanceCategory
  finances: Finance[]
  canManage: boolean
  onDelete: (id: string) => Promise<void>
  onAdd: () => void
}) {
  const income = finances.filter(f => f.type === 'income').reduce((s, f) => s + f.amount, 0)
  const expense = finances.filter(f => f.type === 'expense').reduce((s, f) => s + f.amount, 0)
  const balance = income - expense
  const sorted = [...finances].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="px-8 py-6 space-y-6">
      {/* Dossier balance header */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="h-1" style={{ backgroundColor: category.color }} />
        <div className="p-6 grid grid-cols-3 gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1.5">Solde du dossier</p>
            <p className={cn('text-3xl font-bold tabular-nums', balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground')}>
              {balance >= 0 ? '+' : '−'}{fmt(Math.abs(balance))}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400 mb-1.5">Recettes</p>
            <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">+{fmt(income)}</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">{finances.filter(f => f.type === 'income').length} entrée{finances.filter(f => f.type === 'income').length !== 1 ? 's' : ''}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red-600 dark:text-red-400 mb-1.5">Dépenses</p>
            <p className="text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">−{fmt(expense)}</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1">{finances.filter(f => f.type === 'expense').length} entrée{finances.filter(f => f.type === 'expense').length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Add button */}
      {canManage && (
        <div className="flex justify-end">
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-muted hover:bg-muted/80 border border-border px-4 py-2 text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter une entrée
          </button>
        </div>
      )}

      {/* Transaction list */}
      {sorted.length === 0 ? (
        <EmptyState
          variant="finances"
          title="Aucune entrée dans ce dossier"
          description={canManage ? 'Enregistrez une recette ou une dépense.' : undefined}
          action={canManage ? (
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Ajouter la première entrée
            </button>
          ) : undefined}
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[80px_60px_1fr_120px_8px] gap-4 px-5 py-2.5 border-b border-border">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Type</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Libellé</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Montant</span>
            <span />
          </div>
          <div className="divide-y divide-border">
            {sorted.map(entry => (
              <TransactionRow
                key={entry.id}
                entry={entry}
                canDelete={canManage}
                onDelete={() => onDelete(entry.id)}
                compact
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Transaction row ──────────────────────────────────────────────────────────

function TransactionRow({ entry, category, canDelete, onDelete, compact = false }: {
  entry: Finance
  category?: FinanceCategory
  canDelete: boolean
  onDelete: () => void
  compact?: boolean
}) {
  const [deleting, setDeleting] = useState(false)
  const isIncome = entry.type === 'income'

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setDeleting(true)
    await onDelete()
    setDeleting(false)
  }

  if (compact) {
    return (
      <div className="group grid grid-cols-[80px_60px_1fr_120px_28px] gap-4 items-center px-5 py-3 hover:bg-muted/40 transition-colors">
        <span className="text-[11px] tabular-nums text-muted-foreground/70">{fmtShort(entry.date)}</span>
        <span className={cn(
          'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
          isIncome
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
            : 'bg-red-500/10 text-red-700 dark:text-red-300'
        )}>
          {isIncome ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
          {isIncome ? 'Recette' : 'Dépense'}
        </span>
        <div className="min-w-0">
          <p className="text-sm truncate">{entry.label}</p>
          {entry.description && <p className="text-[11px] text-muted-foreground/60 truncate">{entry.description}</p>}
        </div>
        <span className={cn('text-sm font-semibold tabular-nums text-right', isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
          {isIncome ? '+' : '−'}{fmt(entry.amount)}
        </span>
        {canDelete ? (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded-md hover:bg-red-500/20 text-muted-foreground/50 hover:text-red-600 dark:hover:text-red-400 transition-all"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        ) : <span />}
      </div>
    )
  }

  // Non-compact (overview recent list)
  return (
    <div className="group flex items-center gap-4 px-5 py-3.5 hover:bg-muted/40 transition-colors">
      <span className={cn(
        'shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-wide',
        isIncome
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          : 'bg-red-500/10 text-red-700 dark:text-red-300'
      )}>
        {isIncome ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
        {isIncome ? 'Recette' : 'Dépense'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{entry.label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] tabular-nums text-muted-foreground/60">{fmtDate(entry.date)}</span>
          {category && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/60">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: category.color }} />
                {category.name}
              </span>
            </>
          )}
        </div>
      </div>
      <span className={cn('text-sm font-semibold tabular-nums shrink-0', isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
        {isIncome ? '+' : '−'}{fmt(entry.amount)}
      </span>
      {canDelete && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="opacity-0 group-hover:opacity-100 shrink-0 flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-500/20 text-muted-foreground/50 hover:text-red-600 dark:hover:text-red-400 transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

// ─── Rail helpers ─────────────────────────────────────────────────────────────

function RailRow({ icon, label, active, onClick, dim }: {
  icon: React.ReactNode; label: string; active: boolean
  onClick: () => void; dim?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors text-left',
        active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
        dim && 'opacity-60'
      )}
    >
      <span className="shrink-0 flex items-center justify-center w-3.5">{icon}</span>
      <span className="truncate flex-1">{label}</span>
    </button>
  )
}

function CategoryRailItem({ category, balance, active, canManage, onSelect, onRename, onRecolor, onDelete }: {
  category: FinanceCategory; balance: number; active: boolean; canManage: boolean
  onSelect: () => void; onRename: (n: string) => void; onRecolor: (c: string) => void; onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setName(category.name) }, [category.name])
  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  function commit() {
    const n = name.trim()
    if (n && n !== category.name) onRename(n)
    else setName(category.name)
    setEditing(false)
  }

  return (
    <div className={cn(
      'group relative flex items-center gap-2 rounded-lg pl-3 pr-1 py-2 text-sm transition-colors',
      active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
    )}>
      <span className="shrink-0 h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
      {editing ? (
        <input
          ref={inputRef}
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); commit() }
            if (e.key === 'Escape') { setName(category.name); setEditing(false) }
          }}
          className="flex-1 bg-transparent text-sm outline-none border-b border-border pb-0.5"
          maxLength={60}
        />
      ) : (
        <button onClick={onSelect} className="flex-1 truncate text-left">{category.name}</button>
      )}
      {!editing && (
        <span className={cn('text-[10px] tabular-nums shrink-0 mr-1', balance >= 0 ? 'text-emerald-600 dark:text-emerald-400 opacity-60' : 'text-red-600 dark:text-red-400 opacity-60')}>
          {balance >= 0 ? '+' : '−'}{new Intl.NumberFormat('fr-CH', { maximumFractionDigits: 0 }).format(Math.abs(balance))}
        </span>
      )}
      {canManage && !editing && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); setEditing(true) }}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground">
            <Pencil className="h-3 w-3" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete() }}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}

function NewCategoryInline({ onCreate, existingCount }: {
  onCreate: (name: string, color: string) => void; existingCount: number
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLOR_PRESETS[existingCount % COLOR_PRESETS.length])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (open) inputRef.current?.focus() }, [open])

  function commit() {
    const n = name.trim()
    if (!n) { setOpen(false); setName(''); return }
    onCreate(n, color)
    setName(''); setOpen(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="mt-2 w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
        <Plus className="h-3.5 w-3.5" />
        Nouveau dossier
      </button>
    )
  }

  return (
    <div className="mt-2 rounded-lg border border-border bg-muted/50 p-2 space-y-2">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <input
          ref={inputRef}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); commit() }
            if (e.key === 'Escape') { setName(''); setOpen(false) }
          }}
          placeholder="Nom du dossier"
          maxLength={60}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {COLOR_PRESETS.map(c => (
          <button key={c} onClick={() => setColor(c)}
            className={cn('h-4 w-4 rounded-full transition-transform hover:scale-110 ring-1', c === color ? 'ring-foreground' : 'ring-border')}
            style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="flex items-center justify-end gap-1 pt-1">
        <button onClick={() => { setName(''); setOpen(false) }}
          className="h-7 px-2 text-xs rounded-md hover:bg-muted text-muted-foreground transition-colors">
          <X className="h-3 w-3" />
        </button>
        <button onClick={commit}
          className="h-7 px-2 text-xs rounded-md bg-foreground text-background hover:opacity-90 flex items-center gap-1">
          <Check className="h-3 w-3" /> Créer
        </button>
      </div>
    </div>
  )
}
