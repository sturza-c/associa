'use client'

import { useEffect, useRef, useState, useTransition, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Link2, Copy, Check, Globe, Trash2, ImagePlus, X, ChevronLeft, ChevronRight, Download, Loader2, Mail,
} from 'lucide-react'
import { updateEvent, removeEventRegistration } from '@/lib/actions/events'
import { getEventPhotoUploadUrl, saveEventPhoto, deleteEventPhoto } from '@/lib/actions/event-photos'
import type { AssocEventWithDetails, EventPhoto } from '@/types/database'
import { cn } from '@/lib/utils'

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://getassocia.me').replace(/\/$/, '')

function fmtWhen(iso: string) {
  return new Date(iso).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' })
}

// ─── Public sign-ups ──────────────────────────────────────────────────────────

export function PublicSignupSection({ event, canManage, associationId, publicSlug, onRefresh }: {
  event: AssocEventWithDetails
  canManage: boolean
  associationId: string
  publicSlug: string | null
  onRefresh: () => void
}) {
  const [pending, start] = useTransition()
  const [copied, setCopied] = useState(false)
  const regs = event.registrations ?? []
  const open = event.public_signup === true
  const link = publicSlug ? `${APP_URL}/a/${publicSlug}` : null

  function toggle() {
    start(async () => {
      const r = await updateEvent(event.id, associationId, { public_signup: !open })
      if (r.error) toast.error(r.error)
      else { toast.success(!open ? 'Inscriptions ouvertes' : 'Inscriptions fermées'); onRefresh() }
    })
  }

  function copy() {
    if (!link) return
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }

  function remove(id: string, name: string) {
    if (!confirm(`Retirer l'inscription de ${name} ?`)) return
    start(async () => {
      const r = await removeEventRegistration(id, event.id, associationId)
      if (r.error) toast.error(r.error)
      else onRefresh()
    })
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">
          Inscriptions via le lien public · {regs.length}
        </h3>
        {canManage && (
          <button
            onClick={toggle}
            disabled={pending}
            role="switch"
            aria-checked={open}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {open ? 'Ouvertes' : 'Fermées'}
            <span className={cn('relative h-5 w-9 rounded-full transition-colors', open ? 'bg-emerald-500' : 'bg-muted border border-border')}>
              <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', open ? 'left-[18px]' : 'left-0.5')} />
            </span>
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Share bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="h-8 w-8 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-300 flex items-center justify-center shrink-0">
            <Globe className="h-4 w-4" />
          </div>
          {link ? (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{link.replace(/^https?:\/\//, '')}</p>
                <p className="text-[11px] text-muted-foreground">
                  {open ? 'Partagez ce lien : chacun voit les prochains événements et peut s\'inscrire.' : 'L\'événement est visible, mais les inscriptions sont fermées.'}
                </p>
              </div>
              <button onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors shrink-0">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copié' : 'Copier le lien'}
              </button>
            </>
          ) : (
            <p className="flex-1 text-xs text-muted-foreground">
              <Link2 className="h-3.5 w-3.5 inline mr-1 -mt-0.5" />
              Activez la page publique dans <a href="/dashboard/settings" className="underline underline-offset-2 hover:text-foreground">Paramètres</a> pour partager un lien d&apos;inscription.
            </p>
          )}
        </div>

        {regs.length === 0 ? (
          <p className="px-4 py-6 text-xs text-muted-foreground/50 text-center font-heading italic">Aucune inscription externe pour l&apos;instant</p>
        ) : (
          <div className="divide-y divide-border">
            {regs.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 group">
                <div className="h-7 w-7 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-[10px] font-semibold shrink-0">
                  {r.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.full_name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    <Mail className="h-3 w-3 inline mr-1 -mt-0.5" />{r.email}{r.note ? ` · « ${r.note} »` : ''}
                  </p>
                </div>
                <span className="text-[11px] text-muted-foreground/60 tabular-nums shrink-0">{fmtWhen(r.created_at)}</span>
                {canManage && (
                  <button onClick={() => remove(r.id, r.full_name)} title="Retirer"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Photos (souvenirs) ───────────────────────────────────────────────────────

const MAX_EDGE = 2400

/** Downscale big phone photos in the browser before upload (keeps EXIF orientation). */
async function prepareImage(file: File): Promise<{ body: Blob; width: number | null; height: number | null; name: string }> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height))
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
    bmp.close()
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.86))
    if (!blob) throw new Error('encode')
    return { body: blob, width: w, height: h, name: file.name.replace(/\.[^.]+$/, '') + '.jpg' }
  } catch {
    // formats the browser can't decode (e.g. HEIC outside Safari): upload as is
    return { body: file, width: null, height: null, name: file.name }
  }
}

export function PhotosSection({ event, associationId, currentUserId, canDeleteAny, onRefresh }: {
  event: AssocEventWithDetails
  associationId: string
  currentUserId: string
  canDeleteAny: boolean
  onRefresh: () => void
}) {
  const photos = (event.photos ?? []).filter(p => p.url)
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null)
  const [viewer, setViewer] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState(false)

  async function upload(files: File[]) {
    const images = files.filter(f => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name))
    if (!images.length) return toast.error('Choisissez des photos')
    setUploading({ done: 0, total: images.length })
    let ok = 0
    for (const f of images) {
      const img = await prepareImage(f)
      const res = await getEventPhotoUploadUrl(event.id, associationId, img.name, img.body.size)
      if (res.error || !res.signedUrl || !res.path) { toast.error(res.error ?? 'Erreur'); break }
      const put = await fetch(res.signedUrl, { method: 'PUT', body: img.body, headers: { 'Content-Type': img.body.type || 'image/jpeg' } })
      if (!put.ok) { toast.error(`Échec de l'upload de ${f.name}`); continue }
      const saved = await saveEventPhoto({ eventId: event.id, associationId, filePath: res.path, width: img.width, height: img.height })
      if (saved.error) { toast.error(saved.error); continue }
      ok++
      setUploading({ done: ok, total: images.length })
    }
    setUploading(null)
    if (ok) { toast.success(ok > 1 ? `${ok} photos ajoutées` : 'Photo ajoutée'); onRefresh() }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">
          Souvenirs · {photos.length} photo{photos.length !== 1 ? 's' : ''}
        </h3>
        <button onClick={() => inputRef.current?.click()} disabled={!!uploading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-60">
          {uploading
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {uploading.done}/{uploading.total}</>
            : <><ImagePlus className="h-3.5 w-3.5" /> Ajouter des photos</>}
        </button>
        <input ref={inputRef} type="file" accept="image/*,.heic,.heif" multiple hidden
          onChange={e => { const fs = Array.from(e.target.files ?? []); e.target.value = ''; if (fs.length) upload(fs) }} />
      </div>

      {photos.length === 0 ? (
        <button
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); upload(Array.from(e.dataTransfer.files)) }}
          className={cn('w-full rounded-2xl border border-dashed py-10 flex flex-col items-center gap-2 text-center transition-colors',
            dragOver ? 'border-violet-500/60 bg-violet-500/5' : 'border-border hover:bg-muted/40')}>
          <ImagePlus className="h-6 w-6 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Déposez ici les photos de l&apos;événement</p>
          <p className="text-[11px] text-muted-foreground/60">Tous les membres peuvent ajouter leurs souvenirs</p>
        </button>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); upload(Array.from(e.dataTransfer.files)) }}
          className={cn('grid grid-cols-3 sm:grid-cols-4 gap-2 rounded-2xl transition-shadow', dragOver && 'ring-2 ring-violet-500/50 ring-offset-4 ring-offset-background')}>
          {photos.map((p, i) => (
            <button key={p.id} onClick={() => setViewer(i)}
              className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url!} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]" />
            </button>
          ))}
        </div>
      )}

      {viewer !== null && photos[viewer] && (
        <PhotoViewer
          photos={photos}
          index={viewer}
          onIndex={setViewer}
          onClose={() => setViewer(null)}
          canDelete={p => canDeleteAny || p.uploaded_by === currentUserId}
          onDelete={async p => {
            if (!confirm('Supprimer cette photo ?')) return
            const r = await deleteEventPhoto(p.id, associationId)
            if (r.error) return toast.error(r.error)
            setViewer(v => (v === null ? null : photos.length <= 1 ? null : Math.min(v, photos.length - 2)))
            onRefresh()
          }}
        />
      )}
    </section>
  )
}

