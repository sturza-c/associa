'use client'

import { SWRConfig } from 'swr'

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        // Don't refetch the same key more than once every 30 seconds
        dedupingInterval: 30_000,
        // Throttle focus-triggered revalidation to once per minute
        focusThrottleInterval: 60_000,
        // Don't retry on error more than twice
        errorRetryCount: 2,
        // Show cached data while revalidating (no flash-of-skeleton on back-navigation)
        keepPreviousData: true,
        // Revalidate when window regains focus (keep data fresh)
        revalidateOnFocus: true,
        // Don't revalidate on reconnect to avoid burst on mobile
        revalidateOnReconnect: false,
      }}
    >
      {children}
    </SWRConfig>
  )
}
