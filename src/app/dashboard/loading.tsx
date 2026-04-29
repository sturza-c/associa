export default function DashboardLoading() {
  return (
    <div className="h-full flex flex-col animate-pulse">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/6 shrink-0">
        <div className="space-y-2">
          <div className="h-2.5 w-40 rounded bg-white/10" />
          <div className="h-7 w-56 rounded bg-white/10" />
        </div>
        <div className="h-3 w-28 rounded bg-white/8" />
      </div>

      <div className="flex-1 overflow-hidden p-8 space-y-6">
        {/* Hero row */}
        <div className="grid grid-cols-5 gap-5">
          <div className="col-span-3 rounded-2xl border border-white/8 bg-white/[0.035] p-7 space-y-4 h-52" />
          <div className="col-span-2 grid grid-rows-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/7 bg-white/[0.035]" />
            ))}
          </div>
        </div>

        {/* Content row */}
        <div className="grid grid-cols-5 gap-5">
          <div className="col-span-3 rounded-2xl border border-white/7 bg-white/[0.035] h-64" />
          <div className="col-span-2 rounded-2xl border border-white/7 bg-white/[0.035] h-64" />
        </div>

        {/* Messages */}
        <div className="rounded-2xl border border-white/7 bg-white/[0.035] h-32" />
      </div>
    </div>
  )
}
