'use client'

import { useState } from 'react'
import {
  LayoutDashboard, Users, CheckSquare, FileText, Wallet,
  CalendarDays, MessageSquare, BadgePercent, NotebookPen,
  TrendingUp, TrendingDown, Calendar, Circle, CheckCircle2,
  ChevronRight, Search, MoreHorizontal, Send, Paperclip,
  Folder, FolderOpen, FileText as FileIcon, Plus,
  ChevronsLeft, Sun, Moon, Settings, LogOut, ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Accent ────────────────────────────────────────────────────────────────────
const ACCENT = '#7c3aed'
const hex = (opacity: number) => ACCENT + Math.round(opacity * 255).toString(16).padStart(2, '0')

// ── Nav ───────────────────────────────────────────────────────────────────────
type NavId = 'dashboard' | 'members' | 'cotisations' | 'tasks' | 'events' | 'finances' | 'messages' | 'documents' | 'notes'

const NAV_PILOTAGE: { id: NavId; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard',    label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'members',      label: 'Membres',          icon: Users },
  { id: 'cotisations',  label: 'Cotisations',       icon: BadgePercent },
]
const NAV_OPS: { id: NavId; label: string; icon: React.ElementType }[] = [
  { id: 'tasks',      label: 'Tâches',      icon: CheckSquare },
  { id: 'events',     label: 'Événements',  icon: CalendarDays },
  { id: 'documents',  label: 'Documents',   icon: FileText },
  { id: 'finances',   label: 'Finances',    icon: Wallet },
  { id: 'messages',   label: 'Messages',    icon: MessageSquare },
  { id: 'notes',      label: 'Notes',       icon: NotebookPen },
]

// ── Demo Data ─────────────────────────────────────────────────────────────────

const MEMBERS = [
  { id: 1, name: 'Léa Rousseau',   email: 'lea.rousseau@aec.ch',   role: 'president', joined: 'Sep 2025', avatar: 'LR' },
  { id: 2, name: 'Maxime Bernard', email: 'maxime.bernard@aec.ch', role: 'secretary', joined: 'Sep 2025', avatar: 'MB' },
  { id: 3, name: 'Chloé Martin',   email: 'chloe.martin@aec.ch',   role: 'treasurer', joined: 'Sep 2025', avatar: 'CM' },
  { id: 4, name: 'Antoine Dupont', email: 'antoine.dupont@aec.ch', role: 'member',    joined: 'Oct 2025', avatar: 'AD' },
  { id: 5, name: 'Inès Lefèvre',   email: 'ines.lefevre@aec.ch',   role: 'member',    joined: 'Oct 2025', avatar: 'IL' },
  { id: 6, name: 'Thomas Petit',   email: 'thomas.petit@aec.ch',   role: 'member',    joined: 'Nov 2025', avatar: 'TP' },
  { id: 7, name: 'Camille Durand', email: 'camille.durand@aec.ch', role: 'member',    joined: 'Nov 2025', avatar: 'CD' },
]

const ROLE_STYLES: Record<string, { badge: string; label: string }> = {
  president: { badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/25', label: 'Président·e' },
  secretary: { badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-300 ring-1 ring-blue-500/25', label: 'Secrétaire' },
  treasurer: { badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 ring-1 ring-emerald-500/25', label: 'Trésorier·ère' },
  member:    { badge: 'bg-foreground/5 text-muted-foreground ring-1 ring-foreground/10', label: 'Membre' },
}

const TASKS_GROUPS = [
  {
    id: 1, name: 'Séances de lecture', color: '#7c3aed',
    tasks: [
      { id: 1, title: "Commander 8 ex. de 'Fahrenheit 451'", priority: 'high',   status: 'todo',        assignee: 'CM', due: '18 mai' },
      { id: 2, title: 'Organiser le vote pour le livre de juillet', priority: 'medium', status: 'todo', assignee: 'AD', due: '30 mai' },
      { id: 3, title: "Commander les livres pour L'Étranger",    priority: 'high',   status: 'done',    assignee: 'CM', due: '10 mai' },
      { id: 4, title: 'Préparer les questions de discussion',    priority: 'medium', status: 'done',    assignee: 'LR', due: '15 mai' },
    ],
  },
  {
    id: 2, name: 'Administration', color: '#0ea5e9',
    tasks: [
      { id: 5, title: 'Réserver la salle pour juin',          priority: 'high',   status: 'todo',        assignee: 'MB', due: '20 mai' },
      { id: 6, title: 'Envoyer les convocations AG',           priority: 'high',   status: 'in_progress', assignee: 'MB', due: '25 mai' },
      { id: 7, title: "Préparer l'ordre du jour de l'AG",     priority: 'medium', status: 'in_progress', assignee: 'LR', due: '10 juin' },
      { id: 8, title: 'Mettre à jour la liste des membres',   priority: 'low',    status: 'todo',        assignee: 'MB', due: null },
      { id: 9, title: 'Rédiger le CR de la soirée Misérables',priority: 'medium', status: 'done',        assignee: 'MB', due: '1 mar' },
    ],
  },
]

const EVENTS = [
  { id: 1, name: 'Discussion : Le Mythe de Sisyphe', date: '15 jan. 2026', time: '18h30–20h30', location: 'Bibliothèque univ., salle 204', status: 'done',    participants: 5 },
  { id: 2, name: "Soirée littéraire : Les Misérables", date: '20 fév. 2026', time: '19h00–21h00', location: 'Café des Étudiants', status: 'done',    participants: 5 },
  { id: 3, name: "Atelier d'écriture créative",         date: '10 mar. 2026', time: '17h00–19h00', location: 'Salle B102',        status: 'done',    participants: 5 },
  { id: 4, name: "Café littéraire : L'Étranger",        date: '22 mai 2026',  time: '18h30–20h30', location: 'Salle B204',        status: 'planned', participants: 7 },
  { id: 5, name: 'Assemblée Générale 2026',              date: '15 juin 2026', time: '17h00–19h00', location: 'Amphithéâtre A1',  status: 'planned', participants: 7 },
]

const EVENT_STATUS: Record<string, { label: string; classes: string }> = {
  done:    { label: 'Terminé',  classes: 'bg-muted text-muted-foreground ring-1 ring-border' },
  planned: { label: 'Planifié', classes: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20' },
  active:  { label: 'En cours', classes: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20' },
}

const TRANSACTIONS = [
  { id: 1,  type: 'income',  amount: 7710,   label: 'Cotisations annuelles 2025-2026 (257 membres × 30 CHF)', date: '30 sep. 2025', cat: 'Cotisations',  catColor: '#10b981' },
  { id: 2,  type: 'income',  amount: 3000,   label: 'Subvention Université — fonctionnement annuel',         date: '15 sep. 2025', cat: 'Subventions',  catColor: '#3b82f6' },
  { id: 3,  type: 'income',  amount: 1500,   label: 'Subvention Faculté des Lettres',                        date: '1 oct. 2025',  cat: 'Subventions',  catColor: '#3b82f6' },
  { id: 4,  type: 'income',  amount: 500,    label: 'Don — Fondation Culturelle Étudiante',                  date: '20 nov. 2025', cat: 'Subventions',  catColor: '#3b82f6' },
  { id: 5,  type: 'income',  amount: 385,    label: 'Vente livres lus (déstockage annuel)',                  date: '10 déc. 2025', cat: 'Événements',   catColor: '#f59e0b' },
  { id: 6,  type: 'income',  amount: 240,    label: "Inscriptions atelier écriture (24 × 10 CHF)",           date: '5 mar. 2026',  cat: 'Événements',   catColor: '#f59e0b' },
  { id: 7,  type: 'expense', amount: 420,    label: 'Location salles — semestre automne 2025',               date: '10 sep. 2025', cat: 'Événements',   catColor: '#f59e0b' },
  { id: 8,  type: 'expense', amount: 420,    label: 'Location salles — semestre printemps 2026',             date: '1 fév. 2026',  cat: 'Événements',   catColor: '#f59e0b' },
  { id: 9,  type: 'expense', amount: 72,     label: "Achat livres : Le Mythe de Sisyphe (8 ex.)",            date: '20 déc. 2025', cat: 'Achats',       catColor: '#ef4444' },
  { id: 10, type: 'expense', amount: 48,     label: "Achat livres : Les Misérables (6 ex.)",                 date: '28 jan. 2026', cat: 'Achats',       catColor: '#ef4444' },
  { id: 11, type: 'expense', amount: 64,     label: "Achat livres : L'Étranger (8 ex.)",                    date: '30 avr. 2026', cat: 'Achats',       catColor: '#ef4444' },
  { id: 12, type: 'expense', amount: 85,     label: 'Abonnement outils numériques (Notion, Canva Pro)',      date: '1 sep. 2025',  cat: 'Achats',       catColor: '#ef4444' },
]

const CONVERSATIONS = [
  {
    id: 1, title: 'Choix du livre pour juin', participants: ['LR','MB','CM','AD','IL'],
    messages: [
      { id: 1, sender: 'LR', name: 'Léa Rousseau',   time: '28 avr. · 10h15', text: "Bonjour à tous ! On doit choisir notre livre pour juin. J'hésite entre Fahrenheit 451 de Bradbury et 1984 d'Orwell. Vous avez une préférence ? 🤔" },
      { id: 2, sender: 'AD', name: 'Antoine Dupont',  time: '28 avr. · 11h02', text: "Je vote pour Fahrenheit 451 ! Plus court et très actuel avec les questions de censure sur les réseaux." },
      { id: 3, sender: 'CM', name: 'Chloé Martin',    time: '28 avr. · 11h45', text: "1984 pour moi. Un classique incontournable et le parallèle avec aujourd'hui est saisissant. Mais Bradbury c'est bien aussi..." },
      { id: 4, sender: 'MB', name: 'Maxime Bernard',  time: '29 avr. · 09h30', text: "Fahrenheit 451 ! Et si on invitait quelqu'un de la fac de lettres pour animer la discussion ?" },
      { id: 5, sender: 'IL', name: 'Inès Lefèvre',    time: '29 avr. · 10h15', text: "Bonne idée ! Je peux contacter le prof Moreau. Je suis pour Fahrenheit 451 aussi 🙋" },
      { id: 6, sender: 'LR', name: 'Léa Rousseau',   time: '30 avr. · 14h00', text: "Super ! On vote donc pour Fahrenheit 451. Inès, tu te charges du contact avec le prof Moreau ?" },
      { id: 7, sender: 'CM', name: 'Chloé Martin',    time: '1 mai · 08h45',  text: "Je vais chercher le meilleur prix pour les livres. Combien d'exemplaires ? 8 comme d'habitude ?" },
      { id: 8, sender: 'LR', name: 'Léa Rousseau',   time: '3 mai · 16h45',  text: "Oui, 8 exemplaires. Merci Chloé !" },
    ],
  },
  {
    id: 2, title: 'Organisation AG 2026', participants: ['LR','MB','CM','TP'],
    messages: [
      { id: 9,  sender: 'LR', name: 'Léa Rousseau',  time: '1 mai · 09h15',  text: "L'AG approche ! Maxime tu as réservé l'amphi A1 ? Et Chloé, le rapport financier sera prêt quand ?" },
      { id: 10, sender: 'MB', name: 'Maxime Bernard', time: '1 mai · 10h30',  text: "Réservé ! Amphi A1, 15 juin 17h-19h. J'ai aussi envoyé les convocations ce matin." },
      { id: 11, sender: 'CM', name: 'Chloé Martin',   time: '1 mai · 11h00',  text: "Le rapport sera prêt pour le 10 juin. Avec 257 membres et +11 900 CHF de bilan, on a de belles choses à présenter 😊" },
      { id: 12, sender: 'TP', name: 'Thomas Petit',   time: '2 mai · 14h20',  text: "Je peux aider pour le buffet ! Ma coloc a un grand appart, on pourrait y faire l'after si vous voulez." },
      { id: 13, sender: 'LR', name: 'Léa Rousseau',  time: '3 mai · 09h00',  text: "Super idée Thomas ! On fait l'AG à l'amphi et l'after chez toi. N'oublie pas les bulletins de vote Maxime." },
      { id: 14, sender: 'MB', name: 'Maxime Bernard', time: '10 mai · 11h20', text: "Sur le coup. Pour les candidatures au bureau, qui se représente à part Léa ?" },
    ],
  },
]

const DOCUMENT_FOLDERS = [
  {
    id: 1, name: 'Administratif', color: '#3b82f6',
    docs: [
      { name: "Statuts de l'AEC.pdf",       size: '142 Ko', date: 'Sep 2025' },
      { name: 'Règlement intérieur.pdf',     size: '85 Ko',  date: 'Sep 2025' },
      { name: 'Charte des membres.pdf',      size: '61 Ko',  date: 'Sep 2025' },
    ],
  },
  {
    id: 2, name: 'Comptes-rendus', color: '#10b981',
    docs: [
      { name: 'PV Assemblée Générale 2025.pdf', size: '210 Ko', date: 'Juin 2025' },
      { name: 'CR Réunion — Janvier 2026.pdf',  size: '77 Ko',  date: 'Jan 2026' },
      { name: 'CR Réunion — Février 2026.pdf',  size: '90 Ko',  date: 'Fév 2026' },
      { name: 'CR Réunion — Mars 2026.pdf',     size: '67 Ko',  date: 'Mar 2026' },
    ],
  },
  {
    id: 3, name: 'Ressources', color: '#7c3aed',
    docs: [
      { name: 'Liste livres lus 2024-2025.pdf',     size: '33 Ko',  date: 'Sep 2025' },
      { name: 'Guide animation club lecture.pdf',   size: '153 Ko', date: 'Sep 2025' },
      { name: 'Planning séances mai-juin 2026.pdf', size: '41 Ko',  date: 'Avr 2026' },
    ],
  },
]

const NOTES_FOLDERS = [
  {
    id: 1, name: 'Idées & sélection', color: '#7c3aed',
    notes: [
      { id: 1, title: 'Sélection livres 2025-2026', updated: 'il y a 2 jours', preview: 'Lus cette année : Le Mythe de Sisyphe, Les Misérables, L\'Étranger. Proposés pour le prochain semestre : Fahrenheit 451…' },
      { id: 2, title: 'Idées de thématiques pour les séances', updated: 'il y a 5 jours', preview: 'L\'absurde dans la littérature, Utopies et dystopies, Le voyage initiatique, Les femmes dans la littérature…' },
    ],
  },
  {
    id: 2, name: 'Organisation', color: '#0ea5e9',
    notes: [
      { id: 3, title: 'Planning AG 2026 — ordre du jour', updated: 'il y a 1 jour', preview: 'AG 15 juin 2026. Ordre du jour : ouverture, rapport moral, rapport financier, questions, élection bureau…' },
      { id: 4, title: 'Budget prévisionnel 2026-2027', updated: 'il y a 3 jours', preview: 'Objectif 300 membres. Cotisations 9 000 CHF, subventions 5 000 CHF. Excédent prévisionnel : +11 400 CHF.' },
    ],
  },
]

const income  = TRANSACTIONS.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0)
const expense = TRANSACTIONS.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0)
const balance = income - expense

function fmt(n: number) {
  return n.toLocaleString('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function Avatar({ initials, color = ACCENT, size = 'md' }: { initials: string; color?: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'h-7 w-7 text-[10px]' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-9 w-9 text-xs'
  return (
    <div className={cn('flex items-center justify-center rounded-full font-semibold shrink-0', s)}
      style={{ backgroundColor: color + '22', color }}>
      {initials}
    </div>
  )
}

function Pill({ label, classes }: { label: string; classes: string }) {
  return <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', classes)}>{label}</span>
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ active, setActive, dark, setDark }: {
  active: NavId
  setActive: (id: NavId) => void
  dark: boolean
  setDark: (v: boolean) => void
}) {
  const [collapsed, setCollapsed] = useState(false)

  function NavItem({ item }: { item: { id: NavId; label: string; icon: React.ElementType } }) {
    const isActive = active === item.id
    const Icon = item.icon
    return (
      <button
        onClick={() => setActive(item.id)}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
          collapsed ? 'justify-center px-0' : '',
          isActive
            ? 'font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5',
        )}
        style={isActive ? { backgroundColor: hex(0.08), color: ACCENT } : undefined}
        title={collapsed ? item.label : undefined}
      >
        <Icon className={cn('shrink-0', collapsed ? 'h-5 w-5' : 'h-4 w-4')} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </button>
    )
  }

  return (
    <aside className={cn(
      'flex h-full flex-col border-r border-border bg-sidebar transition-all duration-200',
      collapsed ? 'w-14' : 'w-56',
    )}>
      {/* Association */}
      <div className={cn('flex items-center gap-3 px-3 py-4 border-b border-border', collapsed && 'justify-center px-0')}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
          style={{ backgroundColor: hex(0.12), color: ACCENT }}>
          AEC
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Esprits Curieux</p>
            <p className="text-[11px] text-muted-foreground">257 membres</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        <div>
          {!collapsed && <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Pilotage</p>}
          <div className="space-y-0.5">
            {NAV_PILOTAGE.map(item => <NavItem key={item.id} item={item} />)}
          </div>
        </div>
        <div>
          {!collapsed && <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Opérations</p>}
          <div className="space-y-0.5">
            {NAV_OPS.map(item => <NavItem key={item.id} item={item} />)}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className={cn('border-t border-border px-2 py-2 space-y-0.5', collapsed && 'px-0 flex flex-col items-center')}>
        <button onClick={() => setDark(!dark)}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          style={collapsed ? { justifyContent: 'center', paddingLeft: 0, paddingRight: 0 } : undefined}>
          {dark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
          {!collapsed && <span>{dark ? 'Mode clair' : 'Mode sombre'}</span>}
        </button>
        <button
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          style={collapsed ? { justifyContent: 'center', paddingLeft: 0, paddingRight: 0 } : undefined}>
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Paramètres</span>}
        </button>
        <div className={cn('pt-1 border-t border-border flex items-center gap-2.5 px-2.5 py-2', collapsed && 'px-0 justify-center')}>
          <Avatar initials="LR" size="sm" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">Léa Rousseau</p>
              <p className="text-[10px] text-muted-foreground truncate">lea@aec.ch</p>
            </div>
          )}
        </div>
        <button onClick={() => setCollapsed(v => !v)}
          className="flex w-full items-center justify-end gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronsLeft className={cn('h-3.5 w-3.5 transition-transform', collapsed && 'rotate-180')} />
          {!collapsed && <span>Réduire</span>}
        </button>
      </div>
    </aside>
  )
}

