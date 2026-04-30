'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAssociation } from '@/contexts/association-context'
import { useTheme } from '@/components/theme-provider'
import { logout } from '@/lib/actions/auth'
import type { UserProfile } from '@/types/database'
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  FileText,
  Wallet,
  Calendar,
  CalendarDays,
  MessageSquare,
  ChevronsUpDown,
  LogOut,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Sun,
  Moon,
  BadgePercent,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const PILOTAGE_ITEMS = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/members', label: 'Membres', icon: Users, countKey: 'members' as const },
  { href: '/dashboard/cotisations', label: 'Cotisations', icon: BadgePercent },
]

const OPERATIONS_ITEMS = [
  { href: '/dashboard/tasks', label: 'Tâches', icon: CheckSquare },
  { href: '/dashboard/events', label: 'Événements', icon: CalendarDays },
  { href: '/dashboard/calendar', label: 'Agenda', icon: Calendar },
  { href: '/dashboard/documents', label: 'Documents', icon: FileText },
  { href: '/dashboard/finances', label: 'Finances', icon: Wallet },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
]

function getInitials(name: string | null, email: string) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return email[0].toUpperCase()
}

function getAssocInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function AssocAvatar({
  name,
  logoUrl,
  accentColor,
  title,
  className,
}: {
  name: string
  logoUrl: string | null
  accentColor: string
  title?: string
  className?: string
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={name}
        title={title}
        className={cn('h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-white/10', className)}
      />
    )
  }
  return (
    <div
      className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold', className)}
      title={title}
      style={{ backgroundColor: accentColor + '22', color: accentColor }}
    >
      {getAssocInitials(name)}
    </div>
  )
}

