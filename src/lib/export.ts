'use client'

import type { Finance, FinanceCategory, MembershipWithProfile, Role } from '@/types/database'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAmt(amount: number) {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency', currency: 'CHF', minimumFractionDigits: 2,
  }).format(amount)
}

function fmtDate(iso: string) {
  return new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('fr-CH', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob(['﻿' + content], { type: mime }) // BOM for Excel compatibility
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function escapeCsv(value: string | number | null | undefined): string {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function rowToCsv(cells: (string | number | null | undefined)[]) {
  return cells.map(escapeCsv).join(',')
}

// ─── Finances CSV ─────────────────────────────────────────────────────────────

export function exportFinancesCSV(
  finances: Finance[],
  categories: FinanceCategory[],
) {
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

  const header = rowToCsv(['Date', 'Type', 'Libellé', 'Montant (CHF)', 'Dossier'])
  const rows = [...finances]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(f => rowToCsv([
      fmtDate(f.date),
      f.type === 'income' ? 'Recette' : 'Dépense',
      f.label,
      (f.type === 'income' ? f.amount : -f.amount).toFixed(2),
      f.category_id ? (catMap[f.category_id] ?? '') : '',
    ]))

  const csv = [header, ...rows].join('\r\n')
  triggerDownload(csv, `finances_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8')
}

// ─── Members CSV ──────────────────────────────────────────────────────────────

const ROLE_FR: Record<Role, string> = {
  president: 'Président·e',
  treasurer: 'Trésorier·ère',
  secretary: 'Secrétaire',
  member: 'Membre',
}

export function exportMembersCSV(members: MembershipWithProfile[]) {
  const header = rowToCsv(['Nom', 'Email', 'Rôle', 'Membre depuis'])
  const rows = members.map(m => rowToCsv([
    m.user_profiles.full_name ?? '',
    m.user_profiles.email,
    ROLE_FR[m.role as Role] ?? m.role,
    fmtDate(m.joined_at),
  ]))
  const csv = [header, ...rows].join('\r\n')
  triggerDownload(csv, `membres_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8')
}

// ─── Finances PDF ─────────────────────────────────────────────────────────────

export async function exportFinancesPDF(
  finances: Finance[],
  categories: FinanceCategory[],
  associationName: string,
) {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Rapport Finances', 14, 20)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120)
  doc.text(associationName, 14, 27)
  doc.text(`Exporté le ${fmtDate(new Date().toISOString().slice(0, 10))}`, 14, 32)
  doc.setTextColor(0)

  // Summary
  const totalIncome = finances.filter(f => f.type === 'income').reduce((s, f) => s + f.amount, 0)
  const totalExpense = finances.filter(f => f.type === 'expense').reduce((s, f) => s + f.amount, 0)
  const balance = totalIncome - totalExpense

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Récapitulatif', 14, 42)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Recettes totales : ${fmtAmt(totalIncome)}`, 14, 48)
  doc.text(`Dépenses totales : ${fmtAmt(totalExpense)}`, 14, 54)
  doc.setFont('helvetica', 'bold')
  doc.text(`Solde net : ${balance >= 0 ? '+' : ''}${fmtAmt(balance)}`, 14, 60)
  doc.setFont('helvetica', 'normal')

  // Table
  const sorted = [...finances].sort((a, b) => a.date.localeCompare(b.date))

  autoTable(doc, {
    startY: 68,
    head: [['Date', 'Type', 'Libellé', 'Dossier', 'Montant']],
    body: sorted.map(f => [
      fmtDate(f.date),
      f.type === 'income' ? 'Recette' : 'Dépense',
      f.label,
      f.category_id ? (catMap[f.category_id] ?? '—') : '—',
      (f.type === 'income' ? '+' : '−') + fmtAmt(f.amount),
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 30, 40], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 248, 250] },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 22 },
      2: { cellWidth: 70 },
      3: { cellWidth: 40 },
      4: { cellWidth: 28, halign: 'right' },
    },
  })

  doc.save(`finances_${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ─── Members PDF ──────────────────────────────────────────────────────────────

export async function exportMembersPDF(
  members: MembershipWithProfile[],
  associationName: string,
) {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Liste des membres', 14, 20)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120)
  doc.text(associationName, 14, 27)
  doc.text(`${members.length} membre${members.length > 1 ? 's' : ''} · Exporté le ${fmtDate(new Date().toISOString().slice(0, 10))}`, 14, 32)
  doc.setTextColor(0)

  autoTable(doc, {
    startY: 42,
    head: [['Nom', 'Email', 'Rôle', 'Membre depuis']],
    body: members.map(m => [
      m.user_profiles.full_name ?? '—',
      m.user_profiles.email,
      ROLE_FR[m.role as Role] ?? m.role,
      fmtDate(m.joined_at),
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 30, 40], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 248, 250] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 65 },
      2: { cellWidth: 35 },
      3: { cellWidth: 30 },
    },
  })

  doc.save(`membres_${new Date().toISOString().slice(0, 10)}.pdf`)
}
