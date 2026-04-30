'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Camera, Loader2 } from 'lucide-react'
import { uploadProfileAvatar } from '@/lib/actions/profile'
import { cn } from '@/lib/utils'

interface Props {
  userId: string
  avatarUrl: string | null
  fullName: string | null
  email: string
  size?: 'md' | 'lg'
  /** Called with the new public URL after a successful upload */
  onUploaded?: (url: string) => void
}

function initials(name: string | null, email: string) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (email[0] ?? '?').toUpperCase()
}

export function AvatarUpload({ userId, avatarUrl, fullName, email, size = 'lg', onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [, startTransition] = useTransition()
  const [optimisticUrl, setOptimisticUrl] = useState<string | null>(avatarUrl)

  const dim = size === 'lg' ? 'h-20 w-20' : 'h-12 w-12'
  const textSize = size === 'lg' ? 'text-2xl' : 'text-sm'
  const rounded = 'rounded-2xl'

  function handlePick() {
    if (busy) return
    inputRef.current?.click()
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setBusy(true)
    const localUrl = URL.createObjectURL(file)
    setOptimisticUrl(localUrl)

    const fd = new FormData()
    fd.append('file', file)

    startTransition(async () => {
      const res = await uploadProfileAvatar(fd)
      if (res.error) {
        toast.error(res.error)
        setOptimisticUrl(avatarUrl)
      } else {
        const newUrl = res.avatar_url ?? null
        setOptimisticUrl(newUrl)
        onUploaded?.(newUrl ?? '')
        toast.success('Photo mise à jour')
      }
      setBusy(false)
    })
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={handlePick}
        disabled={busy}
        className={cn(
          'group relative overflow-hidden ring-1 ring-white/10 transition-all cursor-pointer hover:ring-white/30',
          dim, rounded
        )}
        aria-label="Changer la photo de profil"
      >
        {optimisticUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={optimisticUrl} alt={fullName ?? email} className="h-full w-full object-cover" />
        ) : (
          <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br from-white/15 to-white/5 font-semibold', textSize)}>
            {initials(fullName, email)}
          </div>
        )}

        {/* Hover overlay */}
        <div className={cn(
          'absolute inset-0 flex items-center justify-center bg-black/55 transition-opacity',
          busy ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}>
          {busy
            ? <Loader2 className="h-4 w-4 text-white animate-spin" />
            : <Camera className="h-4 w-4 text-white" />
          }
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
