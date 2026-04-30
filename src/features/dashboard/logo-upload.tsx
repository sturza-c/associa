'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Camera, Loader2 } from 'lucide-react'
import { uploadAssociationLogo } from '@/lib/actions/association-settings'
import { useAssociation } from '@/contexts/association-context'
import { cn } from '@/lib/utils'

interface Props {
  associationId: string
  associationName: string
  logoUrl: string | null
  canEdit: boolean
  accent: string
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function LogoUpload({ associationId, associationName, logoUrl, canEdit, accent }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [optimisticUrl, setOptimisticUrl] = useState<string | null>(logoUrl)
  const [busy, setBusy] = useState(false)
  const { patchActiveAssociation } = useAssociation()

  function handlePick() {
    if (!canEdit || pending || busy) return
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
      const res = await uploadAssociationLogo(fd, associationId)
      if (res.error) {
        toast.error(res.error)
        setOptimisticUrl(logoUrl)
      } else {
        const newUrl = res.logo_url ?? null
        setOptimisticUrl(newUrl)
        // Sync the sidebar + context instantly — no refresh needed
        patchActiveAssociation({ logo_url: newUrl })
        toast.success('Logo mis à jour')
      }
      setBusy(false)
    })
  }

  const initials = getInitials(associationName)
  const hasLogo = !!optimisticUrl

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={handlePick}
        disabled={!canEdit || pending || busy}
        className={cn(
          'group relative h-28 w-28 overflow-hidden rounded-3xl ring-1 ring-white/10 transition-all',
          canEdit && 'hover:ring-white/30 cursor-pointer',
          !canEdit && 'cursor-default'
        )}
        style={
          hasLogo
            ? undefined
            : { background: `linear-gradient(135deg, ${accent}44, ${accent}18)` }
        }
        aria-label={canEdit ? "Changer le logo de l'association" : 'Logo'}
      >
        {hasLogo ? (
          <Image
            src={optimisticUrl!}
            alt={associationName}
            fill
            sizes="112px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center font-heading italic text-4xl"
            style={{ color: accent }}
          >
            {initials}
          </div>
        )}

        {canEdit && (
          <div className={cn(
            'absolute inset-0 flex items-center justify-center bg-black/55 transition-opacity',
            (busy || pending) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}>
            {busy || pending ? (
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            ) : (
              <Camera className="h-5 w-5 text-white" />
            )}
          </div>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
