import { redirect } from 'next/navigation'
import { getUserMemberships } from '@/lib/actions/associations'
import AssociationPicker from './association-picker'

export default async function SelectPage() {
  const memberships = await getUserMemberships()

  if (memberships.length === 0) redirect('/onboarding')
  if (memberships.length === 1) redirect('/dashboard')

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

      <div className="relative w-full max-w-lg">
        <div className="text-center mb-10">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-semibold mb-3">
            Sélection
          </p>
          <h1 className="font-heading text-5xl italic leading-none">Associa</h1>
          <p className="text-muted-foreground mt-4 text-sm">
            Choisissez une <span className="font-heading italic">association</span> pour continuer.
          </p>
        </div>
        <AssociationPicker memberships={memberships} />
      </div>
    </div>
  )
}
