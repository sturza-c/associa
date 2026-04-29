export default function CalendarLoading() {
  return (
    <div className="h-full flex flex-col animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="h-7 w-7 rounded bg-white/10" />
          <div className="h-7 w-36 rounded bg-white/10" />
          <div className="h-7 w-7 rounded bg-white/10" />
        </div>
        <div className="h-8 w-32 rounded-lg bg-white/8" />
      </div>

      <div className="flex-1 p-8">
        {/* Day labels */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
            <div key={d} className="h-3 rounded bg-white/10" />
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {[...Array(42)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/6 bg-white/[0.025] h-20 p-2 space-y-1.5">
              <div className="h-2.5 w-5 rounded bg-white/10" />
              {i % 5 === 0 && <div className="h-2 w-full rounded bg-white/8" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
