'use client'

import { useState, useMemo, useTransition } from 'react'
import { toast } from 'sonner'
import {
  initCotisationYear,
  recordPayment,
  deleteCotisation,
  sendCotisationReminders,
  updateAmountDue,
  addManualPayment,
} from '@/lib/actions/cotisations'
import { exportCotisationsCSV, exportCotisationsPDF } from '@/lib/export-cotisations'
import {
  Plus, ChevronDown, Check, X, Trash2, Send, Download,
  FileSpreadsheet, FileText, Pencil, BadgePercent,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemberProfile {
  full_name: string | null
  email: string
  avatar_url: string | null
}

interface RawMember {
  id: string
  user_id: string
  role: string
  joined_at: string
  user_profiles: MemberProfile | MemberProfile[]
}

interface Cotisation {
  id: string
  membership_id: string | null
  external_name: string | null
  external_email: string | null
  year: number
  amount_due: number
  amount_paid: number
  paid_at: string | null
  payment_method: string | null
  notes: string | null
}

interface MemberRow {
  membershipId: string
  userId: string
  role: string
  name: string
  email: string
  avatarUrl: string | null
  cotisation: Cotisation | null
}

interface Props {
  years: number[]
  activeYear: number
  members: RawMember[]
  cotisations: Cotisation[]
  callerRole: string
  associationId: string
  associationName: string
  onYearChange: (y: number) => void
  onRefresh: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = ['cash', 'virement', 'twint', 'carte', 'autre'] as const
type PaymentMethod = typeof PAYMENT_METHODS[number]

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash', virement: 'Virement', twint: 'Twint', carte: 'Carte', autre: 'Autre',
}

function fmt(amount: number) {
  return new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 2 }).format(amount)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-CH', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getInitials(name: string | null, email: string) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (email[0] ?? '?').toUpperCase()
}

// ─── Init year dialog ─────────────────────────────────────────────────────────

