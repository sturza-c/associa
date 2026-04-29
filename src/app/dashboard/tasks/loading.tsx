export default function TasksLoading() {
  return (
    <div className="h-full flex flex-col animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/6 shrink-0">
        <div className="h-7 w-48 rounded bg-white/10" />
        <div className="h-8 w-28 rounded-lg bg-white/8" />
      </div>

      <div className="flex-1 p-8 space-y-3">
        {/* Filter bar */}
        <div className="flex gap-2 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-7 w-20 rounded-lg bg-white/8" />
          ))}
        </div>

        {/* Task rows */}
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-white/6 bg-white/[0.025] px-5 py-4">
            <div className="h-4 w-4 rounded bg-white/10 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 rounded bg-white/10" style={{ width: `${55 + (i * 7) % 35}%` }} />
              <div className="h-2.5 w-24 rounded bg-white/7" />
            </div>
            <div className="h-5 w-16 rounded-md bg-white/8" />
            <div className="h-5 w-5 rounded-full bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  )
}
