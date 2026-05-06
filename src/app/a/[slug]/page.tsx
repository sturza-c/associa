import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Users, CalendarDays, MapPin, Clock, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  params: Promise<{ slug: string }>
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-CH', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function daysUntil(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - now.getTime()) / 86400000)
}

export default async function PublicAssociationPage({ params }: Props) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data: assoc } = await admin
    .from('associations')
    .select('id, name, description, logo_url, accent_color, created_at, is_public')
    .eq('slug', slug)
    .eq('is_public', true)
    .single()

  if (!assoc) notFound()

  const accent = assoc.accent_color ?? '#6366f1'

  // Member count
  const { count: memberCount } = await admin
    .from('association_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('association_id', assoc.id)
    .eq('is_active', true)

  // Upcoming events (from new events table, with graceful fallback)
  let upcomingEvents: { id: string; name: string; event_date: string; location: string | null; start_time: string | null }[] = []
  const today = new Date().toISOString().slice(0, 10)

  const { data: eventsData, error: evErr } = await admin
    .from('events')
    .select('id, name, event_date, location, start_time')
    .eq('association_id', assoc.id)
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(6)

  if (!evErr && eventsData) upcomingEvents = eventsData


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${accent}22 0%, transparent 60%)` }}
      >
        <div
          aria-hidden
          className="absolute -top-32 -right-32 h-96 w-96 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: accent }}
        />
        <div className="relative max-w-3xl mx-auto px-6 py-16">
          <div className="flex items-start gap-6">
            {assoc.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={assoc.logo_url}
                alt={assoc.name}
                className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-1 ring-border shadow-lg"
              />
            ) : (
              <div
                className="h-20 w-20 shrink-0 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg"
                style={{ backgroundColor: accent + '22', color: accent }}
              >
                {assoc.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Page publique</span>
              </div>
              <h1 className="text-4xl font-heading italic font-normal tracking-tight leading-tight">{assoc.name}</h1>
              {assoc.description && (
                <p className="text-muted-foreground mt-3 leading-relaxed max-w-xl">{assoc.description}</p>
              )}
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <span>{memberCount ?? 0} membre{(memberCount ?? 0) > 1 ? 's' : ''}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">

        {/* Upcoming events */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Prochains événements
            </h2>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">Aucun événement à venir pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(ev => {
                const days = daysUntil(ev.event_date)
                const dayLabel = days === 0 ? "Aujourd'hui" : days === 1 ? 'Demain' : `Dans ${days} j`
                return (
                  <div
                    key={ev.id}
                    className="rounded-2xl border border-border bg-card p-5 flex items-start gap-5"
                  >
                    {/* Date chip */}
                    <div
                      className="shrink-0 rounded-xl px-3 py-2 text-center min-w-[52px]"
                      style={{ backgroundColor: accent + '18', color: accent }}
                    >
                      <p className="text-xs font-semibold uppercase">
                        {new Date(ev.event_date + 'T00:00:00').toLocaleDateString('fr-CH', { month: 'short' })}
                      </p>
                      <p className="text-2xl font-bold leading-none mt-0.5">
                        {new Date(ev.event_date + 'T00:00:00').getDate()}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{ev.name}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className={cn('font-medium', days <= 3 ? 'text-amber-500' : '')}>
                          {dayLabel} · {fmtDate(ev.event_date)}
                        </span>
                        {ev.start_time && (
                          <>
                            <span className="text-muted-foreground/30">·</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {ev.start_time.slice(0, 5)}
                            </span>
                          </>
                        )}
                        {ev.location && (
                          <>
                            <span className="text-muted-foreground/30">·</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {ev.location}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>


        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground/50 pb-4">
          <span>Géré avec </span>
          <Link href="/" className="hover:text-foreground transition-colors">Associa</Link>
        </footer>
      </div>
    </div>
  )
}
