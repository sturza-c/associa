import { cn } from '@/lib/utils'

// ─── SVG Illustrations ────────────────────────────────────────────────────────

const IllustrationTasks = () => (
  <svg viewBox="0 0 80 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="14" y="8" width="44" height="50" rx="7" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5"/>
    <rect x="14" y="8" width="44" height="14" rx="7" fill="currentColor" fillOpacity="0.08"/>
    <rect x="14" y="15" width="44" height="7" fill="currentColor" fillOpacity="0.08"/>
    <rect x="27" y="4" width="10" height="9" rx="2.5" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5"/>
    <rect x="43" y="4" width="10" height="9" rx="2.5" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5"/>
    <line x1="26" y1="32" x2="54" y2="32" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" strokeLinecap="round"/>
    <line x1="26" y1="40" x2="48" y2="40" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" strokeLinecap="round"/>
    <line x1="26" y1="48" x2="50" y2="48" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" strokeLinecap="round"/>
    {/* Sparkle */}
    <path d="M68 12l1.2 3.2 3.2 1.2-3.2 1.2L68 21l-1.2-3.4-3.2-1.2 3.2-1.2L68 12z" fill="currentColor" fillOpacity="0.35"/>
    <path d="M10 48l.7 1.8 1.8.7-1.8.7L10 53.8l-.7-1.8-1.8-.7 1.8-.7L10 48z" fill="currentColor" fillOpacity="0.2"/>
  </svg>
)

