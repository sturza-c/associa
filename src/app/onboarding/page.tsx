'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createAssociation } from '@/lib/actions/associations'
import { logout } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { PlusCircle, Clock, ArrowRight } from 'lucide-react'

type View = 'choice' | 'create'

function Shell({ eyebrow, subtitle, children }: { eyebrow: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-violet-500/10 blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-blue-500/10 blur-[140px]"
      />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-semibold mb-3">
            {eyebrow}
          </p>
          <h1 className="font-heading text-5xl italic leading-none">Associa</h1>
          <p className="text-muted-foreground mt-4 text-sm">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [view, setView] = useState<View>('choice')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createAssociation(formData)

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    toast.success('Association créée avec succès !')
    router.push('/dashboard')
    router.refresh()
  }

  if (view === 'choice') {
    return (
      <Shell eyebrow="Bienvenue" subtitle="Comment souhaitez-vous commencer ?">
        <div className="rounded-2xl border border-white/8 bg-white/[0.04] backdrop-blur-xl shadow-2xl overflow-hidden divide-y divide-white/5">
          <button
            onClick={() => setView('create')}
            className="group w-full text-left flex items-start gap-4 p-5 hover:bg-white/4 transition-colors"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">
                <span className="font-heading italic font-normal">Créer</span> une association
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Vous devenez président·e et pouvez inviter des membres.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 mt-4" />
          </button>

          <button
            onClick={() => toast.info('Demandez au président de votre association de vous inviter via votre adresse e-mail.')}
            className="group w-full text-left flex items-start gap-4 p-5 hover:bg-white/4 transition-colors"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-muted-foreground ring-1 ring-white/10">
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">
                <span className="font-heading italic font-normal">Attendre</span> une invitation
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Un président doit vous inviter via votre adresse e-mail.
              </p>
            </div>
          </button>
        </div>

        <p className="text-center mt-6 text-xs text-muted-foreground">
          Mauvais compte ?{' '}
          <button onClick={() => logout()} className="underline hover:text-foreground transition-colors">
            Se déconnecter
          </button>
        </p>
      </Shell>
    )
  }

  return (
    <Shell eyebrow="Nouvelle association" subtitle="Créez votre espace de gestion.">
      <Card className="border-white/8 bg-white/[0.04] backdrop-blur-xl shadow-2xl">
        <CardHeader>
          <CardTitle className="text-xl">
            <span className="font-heading italic font-normal">Nouvelle</span> association
          </CardTitle>
          <CardDescription>
            Vous serez automatiquement défini·e comme président·e.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l&apos;association</Label>
              <Input id="name" name="name" placeholder="Ex: Club de tennis de Lausanne" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description <span className="text-muted-foreground">(optionnel)</span></Label>
              <Input id="description" name="description" placeholder="Une courte description..." />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Création...' : 'Créer mon association'}
            </Button>
            <button
              type="button"
              onClick={() => setView('choice')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Retour
            </button>
          </CardFooter>
        </form>
      </Card>
    </Shell>
  )
}