function InitYearDialog({
  associationId,
  existingYears,
  onSuccess,
}: {
  associationId: string
  existingYears: number[]
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())
  const [amount, setAmount] = useState('20')
  const [, start] = useTransition()

  function submit() {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { toast.error('Montant invalide'); return }
    start(async () => {
      const r = await initCotisationYear(associationId, year, amt)
      if (r.error) toast.error(r.error)
      else {
        toast.success(`${r.created} enregistrement${(r.created ?? 0) > 1 ? 's' : ''} créé${(r.created ?? 0) > 1 ? 's' : ''}`)
        setOpen(false)
        onSuccess()
      }
    })
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      <Plus className="h-4 w-4" />
      Initialiser une année
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Initialiser une année</h3>
          <button onClick={() => setOpen(false)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-foreground/8 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Crée un enregistrement de cotisation pour tous les membres actifs.
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Année</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Montant de la cotisation (CHF)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-border px-4 py-2 text-sm hover:bg-foreground/5 transition-colors">
            Annuler
          </button>
          <button onClick={submit} className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Créer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Payment dialog ───────────────────────────────────────────────────────────

function PaymentDialog({
  row,
  associationId,
  onClose,
  onSuccess,
}: {
  row: MemberRow
  associationId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const cot = row.cotisation!
  const [amount, setAmount] = useState(cot.amount_paid > 0 ? String(cot.amount_paid) : String(cot.amount_due))
  const [method, setMethod] = useState<string>(cot.payment_method ?? 'cash')
  const [notes, setNotes] = useState(cot.notes ?? '')
  const [, start] = useTransition()

  function submit() {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt < 0) { toast.error('Montant invalide'); return }
    start(async () => {
      const r = await recordPayment(cot.id, associationId, amt, method, notes)
      if (r.error) toast.error(r.error)
      else { toast.success('Paiement enregistré'); onClose(); onSuccess() }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Enregistrer un paiement</h3>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-foreground/8 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-foreground/5">
          <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full bg-foreground/10 text-xs font-semibold">
            {getInitials(row.name, row.email)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{row.name || row.email}</p>
            <p className="text-xs text-muted-foreground truncate">{row.email}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Montant payé (CHF)</label>
            <input
              type="number" step="0.01" min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Dû : {fmt(cot.amount_due)}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Moyen de paiement</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              {PAYMENT_METHODS.map(m => (
                <option key={m} value={m}>{METHOD_LABELS[m]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes (optionnel)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="ex. reçu #12"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border px-4 py-2 text-sm hover:bg-foreground/5 transition-colors">
            Annuler
          </button>
          <button onClick={submit} className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Manual payment dialog ────────────────────────────────────────────────────

function ManualPaymentDialog({
  members,
  associationId,
  defaultYear,
  onSuccess,
}: {
  members: RawMember[]
  associationId: string
  defaultYear: number
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'member' | 'external'>('member')
  const [membershipId, setMembershipId] = useState('')
  const [externalName, setExternalName] = useState('')
  const [externalEmail, setExternalEmail] = useState('')
  const [year, setYear] = useState(defaultYear)
  const [amountDue, setAmountDue] = useState('20')
  const [amountPaid, setAmountPaid] = useState('20')
  const [method, setMethod] = useState<string>('cash')
  const [notes, setNotes] = useState('')
  const [, start] = useTransition()

  function reset() {
    setMode('member'); setMembershipId(''); setExternalName(''); setExternalEmail('')
    setYear(defaultYear); setAmountDue('20'); setAmountPaid('20'); setMethod('cash'); setNotes('')
  }

  function submit() {
    if (mode === 'member' && !membershipId) { toast.error('Sélectionner un membre'); return }
    if (mode === 'external' && !externalName.trim()) { toast.error('Le nom est requis'); return }
    const due = parseFloat(amountDue)
    const paid = parseFloat(amountPaid)
    if (isNaN(due) || due < 0) { toast.error('Montant dû invalide'); return }
    if (isNaN(paid) || paid < 0) { toast.error('Montant payé invalide'); return }
    start(async () => {
      const r = await addManualPayment(
        associationId,
        mode === 'member' ? membershipId : null,
        mode === 'external' ? externalName.trim() : null,
        mode === 'external' ? externalEmail.trim() || null : null,
        year, due, paid, method, notes,
      )
      if (r.error) toast.error(r.error)
      else { toast.success('Paiement enregistré'); setOpen(false); reset(); onSuccess() }
    })
  }

  const memberRows = members.map(m => {
    const profile = Array.isArray(m.user_profiles) ? m.user_profiles[0] : m.user_profiles
    return { id: m.id, name: profile?.full_name ?? '', email: profile?.email ?? '' }
  })

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-colors"
    >
      <Plus className="h-4 w-4" />
      Saisie manuelle
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Saisie manuelle</h3>
          <button onClick={() => setOpen(false)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-foreground/8 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-background/50 p-1">
          <button
            type="button"
            onClick={() => setMode('member')}
            className={cn(
              'flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors',
              mode === 'member' ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Membre Associa
          </button>
          <button
            type="button"
            onClick={() => setMode('external')}
            className={cn(
              'flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors',
              mode === 'external' ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Personne externe
          </button>
        </div>

        <div className="space-y-3">
          {mode === 'member' ? (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Membre</label>
              <select
                value={membershipId}
                onChange={e => setMembershipId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="">— Sélectionner —</option>
                {memberRows.map(m => (
                  <option key={m.id} value={m.id}>{m.name || m.email}</option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nom <span className="text-muted-foreground/60 font-normal">(requis)</span></label>
                <input
                  type="text"
                  value={externalName}
                  onChange={e => setExternalName(e.target.value)}
                  placeholder="Ex: Jean Dupont"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email <span className="text-muted-foreground/60 font-normal">(optionnel)</span></label>
                <input
                  type="email"
                  value={externalEmail}
                  onChange={e => setExternalEmail(e.target.value)}
                  placeholder="jean@exemple.ch"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground">Année</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Montant dû (CHF)</label>
              <input
                type="number" step="0.01" min="0"
                value={amountDue}
                onChange={e => setAmountDue(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Montant payé (CHF)</label>
              <input
                type="number" step="0.01" min="0"
                value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Moyen de paiement</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              {PAYMENT_METHODS.map(m => (
                <option key={m} value={m}>{METHOD_LABELS[m]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes (optionnel)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="ex. reçu #12"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-border px-4 py-2 text-sm hover:bg-foreground/5 transition-colors">
            Annuler
          </button>
          <button onClick={submit} className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main client ──────────────────────────────────────────────────────────────

export function CotisationsClient({
  years, activeYear, members, cotisations, callerRole,
  associationId, associationName, onYearChange, onRefresh,
}: Props) {
  const canManage = ['president', 'treasurer', 'secretary'].includes(callerRole)
  const [paymentTarget, setPaymentTarget] = useState<MemberRow | null>(null)
  const [editAmountId, setEditAmountId] = useState<string | null>(null)
  const [editAmountVal, setEditAmountVal] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const [sendingReminders, setSendingReminders] = useState(false)
  const [, start] = useTransition()

  const cotMap = useMemo(() =>
    Object.fromEntries(
      cotisations.filter(c => c.membership_id).map(c => [c.membership_id!, c])
    ),
    [cotisations]
  )

  const rows: MemberRow[] = useMemo(() =>
    members.map(m => {
      const profile = Array.isArray(m.user_profiles) ? m.user_profiles[0] : m.user_profiles
      return {
        membershipId: m.id,
        userId: m.user_id,
        role: m.role,
        name: profile?.full_name ?? '',
        email: profile?.email ?? '',
        avatarUrl: profile?.avatar_url ?? null,
        cotisation: cotMap[m.id] ?? null,
      }
    }),
    [members, cotMap]
  )

  // External cotisations (no membership_id)
  const externalRows = useMemo(() =>
    cotisations.filter(c => !c.membership_id),
    [cotisations]
  )

  const totalDue = rows.reduce((s, r) => s + (r.cotisation ? Number(r.cotisation.amount_due) : 0), 0)
    + externalRows.reduce((s, c) => s + Number(c.amount_due), 0)
  const totalPaid = rows.reduce((s, r) => s + (r.cotisation ? Number(r.cotisation.amount_paid) : 0), 0)
    + externalRows.reduce((s, c) => s + Number(c.amount_paid), 0)
  const paidCount = rows.filter(r => r.cotisation && Number(r.cotisation.amount_paid) >= Number(r.cotisation.amount_due) && Number(r.cotisation.amount_due) > 0).length
    + externalRows.filter(c => Number(c.amount_paid) >= Number(c.amount_due) && Number(c.amount_due) > 0).length
  const unpaidCount = rows.filter(r => r.cotisation && Number(r.cotisation.amount_paid) < Number(r.cotisation.amount_due)).length
    + externalRows.filter(c => Number(c.amount_paid) < Number(c.amount_due)).length

  const hasCotisations = cotisations.length > 0

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet enregistrement ?')) return
    const r = await deleteCotisation(id, associationId)
    if (r.error) toast.error(r.error)
    else { toast.success('Supprimé'); onRefresh() }
  }

  async function handleSendReminders() {
    setSendingReminders(true)
    const r = await sendCotisationReminders(associationId, activeYear)
    setSendingReminders(false)
    if (r.error) toast.error(r.error)
    else toast.success(r.message ?? 'Rappels envoyés')
  }

  function startEditAmount(row: MemberRow) {
    setEditAmountId(row.membershipId)
    setEditAmountVal(String(row.cotisation?.amount_due ?? ''))
  }

  function saveAmount(row: MemberRow) {
    const amt = parseFloat(editAmountVal)
    if (isNaN(amt) || amt < 0) { toast.error('Montant invalide'); return }
    start(async () => {
      const r = await updateAmountDue(row.cotisation!.id, associationId, amt)
      if (r.error) toast.error(r.error)
      else { setEditAmountId(null); onRefresh() }
    })
  }

  function statusBadge(row: MemberRow) {
    const cot = row.cotisation
    if (!cot) return <span className="text-[10px] text-muted-foreground/50 italic">—</span>
    const due = Number(cot.amount_due)
    const paid = Number(cot.amount_paid)
    if (due === 0) return <span className="text-[10px] text-muted-foreground italic">Gratuit</span>
    if (paid >= due) return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 ring-1 ring-emerald-400/25 rounded-full px-2 py-0.5">
        <Check className="h-2.5 w-2.5" /> Payé
      </span>
    )
    if (paid > 0) return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-400/10 ring-1 ring-amber-400/25 rounded-full px-2 py-0.5">
        Partiel
      </span>
    )
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-400/10 ring-1 ring-red-400/25 rounded-full px-2 py-0.5">
        Non payé
      </span>
    )
  }

  const currentYear = new Date().getFullYear()
  const yearOptions = [...new Set([...years, currentYear, currentYear + 1])].sort((a, b) => b - a)

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border shrink-0 gap-4">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Pilotage</p>
          <h1 className="text-[28px] font-semibold mt-1 leading-tight tracking-tight">
            <span className="font-heading italic font-normal text-[32px]">Cotisations</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Year selector */}
          <div className="relative">
            <select
              value={activeYear}
              onChange={e => onYearChange(parseInt(e.target.value))}
              className="appearance-none rounded-xl border border-border bg-background/60 px-3 py-2 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring/30 cursor-pointer"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Export */}
          {hasCotisations && (
            <div className="relative">
              <button
                onClick={() => setExportOpen(v => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-colors"
              >
                <Download className="h-4 w-4" />
                Exporter
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-border bg-popover shadow-2xl p-1 z-50">
                  <button
                    onClick={() => { exportCotisationsCSV(rows, activeYear, associationName); setExportOpen(false) }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-foreground/5 transition-colors"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-500" /> CSV
                  </button>
                  <button
                    onClick={() => { exportCotisationsPDF(rows, activeYear, associationName); setExportOpen(false) }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-foreground/5 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-red-400" /> PDF
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Send reminders */}
          {canManage && hasCotisations && unpaidCount > 0 && (
            <button
              onClick={handleSendReminders}
              disabled={sendingReminders}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {sendingReminders ? 'Envoi…' : `Rappel (${unpaidCount})`}
            </button>
          )}

          {/* Manual entry */}
          {canManage && (
            <ManualPaymentDialog
              members={members}
              associationId={associationId}
              defaultYear={activeYear}
              onSuccess={onRefresh}
            />
          )}

          {/* Init year */}
          {canManage && (
            <InitYearDialog
              associationId={associationId}
              existingYears={years}
              onSuccess={onRefresh}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">

        {/* Stats */}
        {hasCotisations && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Membres', value: rows.length.toString(), sub: 'actifs', color: '' },
              { label: 'Payé', value: fmt(totalPaid), sub: `${paidCount} membre${paidCount !== 1 ? 's' : ''}`, color: 'text-emerald-400' },
              { label: 'En attente', value: fmt(totalDue - totalPaid), sub: `${unpaidCount} membre${unpaidCount !== 1 ? 's' : ''}`, color: unpaidCount > 0 ? 'text-red-400' : '' },
              { label: 'Total attendu', value: fmt(totalDue), sub: activeYear.toString(), color: '' },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl border border-border bg-card p-4 backdrop-blur-md">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</p>
                <p className={cn('text-xl font-bold tabular-nums leading-none mt-2', stat.color)}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        {!hasCotisations ? (
          <div className="rounded-2xl border border-dashed border-border flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-2xl bg-foreground/5 flex items-center justify-center mb-4">
              <BadgePercent className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Aucune cotisation pour {activeYear}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {canManage ? 'Cliquez sur "Initialiser une année" pour créer les enregistrements.' : 'Le bureau n\'a pas encore créé les cotisations pour cette année.'}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card backdrop-blur-md overflow-hidden">
            {/* Progress bar */}
            <div className="px-6 py-3 border-b border-border flex items-center gap-4">
              <div className="flex-1 h-1.5 rounded-full bg-foreground/8 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all"
                  style={{ width: `${totalDue > 0 ? Math.min(100, (totalPaid / totalDue) * 100) : 0}%` }}
                />
              </div>
              <span className="text-xs tabular-nums text-muted-foreground shrink-0">
                {totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0}% collecté
              </span>
            </div>

            {/* Header row */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-2 border-b border-border bg-foreground/[0.02]">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Membre</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground w-24 text-right">Dû</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground w-24 text-right">Payé</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground w-20 text-center">Statut</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground w-20 text-center">Actions</p>
            </div>

            <div className="divide-y divide-border">
              {rows.map(row => {
                const cot = row.cotisation
                const isEditing = editAmountId === row.membershipId
                return (
                  <div key={row.membershipId} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-3.5 items-center hover:bg-foreground/[0.02] transition-colors">
                    {/* Member */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full bg-foreground/10 text-xs font-semibold ring-1 ring-border">
                        {getInitials(row.name, row.email)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{row.name || row.email}</p>
                        <p className="text-xs text-muted-foreground truncate">{row.email}</p>
                      </div>
                    </div>

                    {/* Amount due */}
                    <div className="w-24 flex items-center justify-end gap-1">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number" step="0.01" min="0"
                            value={editAmountVal}
                            onChange={e => setEditAmountVal(e.target.value)}
                            className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-ring/30"
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') saveAmount(row); if (e.key === 'Escape') setEditAmountId(null) }}
                          />
                          <button onClick={() => saveAmount(row)} className="h-5 w-5 flex items-center justify-center text-emerald-400 hover:text-emerald-300">
                            <Check className="h-3 w-3" />
                          </button>
                          <button onClick={() => setEditAmountId(null)} className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm tabular-nums">{cot ? fmt(Number(cot.amount_due)) : '—'}</span>
                          {canManage && cot && (
                            <button onClick={() => startEditAmount(row)} className="opacity-0 hover:opacity-100 group-hover:opacity-100 h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-opacity ml-1">
                              <Pencil className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {/* Amount paid */}
                    <div className="w-24 text-right">
                      {cot ? (
                        <div>
                          <span className={cn('text-sm tabular-nums font-medium', Number(cot.amount_paid) >= Number(cot.amount_due) && Number(cot.amount_due) > 0 ? 'text-emerald-400' : '')}>
                            {fmt(Number(cot.amount_paid))}
                          </span>
                          {cot.paid_at && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">{fmtDate(cot.paid_at)}</p>
                          )}
                        </div>
                      ) : <span className="text-sm text-muted-foreground/50">—</span>}
                    </div>

                    {/* Status */}
                    <div className="w-20 flex justify-center">{statusBadge(row)}</div>

                    {/* Actions */}
                    <div className="w-20 flex items-center justify-center gap-1">
                      {canManage && cot && (
                        <>
                          <button
                            onClick={() => setPaymentTarget(row)}
                            title="Enregistrer un paiement"
                            className="h-7 px-2 text-xs rounded-lg border border-border hover:bg-foreground/5 transition-colors"
                          >
                            Payer
                          </button>
                          <button
                            onClick={() => handleDelete(cot.id)}
                            title="Supprimer"
                            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* External cotisations */}
              {externalRows.map(cot => {
                const due = Number(cot.amount_due)
                const paid = Number(cot.amount_paid)
                const isPaid = paid >= due && due > 0
                return (
                  <div key={cot.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-3.5 items-center hover:bg-foreground/[0.02] transition-colors">
                    {/* External member */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full bg-foreground/10 text-xs font-semibold ring-1 ring-border">
                        {getInitials(cot.external_name, cot.external_email ?? '?')}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium truncate">{cot.external_name}</p>
                          <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground bg-foreground/8 rounded-full px-1.5 py-0.5">Externe</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{cot.external_email ?? '—'}</p>
                      </div>
                    </div>

                    {/* Amount due */}
                    <div className="w-24 text-right">
                      <span className="text-sm tabular-nums">{fmt(due)}</span>
                    </div>

                    {/* Amount paid */}
                    <div className="w-24 text-right">
                      <span className={cn('text-sm tabular-nums font-medium', isPaid ? 'text-emerald-400' : '')}>
                        {fmt(paid)}
                      </span>
                      {cot.paid_at && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{fmtDate(cot.paid_at)}</p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="w-20 flex justify-center">
                      {due === 0
                        ? <span className="text-[10px] text-muted-foreground italic">Gratuit</span>
                        : isPaid
                          ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 ring-1 ring-emerald-400/25 rounded-full px-2 py-0.5"><Check className="h-2.5 w-2.5" /> Payé</span>
                          : paid > 0
                            ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-400/10 ring-1 ring-amber-400/25 rounded-full px-2 py-0.5">Partiel</span>
                            : <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-400/10 ring-1 ring-red-400/25 rounded-full px-2 py-0.5">Non payé</span>
                      }
                    </div>

                    {/* Actions */}
                    <div className="w-20 flex items-center justify-center gap-1">
                      {canManage && (
                        <button
                          onClick={() => handleDelete(cot.id)}
                          title="Supprimer"
                          className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Payment dialog */}
      {paymentTarget && (
        <PaymentDialog
          row={paymentTarget}
          associationId={associationId}
          onClose={() => setPaymentTarget(null)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  )
}
