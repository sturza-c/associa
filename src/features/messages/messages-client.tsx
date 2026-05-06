'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { toast } from 'sonner'
import { getMessages, sendMessage, getSignedChatUploadUrl, deleteConversation } from '@/lib/actions/messages'
import { NewConversationDialog } from './new-conversation-dialog'
import type { ConversationWithDetails, MessageWithSender, MessageAttachment } from '@/lib/actions/messages'
import type { MembershipWithProfile, Role } from '@/types/database'
import { Send, MessageSquare, Paperclip, X, FileText, Image as ImageIcon, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CollapsibleRail } from '@/components/collapsible-rail'
import { EmptyState } from '@/components/ui/empty-state'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })
}

function timeAgo(date: string) {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `${mins}min`
  if (hours < 24) return `${hours}h`
  if (days === 1) return 'Hier'
  if (days < 7) return `${days}j`
  return new Date(date).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' })
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

function getInitials(name: string | null, email: string) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return email[0].toUpperCase()
}

function getConversationTitle(conv: ConversationWithDetails, currentUserId: string) {
  if (conv.title) return conv.title
  const others = (conv.participants ?? []).filter(p => p.user_id !== currentUserId)
  if (others.length === 0) return 'Moi-même'
  return others.map(p => p.full_name || p.email).join(', ')
}

function AttachmentPreview({ attachment, isMe }: { attachment: MessageAttachment; isMe: boolean }) {
  const isImage = attachment.type.startsWith('image/')

  if (isImage && attachment.signedUrl) {
    return (
      <a href={attachment.signedUrl} target="_blank" rel="noopener noreferrer" className="block mt-2">
        <img
          src={attachment.signedUrl}
          alt={attachment.name}
          className="max-w-[240px] max-h-[200px] rounded-xl object-cover ring-1 ring-white/10"
        />
      </a>
    )
  }

  return (
    <a
      href={attachment.signedUrl ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-2 mt-2 rounded-xl ring-1 px-3 py-2 text-xs transition-colors max-w-[240px]',
        isMe
          ? 'ring-white/20 bg-white/10 hover:bg-white/15'
          : 'ring-white/10 bg-white/5 hover:bg-white/10'
      )}
    >
      <FileText className="h-4 w-4 shrink-0 opacity-70" />
      <span className="truncate flex-1">{attachment.name}</span>
      <span className="shrink-0 opacity-50 tabular-nums">{formatSize(attachment.size)}</span>
    </a>
  )
}

interface Props {
  conversations: ConversationWithDetails[]
  members: MembershipWithProfile[]
  associationId: string
  currentUserId: string
  callerRole: Role
}