function UserMenu({ profile, collapsed }: { profile: UserProfile; collapsed: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (collapsed) {
    return (
      <div ref={ref} className="relative flex justify-center">
        <button
          onClick={() => setOpen(v => !v)}
          title={profile.full_name || profile.email}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground/10 text-xs font-semibold hover:bg-foreground/15 transition-colors overflow-hidden"
        >
          {profile.avatar_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={profile.avatar_url} alt={profile.full_name ?? profile.email} className="h-full w-full object-cover" />
            : getInitials(profile.full_name, profile.email)
          }
        </button>
        {open && (
          <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-border bg-popover backdrop-blur-2xl p-1 shadow-2xl z-50">
            <div className="px-3 py-2 border-b border-border mb-1">
              <p className="text-sm font-medium truncate">{profile.full_name || 'Mon compte'}</p>
              <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            </div>
            <button
              onClick={() => logout()}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-3 rounded-xl p-2 hover:bg-foreground/5 transition-colors text-left"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-xs font-semibold overflow-hidden">
          {profile.avatar_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={profile.avatar_url} alt={profile.full_name ?? profile.email} className="h-full w-full object-cover" />
            : getInitials(profile.full_name, profile.email)
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate leading-tight">{profile.full_name || 'Mon compte'}</p>
          <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
        </div>
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl border border-border bg-popover backdrop-blur-2xl p-1 shadow-2xl z-50">
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  )
}

interface NavItemProps {
  href: string
  label: string
  icon: React.ElementType
  isActive: boolean
  accentColor: string
  count?: number
  collapsed?: boolean
}

function NavItem({ href, label, icon: Icon, isActive, accentColor, count, collapsed }: NavItemProps) {
  if (collapsed) {
    return (
      <Link
        href={href}
        title={label}
        className={cn(
          'flex h-9 w-9 mx-auto items-center justify-center rounded-xl transition-all',
          isActive
            ? 'text-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
        )}
        style={isActive ? { color: accentColor, backgroundColor: accentColor + '18' } : undefined}
      >
        <Icon className="h-4 w-4 shrink-0" />
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all',
        isActive
          ? 'bg-foreground/8 text-foreground'
          : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
      )}
      style={isActive ? { color: accentColor } : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {count !== undefined && count > 0 && (
        <span className={cn(
          'text-xs rounded-md px-1.5 py-0.5 font-medium tabular-nums',
          isActive ? 'bg-foreground/10' : 'bg-foreground/6 text-muted-foreground'
        )}>
          {count}
        </span>
      )}
    </Link>
  )
}

interface Props {
  profile: UserProfile
  memberCount: number
}

export function AppSidebar({ profile, memberCount }: Props) {
  const pathname = usePathname()
  const { activeAssociation, memberships } = useAssociation()
  const { theme, toggle: toggleTheme } = useTheme()
  const accentColor = activeAssociation?.accent_color ?? '#6366f1'

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar_collapsed') === 'true'
    }
    return false
  })
  const [hoverExpanded, setHoverExpanded] = useState(false)

  const isExpanded = !collapsed || hoverExpanded

  function toggleCollapsed() {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem('sidebar_collapsed', String(next))
      if (!next) setHoverExpanded(false)
      return next
    })
  }

  function isActive(href: string) {
    return href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
  }

  return (
    <>
      {/* Spacer always in flex flow — drives layout, never causes reflow on hover */}
      <div className={cn(
        'shrink-0 transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-14' : 'w-64'
      )} />

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-sidebar backdrop-blur-xl transition-[width] duration-200 ease-in-out overflow-hidden',
          collapsed && !hoverExpanded ? 'w-14' : 'w-64',
          hoverExpanded && 'shadow-2xl z-50'
        )}
        onMouseEnter={() => { if (collapsed) setHoverExpanded(true) }}
        onMouseLeave={() => setHoverExpanded(false)}
      >
      {/* ── Top bar: collapse toggle ── */}
      <div className={cn(
        'flex shrink-0 items-center border-b border-border h-10',
        isExpanded ? 'justify-end px-2' : 'justify-center px-2'
      )}>
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Épingler la barre latérale' : 'Réduire la barre latérale'}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/8 hover:text-foreground transition-colors"
        >
          {collapsed
            ? <ChevronsRight className="h-3.5 w-3.5" />
            : <ChevronsLeft className="h-3.5 w-3.5" />
          }
        </button>
      </div>

      {/* ── Association block ── */}
      <div className={cn(
        'border-b border-border shrink-0',
        isExpanded ? 'p-4' : 'p-2'
      )}>
        {!isExpanded ? (
          activeAssociation ? (
            <AssocAvatar
              name={activeAssociation.name}
              logoUrl={activeAssociation.logo_url}
              accentColor={accentColor}
              title={activeAssociation.name}
              className="mx-auto"
            />
          ) : (
            <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl text-sm font-bold"
              style={{ backgroundColor: accentColor + '22', color: accentColor }}>?</div>
          )
        ) : memberships.length > 1 ? (
          <Link href="/select" className="flex items-center gap-3 rounded-xl p-2 hover:bg-foreground/5 transition-colors group">
            {activeAssociation ? (
              <AssocAvatar
                name={activeAssociation.name}
                logoUrl={activeAssociation.logo_url}
                accentColor={accentColor}
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                style={{ backgroundColor: accentColor + '22', color: accentColor }}>?</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">{activeAssociation?.name ?? '...'}</p>
              {activeAssociation?.description && (
                <p className="text-xs text-muted-foreground truncate">{activeAssociation.description}</p>
              )}
            </div>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ) : (
          <div className="flex items-center gap-3 p-2">
            {activeAssociation ? (
              <AssocAvatar
                name={activeAssociation.name}
                logoUrl={activeAssociation.logo_url}
                accentColor={accentColor}
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                style={{ backgroundColor: accentColor + '22', color: accentColor }}>?</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">{activeAssociation?.name ?? '...'}</p>
              {activeAssociation?.description && (
                <p className="text-xs text-muted-foreground truncate">{activeAssociation.description}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className={cn('flex-1 overflow-y-auto space-y-4', isExpanded ? 'p-3' : 'p-2')}>
        {/* PILOTAGE */}
        <div className="space-y-0.5">
          {isExpanded && (
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Pilotage
            </p>
          )}
          {PILOTAGE_ITEMS.map(({ href, label, icon, countKey }) => (
            <NavItem
              key={href}
              href={href}
              label={label}
              icon={icon}
              isActive={isActive(href)}
              accentColor={accentColor}
              count={countKey === 'members' ? memberCount : undefined}
              collapsed={!isExpanded}
            />
          ))}
        </div>

        {/* OPÉRATIONS */}
        <div className="space-y-0.5">
          {isExpanded && (
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Opérations
            </p>
          )}
          {OPERATIONS_ITEMS.map(({ href, label, icon }) => (
            <NavItem
              key={href}
              href={href}
              label={label}
              icon={icon}
              isActive={isActive(href)}
              accentColor={accentColor}
              collapsed={!isExpanded}
            />
          ))}
        </div>
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-border shrink-0">
        <div className={cn('pt-2', isExpanded ? 'px-3' : 'px-2')}>
          <NavItem
            href="/dashboard/settings"
            label="Paramètres"
            icon={Settings}
            isActive={isActive('/dashboard/settings')}
            accentColor={accentColor}
            collapsed={!isExpanded}
          />
        </div>

        {/* Theme toggle — same style as nav items */}
        <div className={cn('pb-1', isExpanded ? 'px-3' : 'px-2')}>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            className={cn(
              'w-full flex items-center rounded-xl py-2 text-sm font-medium transition-all text-muted-foreground hover:bg-foreground/5 hover:text-foreground',
              isExpanded ? 'gap-3 px-3' : 'justify-center px-2'
            )}
          >
            {theme === 'dark'
              ? <Sun className="h-4 w-4 shrink-0" />
              : <Moon className="h-4 w-4 shrink-0" />
            }
            {isExpanded && (
              <span>{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>
            )}
          </button>
        </div>

        <div className={cn('pb-3', isExpanded ? 'px-3' : 'px-2')}>
          <UserMenu profile={profile} collapsed={!isExpanded} />
        </div>
      </div>
    </aside>
    </>
  )
}
