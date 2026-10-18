import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight, Check, Users, BadgePercent, Wallet, CalendarDays, Calendar, CheckSquare, MessageSquare,
  FileText, Globe, ImagePlus, Lock, Sparkles, Folder, Plus, Mail,
} from 'lucide-react'
import { AssociaLogo } from '@/components/brand/associa-logo'
import { PILOT_SPOTS } from '@/lib/waitlist-config'
import { Reveal, VideoButton, WaitlistForm } from './client'
import { cn } from '@/lib/utils'

// Marketing page shown on getassocia.me to visitors (members are redirected to the dashboard).

const NAVY = '#091B46'

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('inline-flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.28em] text-violet-300/90', className)}>
      <span className="h-px w-8 bg-violet-400/70" />{children}
    </p>
  )
}

function Glass({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-3xl border border-white/[0.08] bg-[#0d1226]/80 backdrop-blur-xl shadow-[0_40px_100px_-30px_rgba(0,0,0,.8)]', className)}>
      {children}
    </div>
  )
}

function Spots({ left, className }: { left: number; className?: string }) {
  const taken = PILOT_SPOTS - left
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: PILOT_SPOTS }, (_, i) => (
          <span key={i} className={cn('h-2.5 w-5 rounded-full', i < taken ? 'bg-white/15' : 'bg-gradient-to-r from-violet-400 to-indigo-300 shadow-[0_0_12px_rgba(167,139,250,.6)]')} />
        ))}
      </div>
      <span className="text-sm text-white/70">
        {left > 0
          ? <><strong className="text-white">{left} place{left > 1 ? 's' : ''}</strong> restante{left > 1 ? 's' : ''} sur {PILOT_SPOTS}</>
          : <>Programme pilote complet — liste d&apos;attente ouverte</>}
      </span>
    </div>
  )
}

function BrowserFrame({ src, alt, className, priority }: { src: string; alt: string; className?: string; priority?: boolean }) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-white/10 bg-[#05060d] shadow-[0_60px_140px_-30px_rgba(0,0,0,.9),0_0_120px_-20px_rgba(124,58,237,.35)]', className)}>
      <div className="relative flex h-9 items-center gap-2 border-b border-white/[0.06] bg-[#0b0c15] px-4">
        <i className="h-2.5 w-2.5 rounded-full bg-white/15" /><i className="h-2.5 w-2.5 rounded-full bg-white/15" /><i className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-md bg-white/[0.05] px-3 py-1 text-[11px] text-white/50">
          <Lock className="h-2.5 w-2.5" />getassocia.me
        </span>
      </div>
      <Image src={src} alt={alt} width={2160} height={1350} priority={priority} className="block h-auto w-full" sizes="(max-width: 1024px) 100vw, 1100px" />
    </div>
  )
}

function Phone({ className }: { className?: string }) {
  return (
    <div className={cn('relative w-[290px] rounded-[46px] border-[9px] border-[#1b1c25] bg-[#07080e] p-4 pt-3 shadow-[0_50px_120px_-20px_rgba(0,0,0,.9)] ring-1 ring-white/10', className)}>
      <div className="mx-auto mb-3 h-6 w-24 rounded-full bg-black" />
      <div className="rounded-xl bg-white/[0.06] px-3 py-1.5 text-center text-[10px] text-white/55">🔒 getassocia.me/a/esprits-curieux</div>
      <div className="-mx-4 mt-3 bg-gradient-to-br from-violet-500/20 to-transparent px-4 py-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/20 text-xs font-bold text-violet-300">AEC</div>
        <p className="mt-3 text-[8px] font-semibold tracking-[0.18em] text-white/45">PAGE PUBLIQUE</p>
        <p className="font-heading italic text-[21px] leading-tight text-white">Association des Esprits Curieux</p>
      </div>
      <p className="mt-2 mb-2 text-[8px] font-semibold tracking-[0.16em] text-white/45">PROCHAINS ÉVÉNEMENTS</p>
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3">
        <div className="flex gap-3">
          <div className="flex h-11 w-10 flex-col items-center justify-center rounded-xl bg-violet-500/20 leading-none text-violet-200"><span className="text-[8px] font-bold">MAI</span><b className="text-base">22</b></div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-white">Café littéraire : L&apos;Étranger</p>
            <p className="text-[10px] text-white/50">Dans 5 j · 18:30 · Salle B204</p>
            <p className="text-[10px] text-amber-300">18 places restantes</p>
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-[11px] text-white/85">Sophie Marchand</div>
          <div className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-[11px] text-white/85">sophie.marchand@unine.ch</div>
          <div className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/15 py-2 text-[11px] font-semibold text-emerald-300"><Check className="h-3 w-3" />Inscription confirmée !</div>
        </div>
      </div>
      <div className="mt-2 flex gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-3 opacity-60">
        <div className="flex h-11 w-10 flex-col items-center justify-center rounded-xl bg-violet-500/20 leading-none text-violet-200"><span className="text-[8px] font-bold">MAI</span><b className="text-base">28</b></div>
        <div><p className="text-[12px] font-semibold text-white">Ciné-club : 1984</p><p className="text-[10px] text-white/50">Dans 11 j · 19:00</p></div>
      </div>
    </div>
  )
}

