'use client'

import { useState } from 'react'
import { Sparkles, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react'

export default function DemoSeedPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [log, setLog] = useState<string[]>([])
  const [associationId, setAssociationId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  async function runSeed() {
    setStatus('loading')
    setLog([])
    setErrorMsg('')
    try {
      const res = await fetch('/api/seed-demo', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setLog(data.log ?? [])
        setAssociationId(data.associationId)
        setStatus('done')
      } else {
        setErrorMsg(data.error ?? 'Une erreur est survenue')
        setLog(data.log ?? [])
        setStatus('error')
      }
    } catch (e) {
      setErrorMsg(String(e))
      setStatus('error')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-8 py-12">
      <div className="mb-8">
        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Outils</p>
        <h1 className="text-[28px] font-heading italic font-normal text-[32px] mt-1 leading-tight">
          Seed démo
        </h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Crée l'<strong className="text-foreground">Association des Esprits Curieux (AEC)</strong> avec des membres, événements, tâches, finances, messages et notes pré-remplis pour tes vidéos de promo.
        </p>
      </div>

      {/* Info card */}
      <div className="rounded-2xl border border-border bg-muted/40 p-5 mb-6 space-y-2 text-sm">
        <p className="font-medium">Ce qui sera créé :</p>
        <ul className="text-muted-foreground space-y-1 text-[13px]">
          <li>📚 <strong className="text-foreground">AEC</strong> — club de lecture étudiant, violet, slug <code className="text-xs bg-muted px-1.5 py-0.5 rounded">aec</code></li>
          <li>👥 <strong className="text-foreground">7 membres fictifs</strong> + toi en président·e</li>
          <li>📅 <strong className="text-foreground">5 événements</strong> (3 passés, 2 à venir) avec participants, budget et tâches</li>
          <li>✅ <strong className="text-foreground">10 tâches</strong> réparties en groupes, mix todo/done</li>
          <li>💶 <strong className="text-foreground">12 transactions</strong> + 2 dossiers budgétaires</li>
          <li>📄 <strong className="text-foreground">10 documents</strong> en 3 dossiers (Administratif, CRs, Ressources)</li>
          <li>💬 <strong className="text-foreground">2 conversations</strong> avec 14 messages réalistes</li>
          <li>📝 <strong className="text-foreground">4 notes</strong> en 2 dossiers</li>
        </ul>
        <p className="text-xs text-muted-foreground pt-1 border-t border-border">
          Idempotent — peut être relancé plusieurs fois sans créer de doublons.
        </p>
      </div>

      {/* Action */}
      {status === 'idle' && (
        <button
          onClick={runSeed}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          Créer l'association de démo
        </button>
      )}

      {status === 'loading' && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Création en cours…
        </div>
      )}

      {(status === 'done' || status === 'error' || log.length > 0) && (
        <div className={`rounded-2xl border p-5 space-y-3 ${status === 'done' ? 'border-emerald-500/20 bg-emerald-500/5' : status === 'error' ? 'border-red-500/20 bg-red-500/5' : 'border-border bg-muted/40'}`}>
          {status === 'done' && (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle className="h-4 w-4" />
              Association créée avec succès !
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Erreur</p>
                <p className="text-sm text-muted-foreground mt-1 font-mono text-xs">{errorMsg}</p>
              </div>
            </div>
          )}

          {log.length > 0 && (
            <div className="space-y-1">
              {log.map((l, i) => (
                <p key={i} className="text-[12px] font-mono text-muted-foreground">{l}</p>
              ))}
            </div>
          )}

          {status === 'done' && (
            <a
              href="/select"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Sélectionner l'AEC dans le sélecteur d'associations
            </a>
          )}
        </div>
      )}
    </div>
  )
}
