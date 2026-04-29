export default function FinancesLoading() {
  return (
    <div className="h-full flex flex-col animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/6 shrink-0">
        <div className="h-7 w-44 rounded bg-white/10" />
        <div className="h-8 w-32 rounded-lg bg-white/8" />
      </div>

      <div className="flex-1 p-8 space-y-6">
        {/* Stat tiles */}
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/7 bg-white/[0.035] p-5 space-y-2 h-24" />
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/7 bg-white/[0.035] overflow-hidden">
          {/* Table header */}
          <div className="flex gap-4 px-6 py-3 border-b border-white/6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-2.5 rounded bg-white/10 flex-1" />
            ))}
          </div>
          {/* Table rows */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-4 px-6 py-4 border-b border-white/5 last:border-0">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-3 rounded bg-white/8 flex-1" style={{ opacity: 1 - j * 0.1 }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
