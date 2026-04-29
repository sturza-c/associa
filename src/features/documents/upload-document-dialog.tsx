'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { getSignedUploadUrl, saveDocument } from '@/lib/actions/documents'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Upload, File } from 'lucide-react'
import type { DocumentFolder } from '@/types/database'

const MAX_SIZE = 20 * 1024 * 1024 // 20MB

interface Props {
  associationId: string
  folders: DocumentFolder[]
}

export function UploadDocumentDialog({ associationId, folders }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [folderId, setFolderId] = useState<string>(folders[0]?.id ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!folderId && folders[0]) setFolderId(folders[0].id)
  }, [folders, folderId])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > MAX_SIZE) {
      toast.error('Le fichier ne doit pas dépasser 20 Mo')
      return
    }
    setFile(f)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return toast.error('Veuillez sélectionner un fichier')
    if (!folderId) return toast.error('Créez d\'abord un dossier')

    const folder = folders.find(f => f.id === folderId)
    if (!folder) return toast.error('Dossier introuvable')

    setLoading(true)
    try {
      const slug = folder.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 32) || 'folder'
      const result = await getSignedUploadUrl(associationId, slug, file.name)
      if (result.error || !result.signedUrl || !result.path) {
        toast.error(result.error ?? 'Erreur')
        return
      }

      const uploadRes = await fetch(result.signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      })

      if (!uploadRes.ok) {
        toast.error('Échec de l\'upload')
        return
      }

      const saveResult = await saveDocument({
        associationId,
        name: file.name,
        filePath: result.path,
        fileSize: file.size,
        mimeType: file.type,
        folder: slug,
        folderId: folder.id,
      })

      if (saveResult.error) {
        toast.error(saveResult.error)
        return
      }

      toast.success('Document uploadé')
      setFile(null)
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
        <Upload className="h-4 w-4" />
        Uploader
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">

        <DialogHeader>
          <DialogTitle>Uploader un document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Fichier <span className="text-muted-foreground text-xs">(max 20 Mo)</span></Label>
            <div
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/50 p-12 cursor-pointer hover:border-border transition-colors"
            >
              {file ? (
                <div className="flex items-center gap-2 text-sm">
                  <File className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{file.name}</span>
                  <span className="text-muted-foreground">
                    ({(file.size / 1024 / 1024).toFixed(1)} Mo)
                  </span>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Cliquez pour sélectionner un fichier</p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder">Dossier</Label>
            {folders.length === 0 ? (
              <p className="text-sm text-muted-foreground italic rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
                Aucun dossier. Créez-en un depuis la barre latérale d&apos;abord.
              </p>
            ) : (
              <select
                id="folder"
                value={folderId}
                onChange={e => setFolderId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={loading || !file || !folderId}>
              {loading ? 'Upload...' : 'Uploader'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
