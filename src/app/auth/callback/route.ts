import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Supabase auth callback — handles:
 *  • Password-reset links  (type=recovery   → redirects to /reset-password)
 *  • Email-confirmation    (type=signup      → redirects to `next` or /dashboard)
 *  • Magic-link login      (type=magiclink   → redirects to `next` or /dashboard)
 *
 * Supabase sends the user here with ?code=<PKCE code>&next=<path>
 * We exchange the code for a session (sets auth cookies), then redirect.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    // No code → just redirect home; Supabase will handle invalid states
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('auth/callback exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  // Successful exchange — redirect to intended page (e.g. /reset-password)
  return NextResponse.redirect(`${origin}${next}`)
}