const IllustrationMembers = () => (
  <svg viewBox="0 0 80 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Left person */}
    <circle cx="18" cy="24" r="8" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.5"/>
    <path d="M4 56c0-7.73 6.27-14 14-14" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round"/>
    {/* Right person */}
    <circle cx="62" cy="24" r="8" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.5"/>
    <path d="M76 56c0-7.73-6.27-14-14-14" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round"/>
    {/* Center person — prominent */}
    <circle cx="40" cy="20" r="12" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5"/>
    <path d="M18 58c0-12.15 9.85-22 22-22s22 9.85 22 22" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round"/>
    {/* Plus badge */}
    <circle cx="60" cy="50" r="9" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5"/>
    <path d="M60 45v10M55 50h10" stroke="currentColor" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const IllustrationEvents = () => (
  <svg viewBox="0 0 80 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="8" y="12" width="56" height="46" rx="8" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5"/>
    <rect x="8" y="12" width="56" height="17" rx="8" fill="currentColor" fillOpacity="0.1"/>
    <rect x="8" y="21" width="56" height="8" fill="currentColor" fillOpacity="0.1"/>
    <path d="M24 6v12M48 6v12" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round"/>
    {/* Date dots */}
    <circle cx="22" cy="40" r="5" fill="currentColor" fillOpacity="0.2"/>
    <circle cx="35" cy="40" r="5" fill="currentColor" fillOpacity="0.1"/>
    <circle cx="48" cy="40" r="5" fill="currentColor" fillOpacity="0.1"/>
    <circle cx="61" cy="40" r="5" fill="currentColor" fillOpacity="0.1"/>
    <circle cx="22" cy="52" r="5" fill="currentColor" fillOpacity="0.1"/>
    <circle cx="35" cy="52" r="5" fill="currentColor" fillOpacity="0.1"/>
    {/* Star on first date */}
    <path d="M22 37.5l.9 2.4 2.6.1-2 1.5.7 2.5L22 42.5l-2.2 1.5.7-2.5-2-1.5 2.6-.1L22 37.5z" fill="currentColor" fillOpacity="0.5"/>
  </svg>
)

const IllustrationMessages = () => (
  <svg viewBox="0 0 80 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* First bubble */}
    <rect x="4" y="6" width="44" height="28" rx="10" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5"/>
    <path d="M4 28l-2 8 8-6" fill="currentColor" fillOpacity="0.1"/>
    <circle cx="18" cy="20" r="3.5" fill="currentColor" fillOpacity="0.3"/>
    <circle cx="27" cy="20" r="3.5" fill="currentColor" fillOpacity="0.3"/>
    <circle cx="36" cy="20" r="3.5" fill="currentColor" fillOpacity="0.3"/>
    {/* Second bubble */}
    <rect x="28" y="34" width="44" height="24" rx="10" fill="currentColor" fillOpacity="0.07" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5"/>
    <path d="M72 52l2 8-8-6" fill="currentColor" fillOpacity="0.08"/>
    <line x1="38" y1="44" x2="62" y2="44" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round"/>
    <line x1="38" y1="51" x2="54" y2="51" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const IllustrationDocuments = () => (
  <svg viewBox="0 0 80 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Back page */}
    <rect x="22" y="6" width="38" height="50" rx="6" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1.5" transform="rotate(6 22 6)"/>
    {/* Middle page */}
    <rect x="18" y="8" width="38" height="50" rx="6" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5" transform="rotate(2 18 8)"/>
    {/* Front page */}
    <rect x="14" y="8" width="40" height="50" rx="7" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5"/>
    <rect x="14" y="8" width="40" height="14" rx="7" fill="currentColor" fillOpacity="0.1"/>
    <rect x="14" y="15" width="40" height="7" fill="currentColor" fillOpacity="0.1"/>
    <line x1="23" y1="30" x2="45" y2="30" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" strokeLinecap="round"/>
    <line x1="23" y1="38" x2="41" y2="38" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" strokeLinecap="round"/>
    <line x1="23" y1="46" x2="43" y2="46" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" strokeLinecap="round"/>
    {/* Upload badge */}
    <circle cx="62" cy="50" r="12" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5"/>
    <path d="M62 44v12M57 49l5-5 5 5" stroke="currentColor" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IllustrationFinances = () => (
  <svg viewBox="0 0 80 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Wallet body */}
    <rect x="6" y="14" width="54" height="38" rx="9" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5"/>
    <path d="M6 26h54" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5"/>
    {/* Pocket */}
    <rect x="36" y="30" width="20" height="14" rx="5" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5"/>
    <circle cx="46" cy="37" r="4" fill="currentColor" fillOpacity="0.28"/>
    {/* Coin stack */}
    <ellipse cx="68" cy="38" rx="7" ry="3" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5"/>
    <ellipse cx="68" cy="34" rx="7" ry="3" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5"/>
    <ellipse cx="68" cy="30" rx="7" ry="3" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.5"/>
    {/* Trend line */}
    <path d="M8 56l10-8 10 4 12-10 10 4" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="50" cy="46" r="2.5" fill="currentColor" fillOpacity="0.35"/>
  </svg>
)

const IllustrationNotes = () => (
  <svg viewBox="0 0 80 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Notebook */}
    <rect x="10" y="6" width="50" height="54" rx="7" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.5"/>
    {/* Spine */}
    <rect x="10" y="6" width="10" height="54" rx="5" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5"/>
    {/* Rings */}
    <circle cx="15" cy="20" r="2.5" fill="currentColor" fillOpacity="0.35"/>
    <circle cx="15" cy="32" r="2.5" fill="currentColor" fillOpacity="0.35"/>
    <circle cx="15" cy="44" r="2.5" fill="currentColor" fillOpacity="0.35"/>
    {/* Lines */}
    <line x1="27" y1="20" x2="52" y2="20" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" strokeLinecap="round"/>
    <line x1="27" y1="28" x2="50" y2="28" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" strokeLinecap="round"/>
    <line x1="27" y1="36" x2="54" y2="36" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" strokeLinecap="round"/>
    <line x1="27" y1="44" x2="48" y2="44" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" strokeLinecap="round"/>
    {/* Pen */}
    <rect x="55" y="42" width="5" height="16" rx="2.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" transform="rotate(-35 55 42)"/>
    <path d="M64 54l-3 5-1-4 4-1z" fill="currentColor" fillOpacity="0.3"/>
  </svg>
)

const IllustrationCalendar = () => (
  <svg viewBox="0 0 80 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="6" y="10" width="68" height="50" rx="9" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1.5"/>
    <rect x="6" y="10" width="68" height="18" rx="9" fill="currentColor" fillOpacity="0.1"/>
    <rect x="6" y="20" width="68" height="8" fill="currentColor" fillOpacity="0.1"/>
    <path d="M24 4v12M56 4v12" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round"/>
    {/* Week grid */}
    {[16, 27, 38, 49, 60, 71].map((x, i) => (
      <circle key={i} cx={x} cy={40} r={4} fill="currentColor" fillOpacity={i === 0 ? 0.25 : 0.1}/>
    ))}
    {[16, 27, 38, 49, 60].map((x, i) => (
      <circle key={i} cx={x} cy={52} r={4} fill="currentColor" fillOpacity={0.1}/>
    ))}
    <path d="M21 37.5l.8 2.2 2.3.1-1.8 1.4.6 2.3L21 42l-1.9 1.5.6-2.3-1.8-1.4 2.3-.1.8-2.2z" fill="currentColor" fillOpacity="0.5"/>
  </svg>
)

const IllustrationGeneric = () => (
  <svg viewBox="0 0 80 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect x="12" y="12" width="56" height="44" rx="10" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.5"/>
    <path d="M12 28h56" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.5"/>
    <line x1="24" y1="38" x2="56" y2="38" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" strokeLinecap="round"/>
    <line x1="24" y1="46" x2="46" y2="46" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" strokeLinecap="round"/>
    <path d="M40 20l1.4 3.8 3.8 1.4-3.8 1.4L40 30.4l-1.4-3.8-3.8-1.4 3.8-1.4L40 20z" fill="currentColor" fillOpacity="0.35"/>
    <path d="M64 8l.8 2 2 .8-2 .8L64 14l-.8-2.4-2-.8 2-.8L64 8z" fill="currentColor" fillOpacity="0.2"/>
    <path d="M14 8l.6 1.6 1.6.6-1.6.6L14 12.4l-.6-1.6-1.6-.6 1.6-.6L14 8z" fill="currentColor" fillOpacity="0.2"/>
  </svg>
)

const ILLUSTRATIONS = {
  tasks:     <IllustrationTasks />,
  members:   <IllustrationMembers />,
  events:    <IllustrationEvents />,
  messages:  <IllustrationMessages />,
  documents: <IllustrationDocuments />,
  finances:  <IllustrationFinances />,
  notes:     <IllustrationNotes />,
  calendar:  <IllustrationCalendar />,
  generic:   <IllustrationGeneric />,
} as const

export type EmptyStateVariant = keyof typeof ILLUSTRATIONS

// ─── Component ────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  variant?: EmptyStateVariant
  title: string
  description?: string
  action?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function EmptyState({
  variant = 'generic',
  title,
  description,
  action,
  size = 'md',
  className,
}: EmptyStateProps) {
  const sizes = {
    sm: { wrapper: 'py-10',      icon: 'w-16 h-14 mb-4', title: 'text-sm',    desc: 'text-xs'  },
    md: { wrapper: 'py-14',      icon: 'w-24 h-20 mb-5', title: 'text-sm',    desc: 'text-xs'  },
    lg: { wrapper: 'py-20',      icon: 'w-32 h-28 mb-6', title: 'text-base',  desc: 'text-sm'  },
  }
  const s = sizes[size]

  return (
    <div className={cn('flex flex-col items-center justify-center text-center px-8', s.wrapper, className)}>
      <div className={cn('text-muted-foreground/40 shrink-0', s.icon)}>
        {ILLUSTRATIONS[variant]}
      </div>
      <p className={cn('font-semibold text-foreground', s.title)}>{title}</p>
      {description && (
        <p className={cn('text-muted-foreground mt-1 max-w-xs leading-relaxed', s.desc)}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
