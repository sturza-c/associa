// Private beta gate: only e-mails listed in BETA_ALLOWED_EMAILS (comma-separated) can use the app.
// Empty or unset → the app is closed to everyone; visitors are sent to the waitlist on the landing page.
// Kept dependency-free so it runs in the middleware.

export function isBetaAllowed(email: string | null | undefined): boolean {
  if (!email) return false
  const list = (process.env.BETA_ALLOWED_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.trim().toLowerCase())
}

/** App routes that require a beta seat. Public pages (/, /a/[slug], /preview, auth pages) stay open. */
export function isGatedPath(path: string): boolean {
  if (path.startsWith('/api/calendar/')) return false // token-based calendar feeds
  return ['/dashboard', '/select', '/onboarding', '/register', '/invite', '/admin', '/api'].some(p => path === p || path.startsWith(p + '/'))
}