function PhotoViewer({ photos, index, onIndex, onClose, canDelete, onDelete }: {
  photos: EventPhoto[]
  index: number
  onIndex: (i: number) => void
  onClose: () => void
  canDelete: (p: EventPhoto) => boolean
  onDelete: (p: EventPhoto) => void
}) {
  const p = photos[index]
  const go = useCallback((d: number) => onIndex((index + d + photos.length) % photos.length), [index, photos.length, onIndex])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.url!} alt="" className="max-h-[86vh] max-w-[90vw] rounded-lg shadow-2xl object-contain" onClick={e => e.stopPropagation()} />

      <div className="absolute top-4 right-4 flex items-center gap-2" onClick={e => e.stopPropagation()}>
        <span className="text-xs text-white/60 tabular-nums mr-2">{index + 1} / {photos.length}</span>
        <a href={p.url!} download target="_blank" rel="noreferrer" title="Télécharger"
          className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
          <Download className="h-4 w-4" />
        </a>
        {canDelete(p) && (
          <button onClick={() => onDelete(p)} title="Supprimer"
            className="p-2 rounded-lg text-white/70 hover:text-red-400 hover:bg-white/10 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        <button onClick={onClose} title="Fermer" className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {photos.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); go(-1) }} title="Précédente"
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button onClick={e => { e.stopPropagation(); go(1) }} title="Suivante"
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </div>
  )
}
