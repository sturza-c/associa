'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Check, Loader2, NotebookPen, X, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CollapsibleRail } from '@/components/collapsible-rail'
import {
  createNote,
  updateNote,
  deleteNote,
  createNoteFolder,
  deleteNoteFolder,
} from '@/lib/actions/notes'
import type { Note, NoteFolder } from '@/types/database'

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_PRESETS = [
  '#60a5fa', '#34d399', '#a78bfa', '#f472b6',
  '#fbbf24', '#f87171', '#94a3b8', '#22d3ee',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return 'maintenant'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`
  const days = Math.floor(diff / 86_400_000)
  if (days === 1) return 'hier'
  if (days < 7) return `${days}j`
  return d.toLocaleDateString('fr-CH', { day: '2-digit', month: 'short' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NoteListItem({
  note,
  active,
  onClick,
}: {
  note: Note
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl px-3 py-2.5 transition-colors',
        active ? 'bg-white/8' : 'hover:bg-white/4',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            'text-sm font-medium truncate',
            !note.title && 'text-muted-foreground/50 italic font-heading',
          )}
        >
          {note.title || 'Sans titre'}
        </p>
        <span className="text-[10px] text-muted-foreground/40 shrink-0">
          {relativeDate(note.updated_at)}
        </span>
      </div>
      {note.content && (
        <p className="text-xs text-muted-foreground/50 truncate mt-0.5 leading-snug">
          {note.content.slice(0, 80)}
        </p>
      )}
    </button>
  )
}

function FolderRailItem({
  folder,
  noteCount,
  active,
  onSelect,
  onDelete,
}: {
  folder: NoteFolder
  noteCount: number
  active: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={onSelect}
        className={cn(
          'w-full text-left flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
          active
            ? 'bg-white/8 text-foreground'
            : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
        )}
      >
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: folder.color }}
        />
        <span className="flex-1 truncate">{folder.name}</span>
        <span className="text-xs text-muted-foreground/50 tabular-nums">{noteCount}</span>
      </button>
      {hovered && (
        <button
          onClick={e => {
            e.stopPropagation()
            onDelete()
          }}
          title="Supprimer le dossier"
          className="absolute right-1 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/50 hover:text-red-400 hover:bg-white/5 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

function NewFolderInline({ onCreate }: { onCreate: (name: string, color: string) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLOR_PRESETS[0])
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
        className="mt-1 w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Nouveau dossier
      </button>
    )
  }

  return (
    <div className="mt-1 rounded-lg border border-white/10 bg-white/[0.03] p-2 space-y-2">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <input
          ref={inputRef}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            }
            if (e.key === 'Escape') {
              setName('')
              setOpen(false)
            }
          }}
          placeholder="Nom du dossier"
          maxLength={60}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
        />
      </div>
      <div className="flex flex-wrap gap-1">
        {COLOR_PRESETS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={cn(
              'h-4 w-4 rounded-full transition-transform hover:scale-110 ring-1',
              c === color ? 'ring-white' : 'ring-white/15',
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="flex items-center justify-end gap-1 pt-1">
        <button
          onClick={() => {
            setName('')
            setOpen(false)
          }}
          className="h-7 px-2 text-xs rounded-md hover:bg-white/5 text-muted-foreground transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
        <button
          onClick={commit}
          className="h-7 px-2 text-xs rounded-md bg-foreground text-background hover:opacity-90 flex items-center gap-1"
        >
          <Check className="h-3 w-3" /> Créer
        </button>
      </div>
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/8">
        <NotebookPen className="h-6 w-6 text-muted-foreground/40" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Aucune note</p>
        <p className="text-xs text-muted-foreground/50">
          Créez votre première note pour commencer
        </p>
      </div>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Créer une note
      </button>
    </div>
  )
}

function NoteEditor({
  noteId,
  title,
  content,
  onTitleChange,
  onContentChange,
  onDelete,
  saveStatus,
  folderId,
  folders,
}: {
  noteId: string
  title: string
  content: string
  onTitleChange: (v: string) => void
  onContentChange: (v: string) => void
  onDelete: () => void
  saveStatus: 'saved' | 'saving' | 'dirty'
  folderId: string | null
  folders: NoteFolder[]
}) {
  const folder = folderId ? folders.find(f => f.id === folderId) : null

  return (
    <div className="max-w-2xl mx-auto px-8 py-10 space-y-4">
      {/* Top meta bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground/50">
        <div className="flex items-center gap-2">
          {folder && (
            <span
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-muted-foreground/70"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: folder.color }}
              />
              {folder.name}
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-emerald-400/60 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Sauvegardé
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Sauvegarde...
            </span>
          )}
          {saveStatus === 'dirty' && (
            <span className="text-muted-foreground/40">Modifications non sauvegardées</span>
          )}
        </div>
        <button
          onClick={onDelete}
          title="Supprimer la note"
          className="flex items-center justify-center rounded-md p-1 text-muted-foreground/40 hover:text-red-400 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Title */}
      <input
        value={title}
        onChange={e => onTitleChange(e.target.value)}
        placeholder="Sans titre"
        className="w-full bg-transparent text-2xl font-bold outline-none placeholder:text-muted-foreground/25 border-none"
      />

      {/* Divider */}
      <div className="border-t border-white/6" />

      {/* Content textarea */}
      <textarea
        key={noteId}
        value={content}
        onChange={e => onContentChange(e.target.value)}
        onInput={e => {
          const el = e.currentTarget
          el.style.height = 'auto'
          el.style.height = el.scrollHeight + 'px'
        }}
        placeholder="Commencer à écrire..."
        className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground/25 min-h-[60vh]"
        style={{ height: 'auto' }}
      />
    </div>
  )
}

// ─── Main shell ───────────────────────────────────────────────────────────────

interface Props {
  notes: Note[]
  folders: NoteFolder[]
  associationId: string
  callerUserId: string
  onRefresh: () => void
}

export function NotesShell({ notes, folders, associationId, onRefresh }: Props) {
  const [activeFolderId, setActiveFolderId] = useState<string | 'all'>('all')
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [creating, setCreating] = useState(false)

  // Sync editor when selected note changes
  useEffect(() => {
    const note = notes.find(n => n.id === selectedNoteId)
    if (note) {
      setEditTitle(note.title)
      setEditContent(note.content)
      setSaveStatus('saved')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNoteId])

  const filteredNotes = useMemo(() => {
    const base =
      activeFolderId === 'all'
        ? notes
        : notes.filter(n => n.folder_id === activeFolderId)
    return [...base].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
  }, [notes, activeFolderId])

  const selectedNote = notes.find(n => n.id === selectedNoteId) ?? null

  function scheduleSave(noteId: string, title: string, content: string) {
    setSaveStatus('dirty')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving')
      await updateNote(noteId, associationId, { title, content })
      setSaveStatus('saved')
      onRefresh()
    }, 800)
  }

  function handleTitleChange(value: string) {
    setEditTitle(value)
    if (selectedNoteId) scheduleSave(selectedNoteId, value, editContent)
  }

  function handleContentChange(value: string) {
    setEditContent(value)
    if (selectedNoteId) scheduleSave(selectedNoteId, editTitle, value)
  }

  async function handleCreateNote() {
    setCreating(true)
    const fId = activeFolderId === 'all' ? null : activeFolderId
    const r = await createNote(associationId, fId)
    setCreating(false)
    if (r.note) {
      onRefresh()
      setSelectedNoteId(r.note.id)
    } else if (r.error) {
      toast.error(r.error)
    }
  }

  function handleSelectNote(id: string) {
    // Flush any pending save before switching
    clearTimeout(saveTimer.current)
    if (selectedNoteId && saveStatus === 'dirty') {
      updateNote(selectedNoteId, associationId, { title: editTitle, content: editContent })
        .then(() => onRefresh())
    }
    setSelectedNoteId(id)
  }

  async function handleDeleteNote() {
    if (!selectedNoteId) return
    if (!confirm('Supprimer cette note ?')) return
    await deleteNote(selectedNoteId, associationId)
    setSelectedNoteId(null)
    onRefresh()
  }

  async function handleDeleteFolder(folderId: string) {
    if (!confirm('Supprimer ce dossier ? Les notes seront conservées sans dossier.')) return
    await deleteNoteFolder(folderId, associationId)
    if (activeFolderId === folderId) setActiveFolderId('all')
    onRefresh()
  }

  async function handleCreateFolder(name: string, color: string) {
    const r = await createNoteFolder(associationId, name, color)
    if (r.folder) {
      onRefresh()
      setActiveFolderId(r.folder.id)
    } else if (r.error) {
      toast.error(r.error)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/6 shrink-0">
        <h1 className="text-sm font-semibold">Notes</h1>
        <button
          onClick={() => handleCreateNote()}
          disabled={creating}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Nouvelle note
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left rail */}
        <CollapsibleRail>
          <div className="overflow-y-auto h-full p-3 space-y-4 pt-8">
            {/* All notes */}
            <button
              onClick={() => {
                setActiveFolderId('all')
                setSelectedNoteId(null)
              }}
              className={cn(
                'w-full text-left flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                activeFolderId === 'all'
                  ? 'bg-white/8 text-foreground'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
              )}
            >
              <FolderOpen className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1">Toutes les notes</span>
              <span className="text-xs text-muted-foreground/50 tabular-nums">{notes.length}</span>
            </button>

            {/* Folders */}
            <div>
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Dossiers
              </p>
              {folders.map(f => (
                <FolderRailItem
                  key={f.id}
                  folder={f}
                  noteCount={notes.filter(n => n.folder_id === f.id).length}
                  active={activeFolderId === f.id}
                  onSelect={() => {
                    setActiveFolderId(f.id)
                    setSelectedNoteId(null)
                  }}
                  onDelete={() => handleDeleteFolder(f.id)}
                />
              ))}
              <NewFolderInline onCreate={handleCreateFolder} />
            </div>

            {/* Notes list */}
            <div>
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {activeFolderId === 'all'
                  ? 'Toutes'
                  : folders.find(f => f.id === activeFolderId)?.name ?? 'Notes'}
              </p>
              {filteredNotes.map(n => (
                <NoteListItem
                  key={n.id}
                  note={n}
                  active={selectedNoteId === n.id}
                  onClick={() => handleSelectNote(n.id)}
                />
              ))}
              {filteredNotes.length === 0 && (
                <p className="px-2 py-2 text-xs text-muted-foreground/50 italic font-heading">
                  Aucune note
                </p>
              )}
            </div>
          </div>
        </CollapsibleRail>

        {/* Right: editor or empty state */}
        <div className="flex-1 overflow-y-auto">
          {selectedNote ? (
            <NoteEditor
              noteId={selectedNote.id}
              title={editTitle}
              content={editContent}
              onTitleChange={handleTitleChange}
              onContentChange={handleContentChange}
              onDelete={handleDeleteNote}
              saveStatus={saveStatus}
              folderId={selectedNote.folder_id}
              folders={folders}
            />
          ) : (
            <EmptyState onCreate={handleCreateNote} />
          )}
        </div>
      </div>
    </div>
  )
}
