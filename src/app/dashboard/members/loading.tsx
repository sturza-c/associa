export default function MembersLoading() {
  return (
    <div className="h-full flex flex-col animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/6 shrink-0">
        <div className="h-7 w-64 rounded bg-white/10" />
        <div className="flex gap-2">
          <div className="h-8 w-28 rounded-lg bg-white/8" />
          <div className="h-8 w-24 rounded-lg bg-white/8" />
        </div>
      </div>

      <div className="flex-1 p-8 space-y-6">
        {/* Search */}
        <div className="h-10 w-80 rounded-xl bg-white/8" />

        {/* Pending section */}
        <div className="space-y-2">
          <div className="h-2.5 w-24 rounded bg-white/10" />
          <div className="flex items-center gap-4 rounded-xl border border-white/6 bg-white/[0.025] px-5 py-4">
            <div className="h-9 w-9 rounded-full bg-white/10 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-48 rounded bg-white/10" />
              <div className="h-2.5 w-36 rounded bg-white/7" />
            </div>
          </div>
        </div>

        {/* Members section */}
        <div className="space-y-2">
          <div className="h-2.5 w-28 rounded bg-white/10" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-white/6 bg-white/[0.025] px-5 py-4">
              <div className="h-10 w-10 rounded-full bg-white/10 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 rounded bg-white/10" style={{ width: `${120 + i * 30}px` }} />
                <div className="h-2.5 w-40 rounded bg-white/7" />
              </div>
              <div className="h-6 w-20 rounded-full bg-white/8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
