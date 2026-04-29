'use client'

import { useState } from 'react'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  children: React.ReactNode
  width?: string       // collapsed = w-10, expanded = this
  className?: string
}

export function CollapsibleRail({ children, width = 'w-60', className }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={cn(
        'relative shrink-0 border-r border-white/6 transition-[width] duration-200 ease-in-out overflow-hidden',
        collapsed ? 'w-10' : width,
        className
      )}
    >
      {/* Toggle button — always visible */}
      <button
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? 'Afficher le panneau' : 'Réduire le panneau'}
        className={cn(
          'absolute z-20 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-white/8 hover:text-foreground transition-colors',
          collapsed ? 'top-3 left-2' : 'top-3 right-2'
        )}
      >
        {collapsed
          ? <ChevronsRight className="h-3.5 w-3.5" />
          : <ChevronsLeft className="h-3.5 w-3.5" />
        }
      </button>

      {/* Content fades out when collapsed */}
      <div className={cn(
        'h-full transition-opacity duration-150',
        collapsed ? 'opacity-0 pointer-events-none select-none' : 'opacity-100'
      )}>
        {children}
      </div>
    </div>
  )
}
