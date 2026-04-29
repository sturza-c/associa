export default function MessagesLoading() {
  return (
    <div className="h-full flex animate-pulse">
      {/* Conversation list */}
      <div className="w-72 shrink-0 border-r border-white/6 flex flex-col">
        <div className="px-4 py-4 border-b border-white/6">
          <div className="h-8 w-full rounded-xl bg-white/8" />
        </div>
        <div className="flex-1 divide-y divide-white/5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <div className="h-10 w-10 rounded-full bg-white/10 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 rounded bg-white/10" style={{ width: `${50 + (i * 13) % 40}%` }} />
                <div className="h-2.5 w-full rounded bg-white/7" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message area */}
      <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-white/6 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-white/10" />
          <div className="h-4 w-40 rounded bg-white/10" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
              <div className="h-8 w-8 rounded-full bg-white/10 shrink-0" />
              <div className="h-10 rounded-2xl bg-white/8" style={{ width: `${30 + (i * 9) % 30}%` }} />
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-white/6">
          <div className="h-10 w-full rounded-xl bg-white/8" />
        </div>
      </div>
    </div>
  )
}
