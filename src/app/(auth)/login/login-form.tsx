'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
})

type FormData = z.infer<typeof schema>

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'
  const prefillEmail = searchParams.get('email') ?? ''
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: prefillEmail, password: '' },
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      toast.error('Identifiants incorrects. Veuillez réessayer.')
      setLoading(false)
      return
    }
    router.push(next)
    router.refresh()
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden">
      {/* Top edge highlight */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="px-8 pt-7 pb-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white/90 tracking-tight">Connexion</h2>
          <p className="text-sm text-white/35 mt-0.5">Accédez à votre espace association.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium text-white/50 uppercase tracking-wider">
              Adresse e-mail
            </label>
            <input
              id="email"
              type="email"
              placeholder="vous@exemple.ch"
              autoComplete="email"
              {...register('email')}
              className={cn(
                'w-full rounded-xl border bg-white/[0.04] px-4 py-2.5 text-sm text-white/90 placeholder:text-white/20',
                'focus:outline-none focus:ring-2 focus:ring-white/15 focus:border-white/20 transition-all',
                errors.email ? 'border-red-400/50' : 'border-white/[0.08]'
              )}
            />
            {errors.email && (
              <p className="text-xs text-red-400/80">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-medium text-white/50 uppercase tracking-wider">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
              className={cn(
                'w-full rounded-xl border bg-white/[0.04] px-4 py-2.5 text-sm text-white/90 placeholder:text-white/20',
                'focus:outline-none focus:ring-2 focus:ring-white/15 focus:border-white/20 transition-all',
                errors.password ? 'border-red-400/50' : 'border-white/[0.08]'
              )}
            />
            {errors.password && (
              <p className="text-xs text-red-400/80">{errors.password.message}</p>
            )}
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
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-sm text-white/30">
          Pas encore de compte ?{' '}
          <Link
            href={`/register${next !== '/dashboard' ? `?next=${encodeURIComponent(next)}${prefillEmail ? `&email=${encodeURIComponent(prefillEmail)}` : ''}` : ''}`}
            className="text-white/65 hover:text-white/90 transition-colors font-medium"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}