const CHAOS = [
  { who: 'Maxime', t: 'Qui a payé sa cotisation ?? 😅', r: -3 },
  { file: 'Trésorerie_FINAL_v3 (2).xlsx', r: 2 },
  { who: 'Chloé', t: "Quelqu'un a le PV de la dernière AG ?", r: -1.5 },
  { cal: 'Salle B204 — pas réservée pour jeudi', r: 2.5 },
  { who: 'Antoine', t: "Le lien pour s'inscrire, c'est lequel ?", r: -2 },
  { file: 'membres_liste_OK_vraiment.xlsx', r: 1.5 },
  { who: 'Inès', t: 'On sera combien jeudi ?', r: -2.5 },
  { who: 'Thomas', t: 'Qui a les photos de la soirée ?', r: 2 },
]

const FAQ = [
  ['Associa est-il prêt ?', 'La plateforme tourne déjà : membres, cotisations, finances, événements, inscriptions, agenda, tâches, messages, documents et photos. Nous finalisons les derniers détails avec les associations pilotes avant l’ouverture publique.'],
  ['Pour quelles associations ?', 'Associations étudiantes, culturelles, sportives et à but non lucratif — de quelques membres à plusieurs centaines.'],
  ['Mes membres doivent-ils créer un compte pour s’inscrire à un événement ?', 'Non. Ils s’inscrivent depuis votre page publique avec leur nom et leur e-mail, et reçoivent une confirmation. Les inscriptions arrivent directement dans votre espace.'],
  ['Que se passe-t-il après mon inscription à la waitlist ?', 'Nous vous recontactons personnellement pour une courte présentation et pour préparer l’espace de votre association.'],
]

