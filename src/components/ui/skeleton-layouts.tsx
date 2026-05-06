/**
 * Page-level skeleton layouts — one per route.
 * Each mirrors the real layout structure exactly so the transition
 * from skeleton → content feels instant rather than jarring.
 */

import { Skeleton } from '@/components/ui/skeleton'

// ─── Shared primitives ────────────────────────────────────────────────────────

function PageHeader({ rightSlot }: { rightSlot?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-8 py-5 border-b border-border shrink-0">
      <div className="space-y-2">
        <Skeleton className="h-2.5 w-32" />
        <Skeleton className="h-7 w-52" />
      </div>
      {rightSlot ?? <Skeleton className="h-8 w-28 rounded-xl" />}
    </div>
  )
}

function RowSkeleton({ widths }: { widths: string[] }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4">
      {widths.map((w, i) => (
        <Skeleton key={i} className="h-3.5 shrink-0" style={{ width: w }} />
      ))}
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border shrink-0">
        <div className="space-y-2">
          <Skeleton className="h-2.5 w-40" />
          <Skeleton className="h-7 w-56" />
        </div>
        <Skeleton className="h-8 w-36 rounded-xl" />
      </div>

      <div className="flex-1 overflow-hidden p-8 space-y-5">
        {/* Hero row */}
        <div className="grid grid-cols-5 gap-4">
          <Skeleton className="col-span-3 rounded-2xl h-48" />
          <div className="col-span-2 grid grid-rows-3 gap-4">
            <Skeleton className="rounded-2xl" />
            <Skeleton className="rounded-2xl" />
            <Skeleton className="rounded-2xl" />
          </div>
        </div>

        {/* Widgets */}
        <div className="grid grid-cols-5 gap-4">
          <Skeleton className="col-span-3 rounded-2xl h-64" />
          <Skeleton className="col-span-2 rounded-2xl h-64" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="rounded-2xl h-52" />
          <Skeleton className="rounded-2xl h-52" />
        </div>
      </div>
    </div>
  )
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export function TasksSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <PageHeader />
      <div className="flex-1 p-8 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-2">
          {[72, 64, 56, 80].map((w, i) => (
            <Skeleton key={i} className="h-7 rounded-lg" style={{ width: w }} />
          ))}
        </div>
        {/* Rows */}
        {[85, 62, 78, 55, 90, 68, 74].map((w, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4">
            <Skeleton className="h-4 w-4 rounded shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 rounded" style={{ width: `${w}%` }} />
              <Skeleton className="h-2.5 w-24" />
            </div>
            <Skeleton className="h-5 w-16 rounded-md shrink-0" />
            <Skeleton className="h-6 w-6 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Members ──────────────────────────────────────────────────────────────────

export function MembersSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-8 py-5 border-b border-border shrink-0">
        <div className="space-y-2">
          <Skeleton className="h-2.5 w-28" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28 rounded-xl" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      </div>
      <div className="flex-1 p-8 space-y-6">
        <Skeleton className="h-10 w-80 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-2.5 w-20" />
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5" style={{ width: `${120 + i * 28}px` }} />
                <Skeleton className="h-2.5 w-40" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Events ───────────────────────────────────────────────────────────────────

export function EventsSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-8 py-5 border-b border-border shrink-0">
        <div className="space-y-2">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-7 w-40" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar list */}
        <div className="w-72 border-r border-border p-4 space-y-3 shrink-0">
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl border border-border bg-card p-3 space-y-2">
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
          ))}
        </div>
        {/* Detail area */}
        <div className="flex-1 p-8 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))' }}>
            {[0, 1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Messages ────────────────────────────────────────────────────────────────

export function MessagesSkeleton() {
  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-72 shrink-0 border-r border-border flex flex-col">
        <div className="px-4 py-4 border-b border-border">
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
        <div className="flex-1 divide-y divide-border">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3" style={{ width: `${50 + (i * 13) % 40}%` }} />
                <Skeleton className="h-2.5 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Message area */}
      <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          {[55, 40, 65, 35, 50].map((w, i) => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <Skeleton className="h-10 rounded-2xl" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-border">
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ─── Finances ────────────────────────────────────────────────────────────────

export function FinancesSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <PageHeader />
      <div className="flex-1 p-8 space-y-5">
        {/* Stat tiles */}
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <Skeleton key={i} className="rounded-2xl h-28" />
          ))}
        </div>
        {/* Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex gap-4 px-6 py-3.5 border-b border-border">
            {[120, 80, 100, 60, 80].map((w, i) => (
              <Skeleton key={i} className="h-2.5 rounded flex-1" style={{ maxWidth: w }} />
            ))}
          </div>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex gap-4 px-6 py-4 border-b border-border last:border-0">
              <Skeleton className="h-3 flex-1 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-5 w-16 rounded-md shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Calendar ────────────────────────────────────────────────────────────────

export function CalendarSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-8 py-5 border-b border-border shrink-0">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-28 rounded-xl" />
      </div>
      <div className="flex-1 p-8">
        <div className="grid grid-cols-7 gap-2 mb-3">
          {['L', 'M', 'Me', 'J', 'V', 'S', 'D'].map(d => (
            <Skeleton key={d} className="h-3 rounded" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card h-20 p-2 space-y-1.5">
              <Skeleton className="h-2.5 w-5" />
              {i % 5 === 0 && <Skeleton className="h-2 w-full rounded" />}
              {i % 8 === 3 && <Skeleton className="h-2 w-3/4 rounded" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Documents ───────────────────────────────────────────────────────────────

export function DocumentsSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <PageHeader />
      <div className="flex-1 p-8 space-y-5">
        <Skeleton className="h-10 w-80 rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
              <Skeleton className="h-36 rounded-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 rounded" style={{ width: `${60 + (i * 11) % 30}%` }} />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-2.5 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export function NotesSkeleton() {
  return (
    <div className="h-full flex">
      {/* Rail */}
      <div className="w-56 shrink-0 border-r border-border flex flex-col p-3 gap-1">
        <Skeleton className="h-8 w-full rounded-xl mb-2" />
        {[0, 1, 2].map(i => (
          <Skeleton key={i} className="h-7 w-full rounded-lg" />
        ))}
        <div className="mt-4 space-y-1">
          <Skeleton className="h-2.5 w-20 mb-2" />
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-1.5">
              <Skeleton className="h-3" style={{ width: `${60 + (i * 13) % 30}%` }} />
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-2.5 w-3/4" />
            </div>
          ))}
        </div>
      </div>
      {/* Editor */}
      <div className="flex-1 flex flex-col p-12 space-y-4 max-w-3xl">
        <Skeleton className="h-10 w-2/3 mt-4" />
        <div className="space-y-3 mt-6">
          {[100, 85, 92, 70, 88, 60, 78].map((w, i) => (
            <Skeleton key={i} className="h-4 rounded" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
