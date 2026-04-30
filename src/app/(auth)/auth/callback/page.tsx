'use client'

/**
 * Auth callback — handles two different Supabase redirect flows:
 *
 * 1. PKCE flow (query param):   /auth/callback?code=XXXX&next=/reset-password
 *    → exchangeCodeForSession(code)
 *
 * 2. Implicit / recovery flow (hash):  /auth/callback#access_token=...&type=recovery
 *    → Supabase browser client auto-processes the hash and fires onAuthStateChange
 *
 * Route handlers are server-side and CANNOT read hash fragments, so this
 * must be a client component.
 */

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function Callback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'
    let done = false

    function goTo(path: string) {
      if (done) return
      done = true
      router.replace(path)
    }

    // ── Flow 1: PKCE code (query param) ─────────────────────────────────────
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error: err }) => {
        if (err) {
          console.error('exchangeCodeForSession:', err.message)
          goTo('/login?error=auth_callback_failed')
        } else {
          goTo(next)
        }
      })
      return
    }

    // ── Flow 2: Hash-based tokens (implicit / recovery) ──────────────────────
    // The Supabase browser client detects auth tokens in the hash automatically
    // and fires onAuthStateChange. We subscribe before anything else to avoid
    // missing the event.

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) return
        if (event === 'PASSWORD_RECOVERY') {
          goTo('/reset-password')
        } else if (event === 'SIGNED_IN') {
          goTo(next)
        }
      }
    )

    // Fallback: event may have already fired before we subscribed — check now
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) goTo(next)
    })

    // Hard timeout: if nothing resolved in 8s, something went wrong
    const timer = setTimeout(() => {
      if (!done) {
        setError(true)
        goTo('/login?error=auth_callback_failed')
      }
    }, 8000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) return null

  return (
    <div className="flex flex-col items-center gap-3 py-10">
      {/* Spinner */}
      <svg
        className="h-6 w-6 animate-spin text-white/30"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12" cy="12" r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      <p className="text-sm text-white/30">Connexion en cours…</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <Callback />
    </Suspense>
  )
}