// ── Views ─────────────────────────────────────────────────────────────────────

function ViewDashboard() {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const today = new Date().toLocaleDateString('fr-CH', { weekday: 'long', day: 'numeric', month: 'long' })

  const todoTasks = TASKS_GROUPS.flatMap(g => g.tasks).filter(t => t.status !== 'done').slice(0, 4)
  const upcomingEvents = EVENTS.filter(e => e.status === 'planned')
  const lastConv = CONVERSATIONS[0]

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">{today}</p>
        <h1 className="text-[28px] font-heading italic font-normal mt-0.5">{greeting}, Léa ✨</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Membres', value: '257', icon: Users, color: ACCENT },
          { label: 'Trésorerie', value: '11 915 CHF', icon: Wallet, color: '#10b981' },
          { label: 'Événements', value: '5', icon: CalendarDays, color: '#f59e0b' },
          { label: 'Tâches actives', value: '5', icon: CheckSquare, color: '#0ea5e9' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: s.color + '18' }}>
                <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tasks widget */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">Pour vous</p>
            <span className="text-xs text-muted-foreground">{todoTasks.length} tâches</span>
          </div>
          <div className="space-y-2.5">
            {todoTasks.map(t => (
              <div key={t.id} className="flex items-start gap-2.5">
                <Circle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground/40" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">{t.title}</p>
                  {t.due && <p className="text-[11px] text-muted-foreground mt-0.5">Échéance : {t.due}</p>}
                </div>
                <PriorityDot priority={t.priority} />
              </div>
            ))}
          </div>
        </div>

        {/* Events widget */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">Prochains événements</p>
            <span className="text-xs text-muted-foreground">{upcomingEvents.length} à venir</span>
          </div>
          <div className="space-y-3">
            {upcomingEvents.map(e => (
              <div key={e.id} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-xl text-center"
                  style={{ backgroundColor: hex(0.1) }}>
                  <span className="text-[9px] font-semibold uppercase" style={{ color: ACCENT }}>
                    {e.date.split(' ')[1]}
                  </span>
                  <span className="text-sm font-bold leading-none" style={{ color: ACCENT }}>
                    {e.date.split(' ')[0]}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug truncate">{e.name}</p>
                  <p className="text-[11px] text-muted-foreground">{e.time} · {e.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Messages widget */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">Messages récents</p>
            <span className="text-xs text-muted-foreground">{CONVERSATIONS.length} conversations</span>
          </div>
          <div className="space-y-3">
            {CONVERSATIONS.map(c => {
              const last = c.messages[c.messages.length - 1]
              return (
                <div key={c.id} className="flex items-start gap-2.5">
                  <Avatar initials={last.sender} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{last.name} : {last.text.slice(0, 50)}…</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Notes widget */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">Notes récentes</p>
          </div>
          <div className="space-y-3">
            {NOTES_FOLDERS.flatMap(f => f.notes).slice(0, 3).map(n => (
              <div key={n.id} className="rounded-xl border border-border p-3">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.preview}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">{n.updated}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#94a3b8' }
  return <div className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: colors[priority] ?? '#94a3b8' }} />
}

function ViewMembers() {
  const [q, setQ] = useState('')
  const filtered = MEMBERS.filter(m =>
    m.name.toLowerCase().includes(q.toLowerCase()) ||
    m.email.toLowerCase().includes(q.toLowerCase())
  )
  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Gestion</p>
          <h1 className="text-[28px] font-heading italic font-normal mt-0.5">Membres</h1>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: ACCENT }}>
          <Plus className="h-4 w-4" />
          Inviter
        </button>
      </div>

      {/* Stats row */}
      <div className="flex gap-3">
        {[
          { label: 'Total', value: 257 },
          { label: 'Bureau', value: 3 },
          { label: 'Membres', value: 254 },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-2.5 text-center">
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={q} onChange={e => setQ(e.target.value)}
          placeholder="Rechercher un membre…"
          className="w-full rounded-xl border border-border bg-muted/50 pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2"
          style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
        />
      </div>

      {/* List */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Membre</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Rôle</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Depuis</th>
              <th className="px-5 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map(m => (
              <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar initials={m.avatar} size="sm" />
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-[11px] text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <Pill label={ROLE_STYLES[m.role].label} classes={ROLE_STYLES[m.role].badge} />
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">{m.joined}</span>
                </td>
                <td className="px-5 py-3.5">
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {q && filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">Aucun résultat pour « {q} »</div>
        )}
        {!q && (
          <div className="border-t border-border px-5 py-3 flex items-center justify-between text-[12px] text-muted-foreground">
            <span>Affichage des 7 membres du bureau · 250 autres membres</span>
          </div>
        )}
      </div>
    </div>
  )
}

function ViewTasks() {
  const total = TASKS_GROUPS.flatMap(g => g.tasks).length
  const done  = TASKS_GROUPS.flatMap(g => g.tasks).filter(t => t.status === 'done').length
  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Opérations</p>
          <h1 className="text-[28px] font-heading italic font-normal mt-0.5">Tâches</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          {done}/{total} terminées
        </div>
      </div>

      {TASKS_GROUPS.map(group => (
        <div key={group.id} className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.color }} />
            <span className="text-sm font-semibold">{group.name}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {group.tasks.filter(t => t.status !== 'done').length} restantes
            </span>
          </div>
          <div className="divide-y divide-border">
            {group.tasks.map(task => (
              <div key={task.id} className={cn('flex items-center gap-3 px-5 py-3.5', task.status === 'done' && 'opacity-50')}>
                {task.status === 'done'
                  ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  : task.status === 'in_progress'
                  ? <div className="h-4 w-4 shrink-0 rounded-full border-2 border-blue-500" />
                  : <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                }
                <p className={cn('flex-1 text-sm', task.status === 'done' && 'line-through')}>{task.title}</p>
                <div className="flex items-center gap-2">
                  {task.due && <span className="text-[11px] text-muted-foreground">{task.due}</span>}
                  <Avatar initials={task.assignee} size="sm" />
                  <PriorityDot priority={task.priority} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ViewEvents() {
  const [filter, setFilter] = useState<'all' | 'planned' | 'done'>('all')
  const filtered = EVENTS.filter(e => filter === 'all' || e.status === filter)
  const planned = EVENTS.filter(e => e.status === 'planned').length
  const done    = EVENTS.filter(e => e.status === 'done').length

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Opérations</p>
          <h1 className="text-[28px] font-heading italic font-normal mt-0.5">Événements</h1>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: ACCENT }}>
          <Plus className="h-4 w-4" />
          Créer
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        {[
          { label: 'À venir', value: planned, color: '#3b82f6' },
          { label: 'Passés',  value: done,    color: '#94a3b8' },
          { label: 'Total',   value: EVENTS.length, color: ACCENT },
        ].map(s => (
          <div key={s.label} className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-center">
            <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl bg-muted p-1 w-fit">
        {(['all', 'planned', 'done'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('rounded-lg px-3 py-1.5 text-sm transition-colors',
              filter === f ? 'bg-card text-foreground shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
            )}>
            {f === 'all' ? 'Tous' : f === 'planned' ? 'À venir' : 'Passés'}
          </button>
        ))}
      </div>

      {/* Event cards */}
      <div className="space-y-3">
        {filtered.map(ev => (
          <div key={ev.id} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4">
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-center"
              style={{ backgroundColor: hex(0.1) }}>
              <span className="text-[9px] font-bold uppercase leading-none" style={{ color: ACCENT }}>
                {ev.date.split(' ')[1]}
              </span>
              <span className="text-lg font-bold leading-tight" style={{ color: ACCENT }}>
                {ev.date.split(' ')[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">{ev.name}</p>
                <Pill label={EVENT_STATUS[ev.status].label} classes={EVENT_STATUS[ev.status].classes} />
              </div>
              <p className="text-[12px] text-muted-foreground mt-0.5">{ev.time} · {ev.location}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">{ev.participants} participant·es</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ViewFinances() {
  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Opérations</p>
        <h1 className="text-[28px] font-heading italic font-normal mt-0.5">Finances</h1>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <p className="text-xs text-muted-foreground">Recettes</p>
          </div>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(income)} CHF</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <p className="text-xs text-muted-foreground">Dépenses</p>
          </div>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">{fmt(expense)} CHF</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="h-4 w-4" style={{ color: ACCENT }} />
            <p className="text-xs text-muted-foreground">Solde</p>
          </div>
          <p className="text-xl font-bold" style={{ color: ACCENT }}>{fmt(balance)} CHF</p>
        </div>
      </div>

      {/* Transactions */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <p className="text-sm font-semibold">Transactions</p>
          <button className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ backgroundColor: hex(0.1), color: ACCENT }}>
            <Plus className="h-3.5 w-3.5" /> Ajouter
          </button>
        </div>
        <div className="divide-y divide-border">
          {TRANSACTIONS.map(t => (
            <div key={t.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
              <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                t.type === 'income' ? 'bg-emerald-500/10' : 'bg-red-500/10')}>
                {t.type === 'income'
                  ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  : <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{t.label}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-muted-foreground">{t.date}</span>
                  <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                    style={{ backgroundColor: t.catColor + '18', color: t.catColor }}>
                    {t.cat}
                  </span>
                </div>
              </div>
              <p className={cn('text-sm font-semibold tabular-nums',
                t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                {t.type === 'income' ? '+' : '−'}{fmt(t.amount)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ViewMessages() {
  const [activeConv, setActiveConv] = useState(0)
  const conv = CONVERSATIONS[activeConv]

  return (
    <div className="flex gap-0 rounded-2xl border border-border bg-card overflow-hidden h-[calc(100vh-8rem)] max-w-5xl">
      {/* Conversations list */}
      <div className="w-64 shrink-0 border-r border-border flex flex-col">
        <div className="px-4 py-3.5 border-b border-border">
          <p className="text-sm font-semibold">Messages</p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {CONVERSATIONS.map((c, i) => {
            const last = c.messages[c.messages.length - 1]
            return (
              <button key={c.id} onClick={() => setActiveConv(i)}
                className={cn('w-full text-left px-4 py-3.5 hover:bg-muted/40 transition-colors',
                  activeConv === i && 'bg-muted/60')}>
                <p className="text-sm font-medium truncate">{c.title}</p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{last.name}: {last.text.slice(0, 35)}…</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col min-w-0">
        <div className="px-5 py-3.5 border-b border-border">
          <p className="text-sm font-semibold">{conv.title}</p>
          <p className="text-[11px] text-muted-foreground">{conv.participants.length} participants</p>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {conv.messages.map(msg => {
            const isMe = msg.sender === 'LR'
            return (
              <div key={msg.id} className={cn('flex gap-2.5', isMe && 'flex-row-reverse')}>
                <Avatar initials={msg.sender} size="sm" />
                <div className={cn('max-w-[70%]', isMe && 'items-end flex flex-col')}>
                  <div className="flex items-center gap-2 mb-1">
                    {!isMe && <span className="text-[11px] font-medium">{msg.name}</span>}
                    <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                  </div>
                  <div className={cn('rounded-2xl px-3.5 py-2.5 text-sm',
                    isMe ? 'text-white rounded-tr-sm' : 'bg-muted rounded-tl-sm')}
                    style={isMe ? { backgroundColor: ACCENT } : undefined}>
                    {msg.text}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="border-t border-border px-4 py-3 flex items-center gap-2">
          <input placeholder="Écrire un message…" readOnly
            className="flex-1 rounded-xl border border-border bg-muted/50 px-3.5 py-2 text-sm outline-none" />
          <button className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: ACCENT }}>
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function ViewDocuments() {
  const [openFolders, setOpenFolders] = useState<number[]>([1, 2, 3])
  const toggle = (id: number) => setOpenFolders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const total = DOCUMENT_FOLDERS.reduce((a, f) => a + f.docs.length, 0)

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Opérations</p>
          <h1 className="text-[28px] font-heading italic font-normal mt-0.5">Documents</h1>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: ACCENT }}>
          <Plus className="h-4 w-4" />
          Importer
        </button>
      </div>
      <p className="text-sm text-muted-foreground">{total} documents en {DOCUMENT_FOLDERS.length} dossiers</p>

      <div className="space-y-3">
        {DOCUMENT_FOLDERS.map(folder => {
          const isOpen = openFolders.includes(folder.id)
          return (
            <div key={folder.id} className="rounded-2xl border border-border bg-card overflow-hidden">
              <button onClick={() => toggle(folder.id)}
                className="flex w-full items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                {isOpen
                  ? <FolderOpen className="h-4 w-4 shrink-0" style={{ color: folder.color }} />
                  : <Folder className="h-4 w-4 shrink-0" style={{ color: folder.color }} />
                }
                <span className="text-sm font-semibold">{folder.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{folder.docs.length} fichiers</span>
                <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', isOpen && 'rotate-90')} />
              </button>
              {isOpen && (
                <div className="border-t border-border divide-y divide-border">
                  {folder.docs.map(doc => (
                    <div key={doc.name} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                      <FileIcon className="h-4 w-4 shrink-0 text-red-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{doc.name}</p>
                        <p className="text-[11px] text-muted-foreground">{doc.size} · {doc.date}</p>
                      </div>
                      <button className="text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ViewNotes() {
  const [activeNote, setActiveNote] = useState<null | typeof NOTES_FOLDERS[0]['notes'][0]>(null)

  if (activeNote) {
    return (
      <div className="max-w-3xl">
        <button onClick={() => setActiveNote(null)}
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className="h-4 w-4 rotate-180" /> Retour aux notes
        </button>
        <h2 className="text-xl font-semibold mb-4">{activeNote.title}</h2>
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {activeNote.preview}
          {'\n\n'}[Contenu complet disponible dans l'application]
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Opérations</p>
          <h1 className="text-[28px] font-heading italic font-normal mt-0.5">Notes</h1>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: ACCENT }}>
          <Plus className="h-4 w-4" />
          Nouvelle note
        </button>
      </div>

      {NOTES_FOLDERS.map(folder => (
        <div key={folder.id}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: folder.color }} />
            <p className="text-sm font-semibold">{folder.name}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {folder.notes.map(note => (
              <button key={note.id} onClick={() => setActiveNote(note)}
                className="text-left rounded-2xl border border-border bg-card p-4 hover:border-foreground/20 hover:bg-muted/30 transition-colors">
                <p className="text-sm font-semibold mb-1.5">{note.title}</p>
                <p className="text-[12px] text-muted-foreground line-clamp-3 leading-relaxed">{note.preview}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-2">{note.updated}</p>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ViewCotisations() {
  const paid = 231
  const total = 257
  const pct = Math.round((paid / total) * 100)
  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Gestion</p>
        <h1 className="text-[28px] font-heading italic font-normal mt-0.5">Cotisations</h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Membres',   value: total, color: '#94a3b8' },
          { label: 'Réglé',     value: paid,  color: '#10b981' },
          { label: 'En attente',value: total - paid, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Taux de recouvrement</span>
          <span className="font-bold" style={{ color: ACCENT }}>{pct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: '#10b981' }} />
        </div>
        <div className="flex justify-between text-[11px] text-muted-foreground mt-1.5">
          <span>{fmt(paid * 30)} CHF collectés</span>
          <span>{fmt(total * 30)} CHF attendus</span>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border text-sm font-semibold">
          Membres du bureau (aperçu)
        </div>
        <div className="divide-y divide-border">
          {MEMBERS.map(m => (
            <div key={m.id} className="flex items-center gap-4 px-5 py-3.5">
              <Avatar initials={m.avatar} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{m.name}</p>
                <p className="text-[11px] text-muted-foreground">{m.email}</p>
              </div>
              <Pill label="Payé" classes="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20" />
              <span className="text-sm font-semibold text-muted-foreground">30,00 CHF</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PreviewPage() {
  const [active, setActive] = useState<NavId>('dashboard')
  const [dark, setDark] = useState(true)

  const VIEWS: Record<NavId, React.ReactNode> = {
    dashboard:   <ViewDashboard />,
    members:     <ViewMembers />,
    cotisations: <ViewCotisations />,
    tasks:       <ViewTasks />,
    events:      <ViewEvents />,
    finances:    <ViewFinances />,
    messages:    <ViewMessages />,
    documents:   <ViewDocuments />,
    notes:       <ViewNotes />,
  }

  return (
    <div className={dark ? 'dark' : ''} style={{ height: '100dvh' }}>
      <div className="flex h-full bg-background text-foreground overflow-hidden">
        <Sidebar active={active} setActive={setActive} dark={dark} setDark={setDark} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8">
            {VIEWS[active]}
          </div>
        </main>
      </div>
    </div>
  )
}
