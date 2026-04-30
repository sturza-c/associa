'use client'

interface CotisationRow {
  name: string
  email: string
  cotisation: {
    amount_due: number
    amount_paid: number
    paid_at: string | null
    payment_method: string | null
    notes: string | null
  } | null
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function escapeCsv(v: string | number | null | undefined) {
  const s = String(v ?? '')
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
}

function statusLabel(row: CotisationRow) {
  const cot = row.cotisation
  if (!cot) return '—'
  const due = Number(cot.amount_due)
  const paid = Number(cot.amount_paid)
  if (due === 0) return 'Gratuit'
  if (paid >= due) return 'Payé'
  if (paid > 0) return 'Partiel'
  return 'Non payé'
}

export function exportCotisationsCSV(rows: CotisationRow[], year: number, assocName: string) {
  const header = ['Nom', 'Email', 'Montant dû (CHF)', 'Montant payé (CHF)', 'Statut', 'Date paiement', 'Moyen', 'Notes'].map(escapeCsv).join(',')
  const lines = rows.map(r => [
    r.name,
    r.email,
    r.cotisation ? Number(r.cotisation.amount_due).toFixed(2) : '',
    r.cotisation ? Number(r.cotisation.amount_paid).toFixed(2) : '',
    statusLabel(r),
    r.cotisation?.paid_at ? fmtDate(r.cotisation.paid_at) : '',
    r.cotisation?.payment_method ?? '',
    r.cotisation?.notes ?? '',
  ].map(escapeCsv).join(','))

  const csv = [header, ...lines].join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cotisations_${year}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportCotisationsPDF(rows: CotisationRow[], year: number, assocName: string) {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const totalDue = rows.reduce((s, r) => s + (r.cotisation ? Number(r.cotisation.amount_due) : 0), 0)
  const totalPaid = rows.reduce((s, r) => s + (r.cotisation ? Number(r.cotisation.amount_paid) : 0), 0)
  const pct = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0

  const fmt = (n: number) => new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 2 }).format(n)

  doc.setFontSize(18); doc.setFont('helvetica', 'bold')
  doc.text(`Cotisations ${year}`, 14, 20)
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(120)
  doc.text(assocName, 14, 27)
  doc.text(`Exporté le ${fmtDate(new Date().toISOString())} · ${pct}% collecté`, 14, 32)
  doc.setTextColor(0)

  doc.setFontSize(9); doc.setFont('helvetica', 'bold')
  doc.text('Récapitulatif', 14, 42)
  doc.setFont('helvetica', 'normal')
  doc.text(`Total attendu : ${fmt(totalDue)}`, 14, 48)
  doc.text(`Total collecté : ${fmt(totalPaid)}`, 14, 54)
  doc.text(`Solde restant : ${fmt(totalDue - totalPaid)}`, 14, 60)

  autoTable(doc, {
    startY: 68,
    head: [['Nom', 'Email', 'Dû', 'Payé', 'Statut', 'Date paiement']],
    body: rows.map(r => [
      r.name || '—',
      r.email,
      r.cotisation ? fmt(Number(r.cotisation.amount_due)) : '—',
      r.cotisation ? fmt(Number(r.cotisation.amount_paid)) : '—',
      statusLabel(r),
      r.cotisation?.paid_at ? fmtDate(r.cotisation.paid_at) : '—',
    ]),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 30, 40], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 248, 250] },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 55 },
      2: { cellWidth: 22, halign: 'right' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 20 },
      5: { cellWidth: 25 },
    },
  })

  doc.save(`cotisations_${year}_${new Date().toISOString().slice(0, 10)}.pdf`)
}
