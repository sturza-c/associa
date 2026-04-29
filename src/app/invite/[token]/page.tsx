import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { acceptInvitation } from '@/lib/actions/invitations'
import { roleLabel } from '@/lib/roles'
import type { RoleLabels, Role } from '@/types/database'
import { Mail, ArrowRight } from 'lucide-react'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params

  const admin = createAdminClient()
  const { data: inv } = await admin
    .from('association_invitations')
    .select('id, association_id, email, role, accepted_at, expires_at, associations(name, accent_color, role_labels, logo_url, description)')
    .eq('token', token)
    .maybeSingle()

  if (!inv) {
    return <Status title="Invitation introuvable" body="Ce lien d'invitation n'existe pas ou a été révoqué." />
  }

  const expired = new Date(inv.expires_at).getTime() < Date.now()
  if (inv.accepted_at) {
    return <Status title="Déjà acceptée" body="Cette invitation a déjà été utilisée." />
  }
  if (expired) {
    return <Status title="Expirée" body="Cette invitation a expiré. Demande à un administrateur d'en générer une nouvelle." />
  }

  const association = Array.isArray(inv.associations) ? inv.associations[0] : inv.associations
  const accent = association?.accent_color ?? '#6366f1'
  const labels = (association?.role_labels as RoleLabels | null) ?? null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Logged in with the right account → auto-accept and go to dashboard.
  if (user && (user.email ?? '').toLowerCase() === inv.email.toLowerCase()) {
    const result = await acceptInvitation(token)
    if (result.success) {
      redirect('/dashboard')
    }
    return <Status title="Erreur" body={result.error ?? 'Impossible d\'accepter l\'invitation.'} />
  }

  // Logged in with the wrong email
  const wrongAccount = user && (user.email ?? '').toLowerCase() !== inv.email.toLowerCase()

  const loginHref = `/login?next=${encodeURIComponent(`/invite/${token}`)}&email=${encodeURIComponent(inv.email)}`
  const registerHref = `/register?next=${encodeURIComponent(`/invite/${token}`)}&email=${encodeURIComponent(inv.email)}`

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md">
        <div
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-md p-8 text-center relative overflow-hidden"
          style={{ boxShadow: `0 0 60px -20px ${accent}33` }}
        >
          <div
            className="absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: accent }}
          />
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 mb-3">Invitation</p>
          <h1 className="text-2xl font-semibold">
            Tu es invité·e à rejoindre{' '}
            <span className="font-serif italic" style={{ color: accent }}>
              {association?.name ?? 'cette association'}
            </span>
          </h1>
          {association?.description && (
            <p className="mt-2 text-sm text-muted-foreground">{association.description}</p>
          )}

          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            {inv.email}
            <span className="text-muted-foreground">·</span>
            <span className="font-medium">{roleLabel(inv.role as Role, labels)}</span>
          </div>

          {wrongAccount ? (
            <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-left">
              Tu es connecté·e avec <strong>{user.email}</strong>. Cette invitation a été envoyée à <strong>{inv.email}</strong>.
              <Link href="/dashboard" className="block mt-2 text-xs underline">Retour au dashboard</Link>
            </div>
          ) : (
            <div className="mt-6 space-y-2">
              <Link
                href={registerHref}
                className="flex items-center justify-center gap-2 w-full rounded-lg py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: accent }}
              >
                Créer un compte <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={loginHref}
                className="block w-full rounded-lg border border-white/10 py-2.5 text-sm font-medium hover:bg-white/5 transition-colors"
              >
                J&apos;ai déjà un compte
              </Link>
            </div>
          )}

          <p className="mt-6 text-[11px] text-muted-foreground">
            Lien valable jusqu&apos;au {new Date(inv.expires_at).toLocaleDateString('fr-CH')}.
          </p>
        </div>
      </div>
    </div>
  )
}

function Status({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md text-center">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-8">
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          <Link href="/login" className="mt-6 inline-block text-sm underline">
            Aller à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}
