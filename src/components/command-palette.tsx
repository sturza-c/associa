'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Users,
  CheckSquare,
  FileText,
  Calendar,
  MessageSquare,
  CornerDownLeft,
} from 'lucide-react'
import { searchAssociation, type SearchHit, type SearchResults } from '@/lib/actions/search'
import { cn } from '@/lib/utils'

const ICONS: Record<SearchHit['type'], React.ElementType> = {
  member: Users,
  document: FileText,
  task: CheckSquare,
  event: Calendar,
  conversation: MessageSquare,
}

const GROUP_LABELS: Record<keyof SearchResults, string> = {
  members: 'Membres',
  documents: 'Documents',
  tasks: 'Tâches',
  events: 'Événements',
  conversations: 'Conversations',
}

const QUICK_LINKS: SearchHit[] = [
  { type: 'task', id: 'q-tasks', title: 'Tâches', href: '/dashboard/tasks' },
  { type: 'document', id: 'q-docs', title: 'Documents', href: '/dashboard/documents' },
  { type: 'member', id: 'q-members', title: 'Membres', href: '/dashboard/members' },
  { type: 'event', id: 'q-events', title: 'Finances & événements', href: '/dashboard/finances' },
  { type: 'conversation', id: 'q-msgs', title: 'Messages', href: '/dashboard/messages' },
]

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(o => !o)
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults(null)
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null)
      return
    }
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const r = await searchAssociation(query)
        setResults(r)
        setActiveIdx(0)
      } finally {
        setLoading(false)
      }
    }, 150)
    return () => clearTimeout(t)
  }, [query])

  const flatHits: SearchHit[] = useMemo(() => {
    if (!results) return QUICK_LINKS
    return [
      ...results.members,
      ...results.documents,
      ...results.tasks,
      ...results.events,
      ...results.conversations,
    ]
  }, [results])

  function go(hit: SearchHit) {
    setOpen(false)
    router.push(hit.href)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(flatHits.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const hit = flatHits[activeIdx]
      if (hit) go(hit)
    }
  }

  if (!open) return null

  const totalHits = flatHits.length
  const hasResults = results !== null
  const isEmpty = hasResults && totalHits === 0 && !loading

  let runningIdx = 0

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      onMouseDown={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-popover/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 border-b border-white/8">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Rechercher membres, documents, tâches…"
            className="flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground/60"
          />
          <kbd className="text-[10px] font-mono text-muted-foreground/60 border border-white/10 rounded px-1.5 py-0.5">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!hasResults && (
            <Group label="Aller à">
              {QUICK_LINKS.map((hit) => {
                const i = runningIdx++
                return (
                  <Row key={hit.id} hit={hit} active={i === activeIdx} onClick={() => go(hit)} onHover={() => setActiveIdx(i)} />
                )
              })}
            </Group>
          )}

          {hasResults && isEmpty && (
            <p className="text-center py-12 text-sm text-muted-foreground italic">
              Aucun résultat pour « {query} »
            </p>
          )}

          {hasResults && !isEmpty && results && (
            <>
              {(Object.keys(GROUP_LABELS) as (keyof SearchResults)[]).map((key) => {
                const items = results[key]
                if (items.length === 0) return null
                return (
                  <Group key={key} label={GROUP_LABELS[key]}>
                    {items.map((hit) => {
                      const i = runningIdx++
                      return (
                        <Row
                          key={hit.id}
                          hit={hit}
                          active={i === activeIdx}
                          onClick={() => go(hit)}
                          onHover={() => setActiveIdx(i)}
                        />
                      )
                    })}
                  </Group>
                )
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-white/8 text-[11px] text-muted-foreground/60">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="font-mono border border-white/10 rounded px-1">↑</kbd>
              <kbd className="font-mono border border-white/10 rounded px-1">↓</kbd>
              naviguer
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" />
              ouvrir
            </span>
          </div>
          {loading && <span className="italic">recherche…</span>}
        </div>
      </div>
    </div>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {label}
      </p>
      {children}
    </div>
  )
}

function Row({
  hit,
  active,
  onClick,
  onHover,
}: {
  hit: SearchHit
  active: boolean
  onClick: () => void
  onHover: () => void
}) {
  const Icon = ICONS[hit.type]
  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
        active ? 'bg-white/8' : 'hover:bg-white/5'
      )}
    >
      <div className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
        active ? 'bg-white/10' : 'bg-white/5'
      )}>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{hit.title}</p>
        {hit.subtitle && (
          <p className="text-xs text-muted-foreground truncate">{hit.subtitle}</p>
        )}
      </div>
    </button>
  )
}