export function MessagesClient({ conversations, members, associationId, currentUserId, callerRole }: Props) {
  const [activeConv, setActiveConv] = useState<ConversationWithDetails | null>(
    conversations[0] ?? null
  )
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [content, setContent] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, startDelete] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canDeleteActive = activeConv
    ? callerRole === 'president' || activeConv.created_by === currentUserId
    : false

  function handleDelete() {
    if (!activeConv) return
    startDelete(async () => {
      const res = await deleteConversation(activeConv.id, associationId)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Conversation supprimée')
      setConfirmDelete(false)
      setActiveConv(null)
      window.location.reload()
    })
  }

  useEffect(() => {
    if (!activeConv) return
    setLoadingMessages(true)
    getMessages(activeConv.id).then(msgs => {
      setMessages(msgs)
      setLoadingMessages(false)
    })
  }, [activeConv])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const valid = files.filter(f => {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name} dépasse la limite de 5 Mo`)
        return false
      }
      return true
    })
    setPendingFiles(prev => [...prev, ...valid])
    e.target.value = ''
  }

  function removeFile(index: number) {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!activeConv) return
    if (!content.trim() && pendingFiles.length === 0) return

    setSending(true)

    try {
      const uploadedAttachments: Omit<MessageAttachment, 'signedUrl'>[] = []

      for (const file of pendingFiles) {
        const urlResult = await getSignedChatUploadUrl(activeConv.id, file.name)
        if ('error' in urlResult) {
          toast.error(`Erreur upload : ${urlResult.error}`)
          setSending(false)
          return
        }

        const res = await fetch(urlResult.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        })

        if (!res.ok) {
          toast.error(`Échec de l'envoi de ${file.name}`)
          setSending(false)
          return
        }

        uploadedAttachments.push({
          path: urlResult.path,
          name: file.name,
          size: file.size,
          type: file.type,
        })
      }

      const result = await sendMessage(activeConv.id, content, uploadedAttachments)
      if (result.error) {
        toast.error(result.error)
      } else {
        setContent('')
        setPendingFiles([])
        const updated = await getMessages(activeConv.id)
        setMessages(updated)
      }
    } finally {
      setSending(false)
    }
  }

  const participantCount = activeConv?.participants?.length ?? 0

  return (
    <div className="flex h-full">

      {/* Conversation list */}
      <CollapsibleRail width="w-80">
      <div className="bg-white/[0.02] backdrop-blur-md flex flex-col h-full">
        <div className="px-5 py-5 border-b border-white/6 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">
              Opérations
            </p>
            <h1 className="text-xl font-semibold mt-0.5 leading-tight">
              <span className="font-heading italic font-normal text-[22px]">Messages</span>
            </h1>
          </div>
          <NewConversationDialog
            associationId={associationId}
            members={members}
            currentUserId={currentUserId}
            onCreated={() => {}}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <EmptyState
              variant="messages"
              title="Aucune conversation"
              description="Démarrez-en une avec un membre de votre équipe."
              size="sm"
            />
          ) : (
            <div className="divide-y divide-border">
              {conversations.map(conv => {
                const title = getConversationTitle(conv, currentUserId)
                const others = (conv.participants ?? []).filter(p => p.user_id !== currentUserId)
                const initials = others[0] ? getInitials(others[0].full_name, others[0].email) : '?'
                const isActive = activeConv?.id === conv.id

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className={cn(
                      'w-full text-left px-4 py-3.5 flex items-center gap-3 transition-colors',
                      isActive ? 'bg-muted' : 'hover:bg-muted/50'
                    )}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold ring-1 ring-border">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{title}</p>
                        {conv.last_message_at && (
                          <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                            {timeAgo(conv.last_message_at)}
                          </span>
                        )}
                      </div>
                      {conv.last_message ? (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {conv.last_message}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground/50 italic mt-0.5 font-heading">
                          Pas encore de message
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
      </CollapsibleRail>

      {/* Message thread */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeConv ? (
          <>
            <div className="px-6 py-4 border-b border-white/6 shrink-0 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/15 to-white/5 text-xs font-semibold ring-1 ring-white/10">
                {(() => {
                  const others = (activeConv.participants ?? []).filter(p => p.user_id !== currentUserId)
                  return others[0] ? getInitials(others[0].full_name, others[0].email) : '?'
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {getConversationTitle(activeConv, currentUserId)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {participantCount} participant{participantCount > 1 ? 's' : ''}
                </p>
              </div>
              {canDeleteActive && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  title="Supprimer la conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {confirmDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => !isDeleting && setConfirmDelete(false)}>
                <div className="w-full max-w-md rounded-2xl border border-white/10 bg-background p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-500/30">
                      <Trash2 className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold">Supprimer la conversation ?</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tous les messages et fichiers joints seront supprimés définitivement.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end mt-5">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => setConfirmDelete(false)}
                      className="rounded-lg px-3 py-1.5 text-sm ring-1 ring-white/10 hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleDelete}
                      className="rounded-lg bg-red-500/90 px-3 py-1.5 text-sm text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                    >
                      {isDeleting ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {loadingMessages ? (
                <div className="text-center text-muted-foreground text-sm py-8 font-heading italic">
                  Chargement...
                </div>
              ) : messages.length === 0 ? (
                <EmptyState
                  variant="messages"
                  title="Aucun message"
                  description="Soyez le premier à écrire dans cette conversation."
                />
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id === currentUserId
                  const prev = messages[idx - 1]
                  const showHeader = !prev || prev.sender_id !== msg.sender_id ||
                    (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) > 5 * 60 * 1000

                  return (
                    <div key={msg.id} className={cn('flex gap-3', isMe && 'flex-row-reverse')}>
                      <div className={cn('w-8 shrink-0', !showHeader && 'opacity-0')}>
                        {showHeader && (
                          <div className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold ring-1',
                            isMe
                              ? 'bg-primary/80 text-primary-foreground ring-primary/30'
                              : 'bg-gradient-to-br from-white/15 to-white/5 ring-white/10'
                          )}>
                            {getInitials(msg.sender.full_name, msg.sender.email)}
                          </div>
                        )}
                      </div>
                      <div className={cn('max-w-[70%]', isMe && 'items-end flex flex-col')}>
                        {showHeader && !isMe && (
                          <p className="text-[11px] text-muted-foreground mb-1 px-1">
                            {msg.sender.full_name || msg.sender.email}
                          </p>
                        )}
                        <div className={cn(
                          'rounded-2xl px-4 py-2.5 text-sm ring-1',
                          isMe
                            ? 'bg-primary text-primary-foreground ring-primary/20 rounded-tr-md'
                            : 'bg-white/[0.06] backdrop-blur-md ring-white/8 rounded-tl-md'
                        )}>
                          {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                          {msg.attachments?.map((a, i) => (
                            <AttachmentPreview key={i} attachment={a} isMe={isMe} />
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 px-1 tabular-nums">
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="px-6 py-4 border-t border-white/6 shrink-0 space-y-2">
              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {pendingFiles.map((file, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg ring-1 ring-white/10 bg-white/5 backdrop-blur-md px-2.5 py-1.5 text-xs max-w-[220px]"
                    >
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate flex-1">{file.name}</span>
                      <span className="shrink-0 text-muted-foreground tabular-nums">{formatSize(file.size)}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 items-center rounded-2xl border border-white/7 bg-white/[0.035] backdrop-blur-md p-1.5 focus-within:ring-2 focus-within:ring-white/15 transition-all">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors disabled:opacity-50"
                  title="Joindre un fichier"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Écrire un message..."
                  className="flex-1 bg-transparent px-2 py-2 text-sm focus:outline-none placeholder:text-muted-foreground"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || (!content.trim() && pendingFiles.length === 0)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              variant="messages"
              title="Aucune conversation sélectionnée"
              description="Choisissez une conversation dans la liste ou créez-en une nouvelle."
            />
          </div>
        )}
      </div>
    </div>
  )
}
