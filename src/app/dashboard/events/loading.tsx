export default function EventsLoading() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/6 shrink-0">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded-full bg-white/6 animate-pulse" />
          <div className="h-8 w-40 rounded-xl bg-white/6 animate-pulse" />
        </div>
        <div className="h-9 w-36 rounded-xl bg-white/6 animate-pulse" />
      </div>
      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 border-r border-white/6 p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-white/4 animate-pulse" />
          ))}
        </div>
        <div className="flex-1 p-8 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/4 animate-pulse" />
            ))}
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-white/4 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
