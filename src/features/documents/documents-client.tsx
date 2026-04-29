'use client'

import { useState, useMemo, useTransition, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { deleteDocument, getSignedViewUrl } from '@/lib/actions/documents'
import { createFolder, updateFolder, deleteFolder } from '@/lib/actions/folders'
import { UploadDocumentDialog } from './upload-document-dialog'
import type { Document, DocumentFolder, Role } from '@/types/database'
import {
  FileText,
  FileImage,
  File as FileIconBase,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  Trash2,
  Search,
  FolderOpen,
  Folder,
  Plus,
  Pencil,
  Check,
  X,
  Inbox,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CollapsibleRail } from '@/components/collapsible-rail'

const COLOR_PRESETS = [
  '#60a5fa', // blue
  '#34d399', // emerald
  '#a78bfa', // violet
  '#f472b6', // pink
  '#fbbf24', // amber
  '#f87171', // red
  '#94a3b8', // slate
  '#22d3ee', // cyan
]

function timeAgo(date: string) {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins}min`
  if (hours < 24) return `il y a ${hours}h`
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days}j`
  if (days < 30) return `il y a ${Math.round(days / 7)}sem`
  return new Date(date).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' })
}

function FileGlyph({ mimeType, className }: { mimeType: string | null; className?: string }) {
  const m = mimeType ?? ''
  const cls = cn('h-5 w-5', className)
  if (m.startsWith('image/')) return <FileImage className={cn(cls, 'text-blue-300')} />
  if (m === 'application/pdf') return <FileText className={cn(cls, 'text-red-300')} />
  if (m.startsWith('video/')) return <FileVideo className={cn(cls, 'text-violet-300')} />
  if (m.startsWith('audio/')) return <FileAudio className={cn(cls, 'text-amber-300')} />
  if (m.includes('sheet') || m.includes('excel') || m.includes('csv')) return <FileSpreadsheet className={cn(cls, 'text-emerald-300')} />
  if (m.startsWith('text/') || m.includes('document') || m.includes('word')) return <FileText className={cn(cls, 'text-muted-foreground')} />
  return <FileIconBase className={cn(cls, 'text-muted-foreground')} />
}

function getInitials(name: string | null, email: string) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (email[0] ?? '?').toUpperCase()
}

interface Uploader {
  full_name: string | null
  email: string
}

interface Props {
  documents: Document[]
  folders: DocumentFolder[]
  uploaders: Record<string, Uploader>
  associationId: string
  callerRole: Role
  currentUserId: string
}

type FolderKey = 'all' | 'unsorted' | string // string = folder id

