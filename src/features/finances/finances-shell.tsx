'use client'

import { useState, useMemo, useTransition, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { deleteFinanceEntry } from '@/lib/actions/finances'
import {
  createFinanceCategory,
  updateFinanceCategory,
  deleteFinanceCategory,
} from '@/lib/actions/finance-categories'
import { AddFinanceDialog } from './add-finance-dialog'
import { CreateBudgetDialog } from './create-budget-dialog'
import { BudgetDetail } from './budgets-client'
import type {
  Finance,
  FinanceCategory,
  Role,
  EventBudgetWithLines,
  EventBudgetStatus,
} from '@/types/database'
import {
  Trash2,
  Search,
  Wallet,
  TrendingUp,
  TrendingDown,
  Inbox,
  CalendarDays,
  Plus,
  Pencil,
  Check,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CollapsibleRail } from '@/components/collapsible-rail'

const COLOR_PRESETS = [
  '#60a5fa', '#34d399', '#a78bfa', '#f472b6',
  '#fbbf24', '#f87171', '#94a3b8', '#22d3ee',
]

type ActiveKey =
  | 'all' | 'income' | 'expense'
  | { type: 'category'; id: string }
  | { type: 'budget'; id: string }

function formatAmount(amount: number) {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency', currency: 'CHF', minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('fr-CH', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const STATUS_DOT: Record<EventBudgetStatus, string> = {
  planned: '#60a5fa',
  active: '#34d399',
  closed: '#94a3b8',
}

interface Props {
  finances: Finance[]
  budgets: EventBudgetWithLines[]
  categories: FinanceCategory[]
  associationId: string
  callerRole: Role
}

export function FinancesShell({ finances, budgets, categories, associationId, callerRole }: Props) {
  const router = useRouter()
  const [active, setActive] = useState<ActiveKey>('all')
  const [query, setQuery] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const canManage = ['president', 'treasurer'].includes(callerRole)

  const totalIncome = finances.filter(f => f.type === 'income').reduce((s, f) => s + f.amount, 0)
  const totalExpense = finances.filter(f => f.type === 'expense').reduce((s, f) => s + f.amount, 0)
  const balance = totalIncome - totalExpense
  const incomeCount = finances.filter(f => f.type === 'income').length
  const expenseCount = finances.filter(f => f.type === 'expense').length

  const activeBudgetId = typeof active === 'object' && active.type === 'budget' ? active.id : null
  const activeCategoryId = typeof active === 'object' && active.type === 'category' ? active.id : null
  const activeBudget = activeBudgetId ? budgets.find(b => b.id === activeBudgetId) ?? null : null

  const categoriesById = useMemo(() => {
    const m: Record<string, FinanceCategory> = {}
    for (const c of categories) m[c.id] = c
    return m
  }, [categories])

  const filteredFinances = useMemo(() => {
    if (activeBudgetId) return []
    return finances
      .filter(f => {
        if (active === 'income' && f.type !== 'income') return false
        if (active === 'expense' && f.type !== 'expense') return false
        if (activeCategoryId && f.category_id !== activeCategoryId) return false
        if (!query) return true
        const q = query.toLowerCase()
        return f.label.toLowerCase().includes(q) || (f.description ?? '').toLowerCase().includes(q)
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [finances, active, activeCategoryId, activeBudgetId, query])

  // Default category for the add dialog when filtering by one
  const defaultCategoryId = activeCategoryId ?? null

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setLoadingId(id)
    const result = await deleteFinanceEntry(id, associationId)
    if (result.error) toast.error(result.error)
    else toast.success('Entrée supprimée')
    setLoadingId(null)
  }

  function handleCreateCategory(name: string, color: string) {
    startTransition(async () => {
      const r = await createFinanceCategory(associationId, { name, color })
      if (r.error) toast.error(r.error)
      else {
        toast.success('Rubrique créée')
        if (r.category) setActive({ type: 'category', id: r.category.id })
        router.refresh()
      }
    })
  }

  function handleRenameCategory(id: string, name: string) {
    startTransition(async () => {
      const r = await updateFinanceCategory(id, associationId, { name })
      if (r.error) toast.error(r.error)
      else router.refresh()
    })
  }

  function handleRecolorCategory(id: string, color: string) {
    startTransition(async () => {
      const r = await updateFinanceCategory(id, associationId, { color })
      if (r.error) toast.error(r.error)
      else router.refresh()
    })
  }

  function handleDeleteCategory(id: string) {
    if (!confirm('Supprimer cette rubrique ? Les entrées seront conservées sans rubrique.')) return
    startTransition(async () => {
      const r = await deleteFinanceCategory(id, associationId)
      if (r.error) toast.error(r.error)
      else {
        toast.success('Rubrique supprimée')
        if (activeCategoryId === id) setActive('all')
        router.refresh()
      }
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/6 shrink-0">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Opérations</p>
          <h1 className="text-[28px] font-semibold mt-1 leading-tight tracking-tight">
            <span className="font-heading italic font-normal text-[32px]">Finances</span>
          </h1>
        </div>
        {canManage && !activeBudgetId && (
          <AddFinanceDialog
            associationId={associationId}
            categories={categories}
            defaultCategoryId={defaultCategoryId}
          />
        )}
      </div>

      <div className="flex-1 overflow-hidden flex">
        <CollapsibleRail>
          <div className="overflow-y-auto h-full p-4 space-y-5">

            {/* Registre */}
            <div>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Registre
              </p>
              <nav className="space-y-0.5">
                <RailRow
                  icon={<Inbox className="h-3.5 w-3.5 text-muted-foreground" />}
                  label="Toutes"
                  count={finances.length}
                  active={active === 'all'}
                  onClick={() => setActive('all')}
                />
                <RailRow
                  icon={<TrendingUp className="h-3.5 w-3.5 text-emerald-400/70" />}
                  label="Recettes"
                  count={incomeCount}
                  active={active === 'income'}
                  onClick={() => setActive('income')}
                />
                <RailRow
                  icon={<TrendingDown className="h-3.5 w-3.5 text-red-400/70" />}
                  label="Dépenses"
                  count={expenseCount}
                  active={active === 'expense'}
                  onClick={() => setActive('expense')}
                />
              </nav>
            </div>

            {/* Rubriques */}
            <div>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Rubriques
              </p>
              <nav className="space-y-0.5">
                {categories.map(cat => {
                  const catCount = finances.filter(f => f.category_id === cat.id).length
                  return (
                    <CategoryItem
                      key={cat.id}
                      category={cat}
                      count={catCount}
                      active={activeCategoryId === cat.id}
                      canManage={canManage}
                      onSelect={() => setActive({ type: 'category', id: cat.id })}
                      onRename={(name) => handleRenameCategory(cat.id, name)}
                      onRecolor={(color) => handleRecolorCategory(cat.id, color)}
                      onDelete={() => handleDeleteCategory(cat.id)}
                    />
                  )
                })}
              </nav>
              {canManage && (
                <NewCategoryInline
                  onCreate={handleCreateCategory}
                  existingCount={categories.length}
                />
              )}
            </div>

            {/* Budgets */}
            <div>
              <div className="flex items-center justify-between px-3 pb-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Budgets
                </p>
                {canManage && <CreateBudgetDialog associationId={associationId} />}
              </div>
              <nav className="space-y-0.5">
                {budgets.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-muted-foreground/60 italic font-heading">Aucun budget</p>
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

        {/* Right pane */}
        <div className="flex-1 overflow-y-auto">
          {activeBudget ? (
            <BudgetDetail
              budget={activeBudget}
              associationId={associationId}
              canManage={canManage}
              onBack={() => setActive('all')}
            />
          ) : (
            <div className="px-8 py-6 space-y-6">
              {/* Hero balance */}
              <div className="flex items-baseline justify-between gap-8 pb-6 border-b border-white/6">
                <div>
                  {activeCategoryId && categoriesById[activeCategoryId] && (
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: categoriesById[activeCategoryId].color }}
                      />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {categoriesById[activeCategoryId].name}
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-2">
                    {activeCategoryId ? 'Solde de la rubrique' : 'Solde net'}
                  </p>
                  <p className={cn('text-4xl font-bold tabular-nums tracking-tight', balance < 0 && 'text-red-400')}>
                    {formatAmount(
                      activeCategoryId
                        ? filteredFinances.reduce((s, f) => s + (f.type === 'income' ? f.amount : -f.amount), 0)
                        : balance
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 text-sm tabular-nums">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs">Recettes</span>
                    <span className="font-medium text-emerald-300">+{formatAmount(
                      activeCategoryId
                        ? filteredFinances.filter(f => f.type === 'income').reduce((s, f) => s + f.amount, 0)
                        : totalIncome
                    )}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs">Dépenses</span>
                    <span className="font-medium text-red-400">−{formatAmount(
                      activeCategoryId
                        ? filteredFinances.filter(f => f.type === 'expense').reduce((s, f) => s + f.amount, 0)
                        : totalExpense
                    )}</span>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Rechercher une entrée..."
                  className="w-full rounded-xl border border-white/8 bg-white/[0.03] backdrop-blur-md py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-white/15 focus:border-transparent transition-all"
                />
              </div>

              {/* Card grid */}
              {filteredFinances.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <Wallet className="h-8 w-8 text-muted-foreground/20 mb-4" />
                  <p className="text-sm text-muted-foreground font-heading italic">
                    {query ? 'Aucune entrée ne correspond' : 'Aucune entrée pour l\'instant'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                  {filteredFinances.map(entry => (
                    <FinanceCard
                      key={entry.id}
                      entry={entry}
                      category={entry.category_id ? categoriesById[entry.category_id] : undefined}
                      loading={loadingId === entry.id}
                      canDelete={canManage}
                      onDelete={(e) => handleDelete(entry.id, e)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Rail row ────────────────────────────────────────────────────────────────

function RailRow({ icon, label, count, active, onClick }: {
  icon: React.ReactNode
  label: string
  count?: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors text-left',
        active ? 'bg-white/8 text-foreground' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
      )}
    >
      <span className="shrink-0 flex items-center justify-center w-3.5">{icon}</span>
      <span className="truncate flex-1">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-[10px] tabular-nums text-muted-foreground/60 shrink-0">{count}</span>
      )}
    </button>
  )
}

// ─── Category item (inline rename/recolor/delete) ────────────────────────────

function CategoryItem({ category, count, active, canManage, onSelect, onRename, onRecolor, onDelete }: {
  category: FinanceCategory
  count: number
  active: boolean
  canManage: boolean
  onSelect: () => void
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

  function commit() {
    const n = name.trim()
    if (n && n !== category.name) onRename(n)
    else setName(category.name)
    setEditing(false)
  }

  return (
    <div className={cn(
      'group relative flex items-center gap-2.5 rounded-lg pl-3 pr-1 py-2 text-sm transition-colors',
      active ? 'bg-white/8 text-foreground' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
    )}>
      <button
        onClick={() => canManage && setColorOpen(true)}
        className={cn('shrink-0 h-2 w-2 rounded-full transition-transform', canManage && 'cursor-pointer hover:scale-125')}
        style={{ backgroundColor: category.color }}
        title={canManage ? 'Changer la couleur' : undefined}
      />
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
          className="flex-1 bg-transparent text-sm outline-none border-b border-white/20 pb-0.5"
          maxLength={60}
        />
      ) : (
        <button onClick={onSelect} className="flex-1 truncate text-left">
          {category.name}
        </button>
      )}
      {count > 0 && !editing && (
        <span className="text-[10px] tabular-nums text-muted-foreground/60 shrink-0 mr-1">{count}</span>
      )}
      {canManage && !editing && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); setEditing(true) }}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/10 text-muted-foreground hover:text-foreground"
            title="Renommer"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive"
            title="Supprimer"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
      {colorOpen && (
        <div
          ref={colorRef}
          className="absolute left-2 top-full mt-1 z-20 flex flex-wrap gap-1.5 p-2 rounded-lg border border-white/10 bg-popover/95 backdrop-blur-2xl shadow-xl w-[152px]"
        >
          {COLOR_PRESETS.map(c => (
            <button
              key={c}
              onClick={() => { onRecolor(c); setColorOpen(false) }}
              className={cn(
                'h-5 w-5 rounded-full transition-transform hover:scale-110 ring-1',
                c.toLowerCase() === category.color.toLowerCase() ? 'ring-white' : 'ring-white/15'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── New category inline ──────────────────────────────────────────────────────

function NewCategoryInline({ onCreate, existingCount }: {
  onCreate: (name: string, color: string) => void
  existingCount: number
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
      <button
        onClick={() => setOpen(true)}
        className="mt-2 w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Nouvelle rubrique
      </button>
    )
  }

  return (
    <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] p-2 space-y-2">
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
          placeholder="Nom de la rubrique"
          maxLength={60}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {COLOR_PRESETS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={cn('h-4 w-4 rounded-full transition-transform hover:scale-110 ring-1', c === color ? 'ring-white' : 'ring-white/15')}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="flex items-center justify-end gap-1 pt-1">
        <button onClick={() => { setName(''); setOpen(false) }} className="h-7 px-2 text-xs rounded-md hover:bg-white/5 text-muted-foreground transition-colors">
          <X className="h-3 w-3" />
        </button>
        <button onClick={commit} className="h-7 px-2 text-xs rounded-md bg-foreground text-background hover:opacity-90 flex items-center gap-1">
          <Check className="h-3 w-3" />
          Créer
        </button>
      </div>
    </div>
  )
}

// ─── Finance card ─────────────────────────────────────────────────────────────

function FinanceCard({ entry, category, loading, canDelete, onDelete }: {
  entry: Finance
  category?: FinanceCategory
  loading: boolean
  canDelete: boolean
  onDelete: (e: React.MouseEvent) => void
}) {
  const isIncome = entry.type === 'income'

  return (
    <div className={cn(
      'group relative flex flex-col rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-md overflow-hidden transition-all hover:border-white/15 hover:bg-white/[0.05] hover:-translate-y-0.5',
      loading && 'opacity-40'
    )}>
      <div className={cn(
        'relative h-28 w-full border-b border-white/[0.06] flex items-center justify-center',
        isIncome
          ? 'bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent'
          : 'bg-gradient-to-br from-red-500/15 via-red-500/5 to-transparent'
      )}>
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className={cn(
            'inline-flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md px-2 py-1 text-[10px] uppercase tracking-wider ring-1',
            isIncome ? 'text-emerald-200 ring-emerald-400/20' : 'text-red-200 ring-red-400/20'
          )}>
            {isIncome ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isIncome ? 'Recette' : 'Dépense'}
          </span>
          {category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-md px-2 py-1 text-[10px] ring-1 ring-white/10 text-white/80">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: category.color }} />
              {category.name}
            </span>
          )}
        </div>

        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 backdrop-blur-md ring-1 ring-white/10 opacity-0 group-hover:opacity-100 hover:bg-red-500/30 hover:text-red-200 text-white/80 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}

        <p className={cn(
          'text-3xl font-bold tabular-nums tracking-tight',
          isIncome ? 'text-emerald-100' : 'text-red-100'
        )}>
          {isIncome ? '+' : '−'}{formatAmount(entry.amount)}
        </p>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <p className="text-sm font-medium leading-snug line-clamp-2">{entry.label}</p>
        {entry.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{entry.description}</p>
        )}
        <div className="flex items-center gap-1.5 pt-2 mt-auto border-t border-white/[0.06]">
          <CalendarDays className="h-3 w-3 text-muted-foreground/50 shrink-0" />
          <span className="text-[11px] tabular-nums text-muted-foreground/70">{formatDate(entry.date)}</span>
        </div>
      </div>
    </div>
  )
}
