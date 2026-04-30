'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export function ForgotForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clean = email.trim().toLowerCase()
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError('Adresse e-mail invalide')
      return
    }

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`

    const { error: sbError } = await supabase.auth.resetPasswordForEmail(clean, {
      redirectTo,
    })

    setLoading(false)

    if (sbError) {
      // Don't leak whether an account exists — show a generic error only for
      // real infra failures; rate-limit errors show a friendly message.
      if (sbError.message.toLowerCase().includes('rate')) {
        setError('Trop de demandes. Attendez quelques minutes puis réessayez.')
      } else {
        setError('Une erreur est survenue. Réessayez dans un instant.')
      }
      return
    }

    // Always show success — avoids leaking whether an account exists
    setSent(true)
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div className="px-8 pt-7 pb-8 space-y-4 text-center">
          {/* Checkmark */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] border border-white/10">
            <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white/90">E-mail envoyé</h2>
            <p className="mt-2 text-sm text-white/40 leading-relaxed">
              Si un compte existe pour{' '}
              <span className="text-white/60 font-medium">{email.trim().toLowerCase()}</span>
              , vous recevrez un lien de réinitialisation dans quelques instants.
            </p>
            <p className="mt-2 text-xs text-white/25">
              Pensez à vérifier vos spams.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-block mt-2 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="px-8 pt-7 pb-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white/90 tracking-tight">Mot de passe oublié</h2>
          <p className="text-sm text-white/35 mt-0.5">
            Entrez votre e-mail — nous vous enverrons un lien de réinitialisation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium text-white/50 uppercase tracking-wider">
              Adresse e-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(null) }}
              placeholder="vous@exemple.ch"
              autoComplete="email"
              autoFocus
              className={cn(
                'w-full rounded-xl border bg-white/[0.04] px-4 py-2.5 text-sm text-white/90 placeholder:text-white/20',
                'focus:outline-none focus:ring-2 focus:ring-white/15 focus:border-white/20 transition-all',
                error ? 'border-red-400/50' : 'border-white/[0.08]'
              )}
            />
            {error && <p className="text-xs text-red-400/80">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              'mt-2 w-full rounded-xl py-2.5 text-sm font-semibold transition-all duration-150',
              'bg-white text-[#06070d] hover:bg-white/90 active:scale-[0.99]',
              'shadow-[0_0_24px_rgba(255,255,255,0.10)]',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </form>

        <p className="text-center text-sm text-white/30">
          Vous souvenez ?{' '}
          <Link href="/login" className="text-white/65 hover:text-white/90 transition-colors font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
