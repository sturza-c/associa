import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Start with a mutable copy of the incoming request headers.
  // We'll stamp x-user-id on these so server components can read it via headers().
  const requestHeaders = new Headers(request.headers)

  // supabaseResponse will be rebuilt inside setAll if cookies need refreshing.
  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Propagate refreshed cookies to the request so downstream handlers
          // (server components, server actions) see the new token.
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
            requestHeaders.set('cookie', request.cookies.toString())
          })
          // Rebuild the response carrying both the updated request headers
          // and the Set-Cookie headers for the browser.
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Single auth.getUser() call for the entire request lifecycle.
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Stamp the verified user ID on the REQUEST headers so the layout and
    // API routes can read it without a second auth roundtrip.
    requestHeaders.set('x-user-id', user.id)

    // Rebuild the response one more time so it carries the x-user-id header
    // in the forwarded request (preserving any cookie updates from setAll).
    const finalResponse = NextResponse.next({
      request: { headers: requestHeaders },
    })
    // Copy any Set-Cookie headers that setAll may have put on supabaseResponse
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...opts }) =>
      finalResponse.cookies.set(name, value, opts)
    )
    return finalResponse
  }

  // Protect dashboard pages and API routes
  if (
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/api/')
  ) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