export function Landing({ spotsLeft }: { spotsLeft: number }) {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#03050d] text-white antialiased selection:bg-violet-500/40">
      {/* ambient light */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[1400px]">
        <div className="absolute -top-60 left-1/2 h-[900px] w-[1300px] -translate-x-1/2 rounded-full opacity-70" style={{ background: `radial-gradient(closest-side, ${NAVY}, transparent)` }} />
        <div className="absolute top-40 -left-40 h-[600px] w-[600px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute top-80 -right-40 h-[600px] w-[600px] rounded-full bg-blue-600/15 blur-[120px]" />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.5]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.035) 1px, transparent 1.3px)', backgroundSize: '34px 34px' }} />

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#03050d]/70 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" aria-label="Associa"><AssociaLogo className="h-[22px] text-white" /></Link>
          <div className="hidden items-center gap-8 text-sm text-white/60 md:flex">
            <a href="#fonctionnalites" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#inscriptions" className="hover:text-white transition-colors">Inscriptions</a>
            <a href="#pilote" className="hover:text-white transition-colors">Programme pilote</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
                        <a href="#waitlist" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#091B46] hover:bg-white/90 transition-colors">Rejoindre la waitlist</a>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative mx-auto max-w-6xl px-5 pt-16 pb-10 text-center sm:pt-24">
        <Reveal>
          <a href="#pilote" className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[13px] text-white/75 backdrop-blur-md hover:bg-white/[0.07]">
            <span className="relative flex h-2 w-2"><span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" /><span className="relative h-2 w-2 rounded-full bg-emerald-400" /></span>
            Bêta privée · {PILOT_SPOTS} associations pilotes
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mx-auto mt-8 max-w-4xl font-heading text-[52px] italic leading-[0.98] tracking-[-0.01em] sm:text-[88px]">
            Gérez votre association{' '}
            <span className="bg-gradient-to-r from-violet-200 via-indigo-200 to-sky-200 bg-clip-text text-transparent">simplement.</span>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mx-auto mt-7 max-w-2xl text-[17px] leading-relaxed text-white/60 sm:text-lg">
            Membres, cotisations, événements, inscriptions, agenda, documents, photos : tout votre bureau réuni dans un seul espace.
            Pensé en Suisse pour les associations étudiantes et à but non lucratif.
          </p>
        </Reveal>
        <Reveal delay={240} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="#waitlist" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-[15px] font-semibold text-[#091B46] shadow-[0_20px_60px_-15px_rgba(167,139,250,.7)] hover:bg-white/90 transition">
            Réserver une place <ArrowRight className="h-4 w-4" />
          </a>
          <VideoButton />
        </Reveal>
        <Reveal delay={300} className="mt-7 flex justify-center"><Spots left={spotsLeft} className="justify-center" /></Reveal>

        {/* product shot */}
        <Reveal delay={350} className="relative mx-auto mt-16 max-w-5xl [perspective:2000px]">
          <div className="[transform:rotateX(10deg)] origin-top">
            <BrowserFrame src="/landing/dashboard.webp" alt="Tableau de bord Associa" priority />
          </div>
          <div aria-hidden className="absolute -bottom-10 left-1/2 h-40 w-[80%] -translate-x-1/2 rounded-full bg-violet-600/30 blur-[90px]" />

          <Glass className="absolute -left-10 top-[38%] hidden w-[300px] p-5 text-left lg:block">
            <div className="flex items-center justify-between"><p className="font-heading italic text-xl">Cotisations 2025–26</p><span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">90 %</span></div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[90%] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-[0_0_16px_rgba(16,185,129,.6)]" /></div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[['257', 'Membres', 'text-white'], ['231', 'Réglé', 'text-emerald-300'], ['26', 'En attente', 'text-amber-300']].map(([n, l, c]) => (
                <div key={l} className="rounded-xl bg-white/[0.04] py-2"><b className={cn('block text-lg', c)}>{n}</b><span className="text-[10px] text-white/45">{l}</span></div>
              ))}
            </div>
          </Glass>
          <Glass className="absolute -right-8 top-[16%] hidden w-[290px] p-4 text-left lg:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Nouvelle inscription</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-400/15 text-xs font-bold text-emerald-300">SM</div>
              <div><p className="text-sm font-semibold">Sophie Marchand</p><p className="text-xs text-white/50">Café littéraire · via le lien public</p></div>
            </div>
          </Glass>
          <Glass className="absolute -right-12 bottom-[8%] hidden w-[250px] p-3 text-left lg:block">
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Image key={i} src={`/demo/souvenirs/s${i}.jpg`} alt="" width={160} height={160} className="aspect-square rounded-lg object-cover" />
              ))}
            </div>
            <p className="mt-2 flex items-center gap-1.5 px-1 text-xs text-white/60"><ImagePlus className="h-3.5 w-3.5" />Souvenirs · 8 photos</p>
          </Glass>
        </Reveal>
      </section>

      {/* ── Problem ── */}
      <section className="relative mx-auto max-w-6xl px-5 py-28 text-center sm:py-36">
        <Reveal><Eyebrow>Le quotidien d&apos;un comité</Eyebrow></Reveal>
        <Reveal delay={80}>
          <h2 className="mx-auto mt-6 max-w-3xl font-heading text-5xl italic leading-[1.02] sm:text-7xl">
            Cent messages. Trois Excel. <span className="text-white/40">Zéro vue d&apos;ensemble.</span>
          </h2>
        </Reveal>
        <Reveal delay={160} className="mx-auto mt-14 flex max-w-4xl flex-wrap justify-center gap-3">
          {CHAOS.map((c, i) => (
            <div key={i} style={{ transform: `rotate(${c.r}deg)` }}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#151829]/90 px-4 py-3 text-left shadow-xl">
              <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white',
                c.file ? 'bg-gradient-to-br from-green-600 to-green-800' : c.cal ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-green-500 to-green-700')}>
                {c.file ? <FileText className="h-4 w-4" /> : c.cal ? <Calendar className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
              </span>
              <span className="text-[14px] text-white/85">
                {c.who && <span className="text-white/45">{c.who} : </span>}{c.t ?? c.file ?? c.cal}
              </span>
            </div>
          ))}
        </Reveal>
        <Reveal delay={240}>
          <p className="mx-auto mt-14 max-w-xl text-lg text-white/60">Gérer une association ne devrait pas être un second job. Associa remplace les groupes, les fichiers et les relances par un seul espace partagé.</p>
        </Reveal>
      </section>

      {/* ── Features ── */}
      <section id="fonctionnalites" className="relative mx-auto max-w-6xl scroll-mt-20 px-5 pb-28">
        <div className="text-center">
          <Reveal><Eyebrow>Fonctionnalités</Eyebrow></Reveal>
          <Reveal delay={80}><h2 className="mt-6 font-heading text-5xl italic leading-[1.02] sm:text-7xl">Tout votre bureau. <span className="text-white/40">Un seul endroit.</span></h2></Reveal>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-6">
          {/* Membres */}
          <Reveal className="md:col-span-3">
            <Glass className="h-full overflow-hidden p-7">
              <Feature icon={Users} title="Membres" text="Rôles, postes, invitations : chaque membre à sa place." />
              <div className="mt-6 space-y-2">
                {[['LR', 'Léa Rousseau', 'Présidente', 'text-violet-300 bg-violet-400/10 ring-violet-400/30'], ['MB', 'Maxime Bernard', 'Secrétaire', 'text-sky-300 bg-sky-400/10 ring-sky-400/30'], ['CM', 'Chloé Martin', 'Trésorière', 'text-emerald-300 bg-emerald-400/10 ring-emerald-400/30']].map(([a, n, r, c]) => (
                  <div key={n} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-500/15 text-[11px] font-bold text-violet-300">{a}</span>
                    <span className="flex-1 text-sm font-medium">{n}</span>
                    <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1', c)}>{r}</span>
                  </div>
                ))}
              </div>
            </Glass>
          </Reveal>
          {/* Cotisations */}
          <Reveal className="md:col-span-3" delay={80}>
            <Glass className="h-full p-7">
              <Feature icon={BadgePercent} title="Cotisations" text="Qui a payé, qui doit encore. Suivies en temps réel, relances par e-mail." />
              <div className="mt-6 rounded-2xl bg-white/[0.03] p-5">
                <div className="flex justify-between text-sm"><span className="text-white/55">Taux de recouvrement</span><b className="text-emerald-300">90 %</b></div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[90%] rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300" /></div>
                <div className="mt-2 flex justify-between text-xs text-white/40"><span>6 930,00 CHF collectés</span><span>7 710,00 CHF attendus</span></div>
              </div>
            </Glass>
          </Reveal>
          {/* Finances */}
          <Reveal className="md:col-span-2">
            <Glass className="h-full p-7">
              <Feature icon={Wallet} title="Finances" text="Recettes, dépenses et budgets par événement." />
              <p className="mt-6 text-4xl font-bold tracking-tight">12 226,00 <span className="text-lg text-white/45">CHF</span></p>
              <svg viewBox="0 0 300 60" className="mt-3 w-full"><defs><linearGradient id="lg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#10b981" stopOpacity=".35" /><stop offset="1" stopColor="#10b981" stopOpacity="0" /></linearGradient></defs>
                <path d="M0 52 L40 30 L80 24 L120 22 L160 15 L200 17 L240 12 L300 6 L300 60 L0 60Z" fill="url(#lg)" /><path d="M0 52 L40 30 L80 24 L120 22 L160 15 L200 17 L240 12 L300 6" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinejoin="round" /></svg>
            </Glass>
          </Reveal>
          {/* Événements */}
          <Reveal className="md:col-span-2" delay={80}>
            <Glass className="h-full p-7">
              <Feature icon={CalendarDays} title="Événements" text="Participants, budget et tâches de chaque événement, de A à Z." />
              <div className="mt-6 rounded-2xl bg-white/[0.03] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-10 flex-col items-center justify-center rounded-xl bg-violet-500/20 leading-none text-violet-200"><span className="text-[8px] font-bold">MAI</span><b>22</b></div>
                  <p className="text-sm font-semibold">Café littéraire : L&apos;Étranger</p>
                </div>
                <div className="mt-3 flex gap-1.5 text-[11px]">
                  <span className="flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-emerald-300"><Check className="h-3 w-3" />Je participe</span>
                  <span className="rounded-lg border border-white/10 px-2 py-1 text-white/50">Peut-être</span>
                </div>
              </div>
            </Glass>
          </Reveal>
          {/* Agenda */}
          <Reveal className="md:col-span-2" delay={160}>
            <Glass className="h-full p-7">
              <Feature icon={Calendar} title="Agenda" text="Événements et échéances, synchronisés avec Google, Apple ou Outlook." />
              <div className="mt-6 grid grid-cols-7 gap-1">
                {Array.from({ length: 28 }, (_, i) => {
                  const dot = ({ 4: '#6366f1', 9: '#ef4444', 11: '#6366f1', 17: '#6366f1', 19: '#ef4444', 21: '#6366f1', 24: '#f59e0b' } as Record<number, string>)[i]
                  return <span key={i} className={cn('relative h-7 rounded-md bg-white/[0.04] text-[10px] text-white/50 pl-1 pt-0.5', i === 16 && 'bg-white text-[#091B46] font-bold')}>{i + 1}{dot && <i className="absolute inset-x-1 bottom-1 h-1 rounded-full" style={{ background: dot }} />}</span>
                })}
              </div>
            </Glass>
          </Reveal>
          {/* Tâches */}
          <Reveal className="md:col-span-3">
            <Glass className="h-full p-7">
              <Feature icon={CheckSquare} title="Tâches" text="Vos tâches personnelles, celles du comité et par groupe de travail." />
              <div className="mt-6 inline-flex gap-1 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1 text-xs">
                <span className="rounded-lg bg-white/10 px-3 py-1.5 text-white">Personnelles</span><span className="px-3 py-1.5 text-white/50">Équipe</span><span className="px-3 py-1.5 text-white/50">Groupes</span>
              </div>
              <div className="mt-3 space-y-1">
                {[['Relire le chapitre 3 avant jeudi', true], ['Rappeler la librairie', false], ['Préparer mon intervention pour l’AG', false]].map(([t, d]) => (
                  <div key={String(t)} className="flex items-center gap-3 rounded-lg px-1 py-2 text-sm">
                    <span className={cn('grid h-5 w-5 place-items-center rounded-full border-2', d ? 'border-violet-500 bg-violet-500' : 'border-white/25')}>{d && <Check className="h-3 w-3" />}</span>
                    <span className={cn(d && 'text-white/40 line-through')}>{t}</span>
                  </div>
                ))}
              </div>
            </Glass>
          </Reveal>
          {/* Messages */}
          <Reveal className="md:col-span-3" delay={80}>
            <Glass className="h-full p-7">
              <Feature icon={MessageSquare} title="Messages" text="Fini les groupes WhatsApp : le comité discute au même endroit." />
              <div className="mt-6 space-y-2">
                <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-white/[0.07] bg-white/[0.05] px-4 py-2.5 text-sm"><span className="block text-[11px] text-white/40">Antoine</span>Je vote pour Fahrenheit 451 !</div>
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-violet-600 to-violet-500 px-4 py-2.5 text-sm shadow-lg shadow-violet-900/40">Super ! On vote pour Fahrenheit 451.</div>
              </div>
            </Glass>
          </Reveal>
          {/* Documents */}
          <Reveal className="md:col-span-6">
            <Glass className="grid items-center gap-8 overflow-hidden p-7 md:grid-cols-2">
              <div>
                <Feature icon={FileText} title="Documents" text="Ordres du jour, PV, statuts, rapports : toute la paperasse rangée en dossiers, accessible au bon moment." />
              </div>
              <div className="rounded-2xl bg-white/[0.03] p-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-400/15 text-amber-300"><Folder className="h-4 w-4" /></span>Assemblées générales</p>
                {['Ordre du jour AG 2026.pdf', 'Convocation AG 2026.pdf', 'PV Assemblée Générale 2025.pdf'].map(d => (
                  <div key={d} className="flex items-center gap-3 border-t border-white/[0.06] py-2.5 text-sm">
                    <span className="grid h-8 w-7 place-items-center rounded-md bg-red-500/15 text-[9px] font-extrabold text-red-300">PDF</span>{d}
                  </div>
                ))}
              </div>
            </Glass>
          </Reveal>
        </div>
      </section>

      {/* ── Spotlight: public link ── */}
      <section id="inscriptions" className="relative scroll-mt-20 overflow-hidden border-y border-white/[0.06] bg-gradient-to-b from-[#091B46]/40 to-transparent py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-5 lg:grid-cols-2">
          <div>
            <Reveal><Eyebrow>Inscriptions</Eyebrow></Reveal>
            <Reveal delay={80}><h2 className="mt-6 font-heading text-5xl italic leading-[1.02] sm:text-7xl">Un lien, et chacun <span className="bg-gradient-to-r from-violet-200 to-sky-200 bg-clip-text text-transparent">s&apos;inscrit.</span></h2></Reveal>
            <Reveal delay={160}>
              <ul className="mt-9 space-y-4 text-[17px] text-white/70">
                {[
                  [Globe, 'Votre page publique affiche le programme de l’association.'],
                  [Users, 'Membres et invités s’inscrivent sans créer de compte.'],
                  [Mail, 'Places restantes en direct et confirmation par e-mail.'],
                  [Sparkles, 'Chaque inscription arrive directement dans votre espace.'],
                ].map(([Icon, t], i) => {
                  const I = Icon as typeof Globe
                  return <li key={i} className="flex gap-4"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-300"><I className="h-4 w-4" /></span><span>{t as string}</span></li>
                })}
              </ul>
            </Reveal>
          </div>
          <Reveal delay={120} className="relative mx-auto flex justify-center">
            <Phone className="relative z-10 -rotate-2" />
            <Glass className="absolute -right-4 bottom-10 z-20 hidden w-[300px] p-5 sm:block lg:-right-20">
              <div className="flex items-center justify-between"><p className="font-heading italic text-xl">Inscriptions</p><span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">5 via le lien</span></div>
              {[['SM', 'Sophie Marchand', true], ['JF', 'Julien Favre', false], ['ER', 'Emma Rochat', false]].map(([a, n, isNew]) => (
                <div key={String(n)} className={cn('mt-2 flex items-center gap-3 rounded-xl px-2 py-2', isNew && 'bg-emerald-400/10')}>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-400/15 text-[11px] font-bold text-emerald-300">{a}</span>
                  <span className="flex-1 text-sm font-medium">{n}</span>
                  {isNew && <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Nouveau</span>}
                </div>
              ))}
            </Glass>
          </Reveal>
        </div>
      </section>

      {/* ── Spotlight: photos ── */}
      <section className="relative mx-auto max-w-6xl px-5 py-28">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <Reveal><Eyebrow>Souvenirs</Eyebrow></Reveal>
            <Reveal delay={80}><h2 className="mt-6 font-heading text-5xl italic leading-[1.02] sm:text-7xl">Et les souvenirs <span className="text-white/40">restent.</span></h2></Reveal>
            <Reveal delay={160}><p className="mt-7 max-w-md text-[17px] leading-relaxed text-white/65">Chaque événement a son album. Tous les membres y déposent leurs photos : elles ne se perdent plus au fond des conversations, et l’histoire de l’association se construit au fil des années.</p></Reveal>
          </div>
          <Reveal delay={120} className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i, k) => (
              <div key={i} className={cn('overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl', k === 1 && 'translate-y-6', k === 4 && 'translate-y-6')}>
                <Image src={`/demo/souvenirs/s${i}.jpg`} alt="" width={600} height={600} className="aspect-square h-full w-full object-cover transition duration-700 hover:scale-105" />
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Video ── */}
      <section className="relative mx-auto max-w-5xl px-5 pb-28 text-center">
        <Reveal><Eyebrow>Associa en 45 secondes</Eyebrow></Reveal>
        <Reveal delay={100} className="relative mt-10">
          <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/10 shadow-[0_60px_140px_-30px_rgba(0,0,0,.9)]">
            <Image src="/video/associa-45s-poster.jpg" alt="Vidéo de présentation d'Associa" width={1600} height={900} className="h-auto w-full" />
            <div className="absolute inset-0 grid place-items-center bg-black/25"><VideoButton className="scale-110" /></div>
          </div>
        </Reveal>
      </section>

      {/* ── How it works ── */}
      <section className="relative mx-auto max-w-6xl px-5 pb-28">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['01', 'Créez l’espace', 'Le nom, le logo, le comité : votre association est prête en quelques minutes.'],
            ['02', 'Invitez le comité', 'Chacun retrouve ses tâches, les documents et les discussions au même endroit.'],
            ['03', 'Partagez votre lien', 'Votre page publique présente le programme et gère les inscriptions.'],
          ].map(([n, t, d], i) => (
            <Reveal key={n} delay={i * 80}>
              <Glass className="h-full p-7">
                <span className="font-heading text-5xl italic text-violet-300/80">{n}</span>
                <h3 className="mt-4 text-xl font-semibold">{t}</h3>
                <p className="mt-2 text-white/55">{d}</p>
              </Glass>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Pilot + waitlist ── */}
      <section id="pilote" className="relative scroll-mt-20 overflow-hidden py-28">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 60% at 50% 50%, ${NAVY} 0%, transparent 70%)` }} />
        <div id="waitlist" className="relative mx-auto grid max-w-6xl scroll-mt-24 items-start gap-14 px-5 lg:grid-cols-2">
          <div>
            <Reveal><Eyebrow>Programme pilote</Eyebrow></Reveal>
            <Reveal delay={80}><h2 className="mt-6 font-heading text-5xl italic leading-[1.02] sm:text-7xl">{PILOT_SPOTS} associations. <span className="text-white/40">Pas une de plus.</span></h2></Reveal>
            <Reveal delay={160}>
              <p className="mt-7 max-w-lg text-[17px] leading-relaxed text-white/65">
                Associa est en bêta privée. Nous ouvrons l’accès à {PILOT_SPOTS} associations pilotes, accompagnées personnellement pour la mise en place.
                Leurs retours façonnent la version finale.
              </p>
              <ul className="mt-8 space-y-3 text-white/75">
                {['Accès anticipé à toutes les fonctionnalités', 'Mise en place accompagnée de votre espace', 'Ligne directe avec l’équipe', 'Vos idées priorisées dans la feuille de route'].map(t => (
                  <li key={t} className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-400/15 text-emerald-300"><Check className="h-3.5 w-3.5" /></span>{t}</li>
                ))}
              </ul>
              <div className="mt-10"><Spots left={spotsLeft} /></div>
            </Reveal>
          </div>
          <Reveal delay={120}>
            <Glass className="p-6 sm:p-8">
              <p className="mb-1 font-heading text-3xl italic">Réserver une place</p>
              <p className="mb-6 text-sm text-white/50">Deux minutes, et nous vous recontactons personnellement.</p>
              <WaitlistForm spotsLeft={spotsLeft} />
            </Glass>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="relative mx-auto max-w-3xl scroll-mt-20 px-5 pb-28">
        <Reveal><h2 className="text-center font-heading text-5xl italic">Questions fréquentes</h2></Reveal>
        <div className="mt-10 space-y-3">
          {FAQ.map(([q, a], i) => (
            <Reveal key={q} delay={i * 60}>
              <details className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-5 open:bg-white/[0.05]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-medium">
                  {q}<Plus className="h-5 w-5 shrink-0 text-white/50 transition group-open:rotate-45" />
                </summary>
                <p className="mt-3 leading-relaxed text-white/60">{a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-5 py-10 sm:flex-row">
          <div className="flex items-center gap-4">
            <AssociaLogo className="h-5 text-white" />
            <span className="text-xs uppercase tracking-[0.3em] text-white/35">Suisse · Associations</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/50">
            <a href="#waitlist" className="hover:text-white">Waitlist</a>
            <Link href="/login" className="hover:text-white">Se connecter</Link>
            <span>© {new Date().getFullYear()} Associa</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Feature({ icon: Icon, title, text }: { icon: typeof Users; title: string; text: string }) {
  return (
    <div>
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/20"><Icon className="h-5 w-5" /></span>
      <h3 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-white/55">{text}</p>
    </div>
  )
}