export function DocumentsClient({
  documents,
  folders,
  uploaders,
  associationId,
  callerRole,
  currentUserId,
}: Props) {
  const router = useRouter()
  const [activeKey, setActiveKey] = useState<FolderKey>('all')
  const [query, setQuery] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const canManage = callerRole === 'president' || callerRole === 'secretary'

  // Folder by id for quick lookup
  const foldersById = useMemo(() => {
    const m: Record<string, DocumentFolder> = {}
    for (const f of folders) m[f.id] = f
    return m
  }, [folders])

  const filtered = useMemo(() => {
    return documents.filter(d => {
      if (activeKey === 'unsorted' && d.folder_id) return false
      if (activeKey !== 'all' && activeKey !== 'unsorted' && d.folder_id !== activeKey) return false
      if (!query) return true
      return d.name.toLowerCase().includes(query.toLowerCase())
    })
  }, [documents, activeKey, query])

  const unsortedCount = useMemo(() => documents.filter(d => !d.folder_id).length, [documents])

  const canDelete = (doc: Document) =>
    doc.uploaded_by === currentUserId || ['president', 'secretary'].includes(callerRole)

  async function handleView(doc: Document) {
    setLoadingId(doc.id)
    const url = await getSignedViewUrl(doc.file_path)
    setLoadingId(null)
    if (!url) return toast.error('Impossible d\'accéder au fichier')
    window.open(url, '_blank')
  }

  async function handleDelete(doc: Document, e: React.MouseEvent) {
    e.stopPropagation()
    setLoadingId(doc.id)
    const result = await deleteDocument(doc.id, doc.file_path, associationId)
    if (result.error) toast.error(result.error)
    else toast.success('Document supprimé')
    setLoadingId(null)
  }

  function handleCreateFolder(name: string, color: string) {
    startTransition(async () => {
      const r = await createFolder(associationId, { name, color })
      if (r.error) toast.error(r.error)
      else {
        toast.success('Dossier créé')
        if (r.folder) setActiveKey(r.folder.id)
        router.refresh()
      }
    })
  }

  function handleRenameFolder(folderId: string, name: string) {
    startTransition(async () => {
      const r = await updateFolder(folderId, associationId, { name })
      if (r.error) toast.error(r.error)
      else router.refresh()
    })
  }

  function handleRecolorFolder(folderId: string, color: string) {
    startTransition(async () => {
      const r = await updateFolder(folderId, associationId, { color })
      if (r.error) toast.error(r.error)
      else router.refresh()
    })
  }

  function handleDeleteFolder(folderId: string) {
    if (!confirm('Supprimer ce dossier ? Les documents resteront accessibles dans « Sans dossier ».')) return
    startTransition(async () => {
      const r = await deleteFolder(folderId, associationId)
      if (r.error) toast.error(r.error)
      else {
        toast.success('Dossier supprimé')
        if (activeKey === folderId) setActiveKey('all')
        router.refresh()
      }
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/6 shrink-0">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">
            Opérations
          </p>
          <h1 className="text-[28px] font-semibold mt-1 leading-tight tracking-tight">
            <span className="font-heading italic font-normal text-[32px]">Documents</span>
          </h1>
        </div>
        <UploadDocumentDialog associationId={associationId} folders={folders} />
      </div>

      <div className="flex-1 overflow-hidden flex">
        <CollapsibleRail>
          <div className="overflow-y-auto h-full p-4">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Dossiers
            </p>

            <nav className="space-y-0.5">
              <FolderRow
                icon={<Inbox className="h-3.5 w-3.5 text-muted-foreground" />}
                label="Tous"
                active={activeKey === 'all'}
                onClick={() => setActiveKey('all')}
              />

              {folders.map(f => (
                <FolderItem
                  key={f.id}
                  folder={f}
                  active={activeKey === f.id}
                  canManage={canManage}
                  onSelect={() => setActiveKey(f.id)}
                  onRename={(name) => handleRenameFolder(f.id, name)}
                  onRecolor={(color) => handleRecolorFolder(f.id, color)}
                  onDelete={() => handleDeleteFolder(f.id)}
                />
              ))}

              {unsortedCount > 0 && (
                <FolderRow
                  icon={<Folder className="h-3.5 w-3.5 text-muted-foreground/70" />}
                  label="Sans dossier"
                  active={activeKey === 'unsorted'}
                  onClick={() => setActiveKey('unsorted')}
                />
              )}
            </nav>

            {canManage && (
              <NewFolderInline onCreate={handleCreateFolder} existingCount={folders.length} />
            )}
          </div>
        </CollapsibleRail>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-6 space-y-6">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher un document..."
                className="w-full rounded-xl border border-white/8 bg-white/[0.03] backdrop-blur-md py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-white/15 focus:border-transparent transition-all"
              />
            </div>

            {/* Card grid */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <FolderOpen className="h-8 w-8 text-muted-foreground/20 mb-4" />
                <p className="text-sm text-muted-foreground font-heading italic">
                  {query ? 'Aucun document ne correspond' : 'Aucun document dans ce dossier'}
                </p>
                {!query && documents.length === 0 && (
                  <p className="text-xs text-muted-foreground/60 mt-2">
                    Glissez un fichier ou utilisez le bouton ci-dessus.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {filtered.map((doc) => {
                  const uploader = uploaders[doc.uploaded_by]
                  const isMine = doc.uploaded_by === currentUserId
                  const folder = doc.folder_id ? foldersById[doc.folder_id] : null

                  return (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      folder={folder}
                      uploader={uploader}
                      isMine={isMine}
                      loading={loadingId === doc.id}
                      canDelete={canDelete(doc)}
                      onView={() => handleView(doc)}
                      onDelete={(e) => handleDelete(doc, e)}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DocumentCard({
  doc,
  folder,
  uploader,
  isMine,
  loading,
  canDelete,
  onView,
  onDelete,
}: {
  doc: Document
  folder: DocumentFolder | null
  uploader: Uploader | undefined
  isMine: boolean
  loading: boolean
  canDelete: boolean
  onView: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const isImage = (doc.mime_type ?? '').startsWith('image/')
  const isPdf = doc.mime_type === 'application/pdf'
  const isVideo = (doc.mime_type ?? '').startsWith('video/')
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)
  const [thumbFailed, setThumbFailed] = useState(false)
  const cardRef = useRef<HTMLButtonElement>(null)
  const requestedRef = useRef(false)

  useEffect(() => {
    if (!isImage || requestedRef.current) return
    const el = cardRef.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !requestedRef.current) {
          requestedRef.current = true
          io.disconnect()
          getSignedViewUrl(doc.file_path).then((url) => {
            if (url) setThumbUrl(url)
            else setThumbFailed(true)
          })
        }
      }
    }, { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [isImage, doc.file_path])

  const uploaderLabel = uploader
    ? (uploader.full_name || uploader.email.split('@')[0])
    : null

  return (
    <button
      ref={cardRef}
      onClick={onView}
      disabled={loading}
      className={cn(
        'group relative flex flex-col rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-md text-left overflow-hidden transition-all hover:border-white/15 hover:bg-white/[0.05] hover:-translate-y-0.5',
        loading && 'opacity-40'
      )}
    >
      <div className={cn(
        'relative h-36 w-full overflow-hidden border-b border-white/[0.06]',
        isImage && thumbUrl ? 'bg-black/40' : 'bg-gradient-to-br from-white/[0.04] to-white/[0.01]'
      )}>
        {isImage && thumbUrl && !thumbFailed ? (
          <img
            src={thumbUrl}
            alt={doc.name}
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setThumbFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              'flex h-16 w-16 items-center justify-center rounded-2xl ring-1 ring-white/10',
              isPdf && 'bg-red-500/10',
              isVideo && 'bg-violet-500/10',
              isImage && 'bg-blue-500/10',
              !isPdf && !isVideo && !isImage && 'bg-white/[0.04]'
            )}>
              <FileGlyph mimeType={doc.mime_type} className="h-8 w-8" />
            </div>
          </div>
        )}

        <div className="absolute top-2.5 left-2.5">
          {folder ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md px-2 py-1 text-[10px] uppercase tracking-wider text-white/90 ring-1 ring-white/15">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: folder.color }} />
              <span className="truncate max-w-[120px]">{folder.name}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-md px-2 py-1 text-[10px] uppercase tracking-wider text-white/70 ring-1 ring-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
              sans dossier
            </span>
          )}
        </div>

        {canDelete && (
          <span
            onClick={onDelete}
            role="button"
            tabIndex={-1}
            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/50 backdrop-blur-md ring-1 ring-white/10 opacity-0 group-hover:opacity-100 hover:bg-red-500/30 hover:text-red-200 text-white/80 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-foreground min-h-[2.5em]">
          {doc.name}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5 min-w-0">
            {uploader ? (
              <>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/15 to-white/5 text-[9px] font-semibold ring-1 ring-white/10">
                  {getInitials(uploader.full_name, uploader.email)}
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  {isMine ? 'vous' : uploaderLabel}
                </span>
              </>
            ) : (
              <Folder className="h-3 w-3 text-muted-foreground/40" />
            )}
          </div>
          <span className="text-[11px] tabular-nums text-muted-foreground/60 shrink-0">
            {timeAgo(doc.created_at)}
          </span>
        </div>
      </div>
    </button>
  )
}

function FolderRow({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors text-left',
        active
          ? 'bg-white/8 text-foreground'
          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
      )}
    >
      <span className="shrink-0 flex items-center justify-center w-3.5">{icon}</span>
      <span className="truncate flex-1">{label}</span>
    </button>
  )
}

function FolderItem({
  folder,
  active,
  canManage,
  onSelect,
  onRename,
  onRecolor,
  onDelete,
}: {
  folder: DocumentFolder
  active: boolean
  canManage: boolean
  onSelect: () => void
  onRename: (name: string) => void
  onRecolor: (color: string) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(folder.name)
  const [colorOpen, setColorOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const colorRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setName(folder.name) }, [folder.name])

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  useEffect(() => {
    if (!colorOpen) return
    function onDoc(e: MouseEvent) {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) setColorOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [colorOpen])

  function commit() {
    const n = name.trim()
    if (n && n !== folder.name) onRename(n)
    else setName(folder.name)
    setEditing(false)
  }

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2.5 rounded-lg pl-3 pr-1 py-2 text-sm transition-colors',
        active ? 'bg-white/8 text-foreground' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
      )}
    >
      <button
        onClick={() => canManage && setColorOpen(true)}
        className={cn('shrink-0 h-2 w-2 rounded-full transition-transform', canManage && 'cursor-pointer hover:scale-125')}
        style={{ backgroundColor: folder.color }}
        title={canManage ? 'Changer la couleur' : undefined}
      />
      {editing ? (
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commit() }
            if (e.key === 'Escape') { setName(folder.name); setEditing(false) }
          }}
          className="flex-1 bg-transparent text-sm outline-none border-b border-white/20 pb-0.5"
          maxLength={60}
        />
      ) : (
        <button onClick={onSelect} className="flex-1 truncate text-left">
          {folder.name}
        </button>
      )}

      {canManage && !editing && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(true) }}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/10 text-muted-foreground hover:text-foreground"
            title="Renommer"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive"
            title="Supprimer"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}

      {colorOpen && (
        <div
          ref={colorRef}
          className="absolute left-2 top-full mt-1 z-20 flex flex-wrap gap-1.5 p-2 rounded-lg border border-white/10 bg-popover/95 backdrop-blur-2xl shadow-xl w-[152px]"
        >
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => { onRecolor(c); setColorOpen(false) }}
              className={cn(
                'h-5 w-5 rounded-full transition-transform hover:scale-110 ring-1',
                c.toLowerCase() === folder.color.toLowerCase() ? 'ring-white' : 'ring-white/15'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NewFolderInline({
  onCreate,
  existingCount,
}: {
  onCreate: (name: string, color: string) => void
  existingCount: number
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLOR_PRESETS[existingCount % COLOR_PRESETS.length])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  function commit() {
    const n = name.trim()
    if (!n) {
      setOpen(false)
      setName('')
      return
    }
    onCreate(n, color)
    setName('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Nouveau dossier
      </button>
    )
  }

  return (
    <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.03] p-2 space-y-2">
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commit() }
            if (e.key === 'Escape') { setName(''); setOpen(false) }
          }}
          placeholder="Nom du dossier"
          maxLength={60}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={cn(
              'h-4 w-4 rounded-full transition-transform hover:scale-110 ring-1',
              c === color ? 'ring-white' : 'ring-white/15'
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="flex items-center justify-end gap-1 pt-1">
        <button
          onClick={() => { setName(''); setOpen(false) }}
          className="h-7 px-2 text-xs rounded-md hover:bg-white/5 text-muted-foreground transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
        <button
          onClick={commit}
          className="h-7 px-2 text-xs rounded-md bg-foreground text-background hover:opacity-90 flex items-center gap-1"
        >
          <Check className="h-3 w-3" />
          Créer
        </button>
      </div>
    </div>
  )
}
