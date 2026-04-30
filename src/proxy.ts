import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/a/')

  // Detect Supabase session cookie (any cookie starting with sb-)
  const hasSession = request.cookies.getAll().some(c => c.name.startsWith('sb-'))

  // Never redirect away from auth routes in the middleware — avoids redirect loops
  // when Supabase rate-limits or the session is stale. The login page handles
  // post-login navigation itself.
  if (isAuthRoute) {
    return NextResponse.next()
  }

  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
