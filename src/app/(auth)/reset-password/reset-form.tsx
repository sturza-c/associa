'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export function ResetForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; general?: string }>({})

  // Guard: if Supabase didn't establish a session (e.g. link expired or
  // user navigated here directly), send them back to forgot-password.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/forgot-password?error=session_expired')
      }
    })
  }, [router])

  function validate() {
    const e: typeof errors = {}
    if (password.length < 8) e.password = 'Le mot de passe doit contenir au moins 8 caractères'
    if (password !== confirm) e.confirm = 'Les mots de passe ne correspondent pas'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors({})

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (error) {
      if (error.message.toLowerCase().includes('same password')) {
        setErrors({ general: 'Ce mot de passe est identique à l\'ancien. Choisissez-en un nouveau.' })
      } else {
        setErrors({ general: 'Une erreur est survenue. Le lien a peut-être expiré — demandez-en un nouveau.' })
      }
      return
    }

    setDone(true)
    // Brief success pause, then redirect to dashboard
    setTimeout(() => router.replace('/dashboard'), 2000)
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <div className="px-8 pt-7 pb-8 space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] border border-white/10">
            <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white/90">Mot de passe modifié</h2>
            <p className="mt-2 text-sm text-white/40">
              Redirection vers votre espace…
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="px-8 pt-7 pb-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white/90 tracking-tight">Nouveau mot de passe</h2>
          <p className="text-sm text-white/35 mt-0.5">
            Choisissez un mot de passe sécurisé d'au moins 8 caractères.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-medium text-white/50 uppercase tracking-wider">
              Nouveau mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors({}) }}
              placeholder="8 caractères minimum"
              autoComplete="new-password"
              autoFocus
              className={cn(
                'w-full rounded-xl border bg-white/[0.04] px-4 py-2.5 text-sm text-white/90 placeholder:text-white/20',
                'focus:outline-none focus:ring-2 focus:ring-white/15 focus:border-white/20 transition-all',
                errors.password ? 'border-red-400/50' : 'border-white/[0.08]'
              )}
            />
            {errors.password && <p className="text-xs text-red-400/80">{errors.password}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm" className="text-xs font-medium text-white/50 uppercase tracking-wider">
              Confirmer le mot de passe
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setErrors({}) }}
              placeholder="••••••••"
              autoComplete="new-password"
              className={cn(
                'w-full rounded-xl border bg-white/[0.04] px-4 py-2.5 text-sm text-white/90 placeholder:text-white/20',
                'focus:outline-none focus:ring-2 focus:ring-white/15 focus:border-white/20 transition-all',
                errors.confirm ? 'border-red-400/50' : 'border-white/[0.08]'
              )}
            />
            {errors.confirm && <p className="text-xs text-red-400/80">{errors.confirm}</p>}
          </div>

          {errors.general && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3">
              <p className="text-xs text-red-300/80">{errors.general}</p>
            </div>
          )}

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
            {loading ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  )
}
