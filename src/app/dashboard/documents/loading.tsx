export default function DocumentsLoading() {
  return (
    <div className="h-full flex flex-col animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/6 shrink-0">
        <div className="h-7 w-40 rounded bg-white/10" />
        <div className="h-8 w-28 rounded-lg bg-white/8" />
      </div>

      <div className="flex-1 p-8 space-y-6">
        {/* Search */}
        <div className="h-10 w-80 rounded-xl bg-white/8" />

        {/* Document grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/7 bg-white/[0.035] overflow-hidden">
              <div className="h-40 bg-white/8" />
              <div className="p-3 space-y-2">
                <div className="h-3 rounded bg-white/10" style={{ width: `${60 + (i * 11) % 30}%` }} />
                <div className="flex items-center justify-between">
                  <div className="h-5 w-5 rounded-full bg-white/10" />
                  <div className="h-2.5 w-12 rounded bg-white/7" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
