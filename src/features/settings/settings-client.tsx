'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Building2,
  Tag,
  Users as UsersIcon,
  Trash2,
  Plus,
  Pencil,
  X,
  Check,
  LogOut,
  Palette,
} from 'lucide-react'
import { LogoUpload } from '@/features/dashboard/logo-upload'
import {
  updateAssociationIdentity,
  updateRoleLabels,
  createTitle,
  updateTitle,
  deleteTitle,
  assignTitle,
  unassignTitle,
  leaveAssociation,
} from '@/lib/actions/association-settings'
import { roleLabel, ROLE_ORDER, DEFAULT_ROLE_LABELS } from '@/lib/roles'
import type {
  Association,
  AssociationTitle,
  Role,
  RoleLabels,
} from '@/types/database'
import { cn } from '@/lib/utils'

interface MemberWithTitles {
  membership_id: string
  user_id: string
  role: Role
  full_name: string | null
  email: string
  title_ids: string[]
}

const ACCENT_PRESETS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#10b981', '#06b6d4', '#3b82f6',
  '#94a3b8', '#0f172a',
]

const TITLE_COLOR_PRESETS = [
  '#94a3b8', '#a78bfa', '#f472b6', '#fb7185',
  '#fbbf24', '#34d399', '#22d3ee', '#60a5fa',
]

function getInitials(name: string | null, email: string) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (email[0] ?? '?').toUpperCase()
}

interface Props {
  association: Association
  titles: AssociationTitle[]
  members: MemberWithTitles[]
  currentUserId: string
  callerRole: Role
}

export function SettingsClient({ association, titles, members, currentUserId, callerRole }: Props) {
  const isPresident = callerRole === 'president'

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/6 shrink-0">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">
            Administration
          </p>
          <h1 className="text-[28px] font-semibold mt-1 leading-tight tracking-tight">
            <span className="font-heading italic font-normal text-[32px]">Paramètres</span>
          </h1>
        </div>
        {!isPresident && (
          <span className="text-xs text-muted-foreground italic">
            Lecture seule — seul le président peut modifier
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-10 space-y-14">

          <IdentitySection association={association} canEdit={isPresident} />

          <RoleLabelsSection
            associationId={association.id}
            currentLabels={association.role_labels ?? {}}
            canEdit={isPresident}
          />

          <TitlesSection
            associationId={association.id}
            titles={titles}
            canEdit={isPresident}
          />

          <MembersSection
            associationId={association.id}
            titles={titles}
            members={members}
            customRoleLabels={association.role_labels ?? null}
            canEdit={isPresident}
          />

          <DangerSection
            associationId={association.id}
            currentUserId={currentUserId}
            members={members}
          />

        </div>
      </div>
    </div>
  )
}

// ---------------- Section header ----------------

function SectionHeader({ icon: Icon, eyebrow, title }: { icon: React.ElementType; eyebrow: string; title: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 pb-3 border-b border-white/6 mb-6">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="text-lg ml-auto font-heading italic font-normal">
        {title}
      </h2>
    </div>
  )
}

// ---------------- Identity ----------------

function IdentitySection({ association, canEdit }: { association: Association; canEdit: boolean }) {
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(association.name)
  const [description, setDescription] = useState(association.description ?? '')
  const [accentColor, setAccentColor] = useState(association.accent_color)

  const dirty =
    name !== association.name ||
    description !== (association.description ?? '') ||
    accentColor !== association.accent_color

  function save() {
    if (!canEdit || !dirty) return
    startTransition(async () => {
      const res = await updateAssociationIdentity(association.id, {
        name,
        description,
        accent_color: accentColor,
      })
      if (res.error) toast.error(res.error)
      else toast.success('Identité mise à jour')
    })
  }

  return (
    <section>
      <SectionHeader icon={Building2} eyebrow="Identité" title="L'association" />

      <div className="space-y-6">
        <div className="flex items-start gap-5">
          <LogoUpload
            associationId={association.id}
            associationName={association.name || 'Association'}
            logoUrl={association.logo_url}
            canEdit={canEdit}
            accent={association.accent_color}
          />
          <div className="flex-1 space-y-4">
            <Field label="Nom">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={!canEdit}
                className="w-full bg-transparent border-0 border-b border-white/10 py-1.5 text-base focus:outline-none focus:border-white/40 transition-colors disabled:opacity-60"
              />
            </Field>
            <Field label="Description" hint="(optionnelle)">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={!canEdit}
                rows={2}
                placeholder="Une ligne ou deux pour présenter l'association"
                className="w-full bg-transparent border-0 border-b border-white/10 py-1.5 text-sm resize-none focus:outline-none focus:border-white/40 transition-colors disabled:opacity-60 placeholder:text-muted-foreground/40"
              />
            </Field>
          </div>
        </div>

        <div>
          <Field label="Couleur d'accent" icon={Palette}>
            <div className="flex flex-wrap items-center gap-2">
              {ACCENT_PRESETS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => canEdit && setAccentColor(c)}
                  disabled={!canEdit}
                  className={cn(
                    'h-7 w-7 rounded-full transition-all',
                    accentColor.toLowerCase() === c
                      ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110'
                      : 'ring-1 ring-white/15 hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
              <input
                type="color"
                value={accentColor}
                onChange={e => setAccentColor(e.target.value)}
                disabled={!canEdit}
                className="h-7 w-7 rounded-full cursor-pointer bg-transparent border border-white/15 disabled:opacity-50"
              />
              <span className="text-xs tabular-nums text-muted-foreground ml-2">{accentColor}</span>
            </div>
          </Field>
        </div>

        {canEdit && (
          <div className="flex justify-end pt-2">
            <button
              onClick={save}
              disabled={!dirty || pending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function Field({
  label,
  hint,
  icon: Icon,
  children,
}: {
  label: string
  hint?: string
  icon?: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
        {hint && <span className="font-normal normal-case tracking-normal text-muted-foreground/60">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

// ---------------- Role labels ----------------

function RoleLabelsSection({
  associationId,
  currentLabels,
  canEdit,
}: {
  associationId: string
  currentLabels: RoleLabels
  canEdit: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [labels, setLabels] = useState<RoleLabels>(() => {
    const init: RoleLabels = {}
    for (const r of ROLE_ORDER) init[r] = currentLabels[r] ?? ''
    return init
  })

  const dirty = ROLE_ORDER.some(r => (labels[r] ?? '') !== (currentLabels[r] ?? ''))

  function save() {
    if (!canEdit || !dirty) return
    startTransition(async () => {
      const res = await updateRoleLabels(associationId, labels)
      if (res.error) toast.error(res.error)
      else toast.success('Rôles renommés')
    })
  }

  function reset() {
    setLabels({})
    if (!canEdit) return
    startTransition(async () => {
      const res = await updateRoleLabels(associationId, {})
      if (res.error) toast.error(res.error)
      else toast.success('Noms par défaut rétablis')
    })
  }

  return (
    <section>
      <SectionHeader icon={UsersIcon} eyebrow="Rôles" title="Renommer les rôles" />

      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        Les rôles structurels — <em className="font-heading">président, trésorier, secrétaire, membre</em> — restent identiques côté permissions, mais vous pouvez leur donner les noms qui parlent à votre association. Laissez vide pour conserver le nom par défaut.
      </p>

      <div className="space-y-3">
        {ROLE_ORDER.map(role => (
          <div key={role} className="grid grid-cols-[1fr_2fr] items-center gap-4">
            <p className="text-xs text-muted-foreground tabular-nums">
              <span className="font-mono text-muted-foreground/60">{role}</span>
              <span className="text-muted-foreground/40 mx-1">·</span>
              défaut: {DEFAULT_ROLE_LABELS[role]}
            </p>
            <input
              value={labels[role] ?? ''}
              onChange={e => setLabels(l => ({ ...l, [role]: e.target.value }))}
              disabled={!canEdit}
              placeholder={DEFAULT_ROLE_LABELS[role]}
              maxLength={60}
              className="w-full bg-transparent border-0 border-b border-white/10 py-1.5 text-sm focus:outline-none focus:border-white/40 transition-colors disabled:opacity-60 placeholder:text-muted-foreground/40"
            />
          </div>
        ))}
      </div>

      {canEdit && (
        <div className="flex justify-end gap-3 pt-5">
          <button
            onClick={reset}
            disabled={pending}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            Rétablir les défauts
          </button>
          <button
            onClick={save}
            disabled={!dirty || pending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      )}
    </section>
  )
}

// ---------------- Custom titles ----------------

function TitlesSection({
  associationId,
  titles,
  canEdit,
}: {
  associationId: string
  titles: AssociationTitle[]
  canEdit: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(TITLE_COLOR_PRESETS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  function handleCreate() {
    if (!newName.trim()) return
    startTransition(async () => {
      const res = await createTitle(associationId, { name: newName, color: newColor })
      if (res.error) toast.error(res.error)
      else {
        toast.success('Titre créé')
        setNewName('')
        setNewColor(TITLE_COLOR_PRESETS[0])
        setCreating(false)
        router.refresh()
      }
    })
  }

  function startEdit(t: AssociationTitle) {
    setEditingId(t.id)
    setEditName(t.name)
    setEditColor(t.color)
  }

  function handleEdit() {
    if (!editingId || !editName.trim()) return
    const id = editingId
    startTransition(async () => {
      const res = await updateTitle(id, associationId, { name: editName, color: editColor })
      if (res.error) toast.error(res.error)
      else {
        toast.success('Titre mis à jour')
        setEditingId(null)
        router.refresh()
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteTitle(id, associationId)
      if (res.error) toast.error(res.error)
      else {
        toast.success('Titre supprimé')
        router.refresh()
      }
    })
  }

  return (
    <section>
      <SectionHeader icon={Tag} eyebrow="Titres" title="Titres personnalisés" />

      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        Ajoutez des titres en plus des rôles : <em className="font-heading">vice-président, responsable événements, webmestre…</em> Ils sont purement honorifiques et n&apos;influencent pas les permissions.
      </p>

      <div className="space-y-2">
        {titles.length === 0 && !creating && (
          <p className="text-sm text-muted-foreground/60 italic font-heading py-4">
            Aucun titre pour le moment.
          </p>
        )}

        {titles.map(t => {
          const isEditing = editingId === t.id
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 py-2 border-b border-white/[0.04]"
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: t.color }}
              />
              {isEditing ? (
                <>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="flex-1 bg-transparent border-0 border-b border-white/15 py-1 text-sm focus:outline-none focus:border-white/40"
                    autoFocus
                  />
                  <ColorPicker value={editColor} onChange={setEditColor} />
                  <button
                    onClick={handleEdit}
                    disabled={pending}
                    className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-emerald-500/15 text-emerald-400 transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/8 text-muted-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm">{t.name}</span>
                  {canEdit && (
                    <>
                      <button
                        onClick={() => startEdit(t)}
                        className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/8 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        disabled={pending}
                        className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-red-500/15 hover:text-red-400 text-muted-foreground transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )
        })}

        {creating && canEdit && (
          <div className="flex items-center gap-3 py-2 border-b border-white/[0.04]">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: newColor }} />
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nom du titre"
              className="flex-1 bg-transparent border-0 border-b border-white/15 py-1 text-sm focus:outline-none focus:border-white/40"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <ColorPicker value={newColor} onChange={setNewColor} />
            <button
              onClick={handleCreate}
              disabled={pending || !newName.trim()}
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-emerald-500/15 text-emerald-400 transition-colors disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => { setCreating(false); setNewName('') }}
              className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/8 text-muted-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {canEdit && !creating && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-3"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter un titre
          </button>
        )}
      </div>
    </section>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-1">
      {TITLE_COLOR_PRESETS.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            'h-4 w-4 rounded-full transition-transform',
            value.toLowerCase() === c ? 'scale-125 ring-1 ring-white' : 'hover:scale-110'
          )}
          style={{ backgroundColor: c }}
          aria-label={c}
        />
      ))}
    </div>
  )
}

// ---------------- Members & assigned titles ----------------

function MembersSection({
  associationId,
  titles,
  members,
  customRoleLabels,
  canEdit,
}: {
  associationId: string
  titles: AssociationTitle[]
  members: MemberWithTitles[]
  customRoleLabels: RoleLabels | null
  canEdit: boolean
}) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const [openMember, setOpenMember] = useState<string | null>(null)

  function toggle(membershipId: string, titleId: string, hasTitle: boolean) {
    startTransition(async () => {
      const res = hasTitle
        ? await unassignTitle(membershipId, titleId, associationId)
        : await assignTitle(membershipId, titleId, associationId)
      if (res.error) toast.error(res.error)
      else router.refresh()
    })
  }

  return (
    <section>
      <SectionHeader icon={UsersIcon} eyebrow="Équipe" title="Titres attribués" />

      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic font-heading py-4">
          Aucun membre pour le moment.
        </p>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {members.map(m => {
            const memberTitles = titles.filter(t => m.title_ids.includes(t.id))
            const isOpen = openMember === m.membership_id
            return (
              <div key={m.membership_id} className="py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/15 to-white/5 text-[11px] font-semibold ring-1 ring-white/10">
                    {getInitials(m.full_name, m.email)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {m.full_name || m.email.split('@')[0]}
                      {m.user_id === undefined && null}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {roleLabel(m.role, customRoleLabels)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 max-w-[40%] justify-end">
                    {memberTitles.length === 0 ? (
                      <span className="text-[11px] text-muted-foreground/50 italic">aucun titre</span>
                    ) : (
                      memberTitles.map(t => (
                        <span
                          key={t.id}
                          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1"
                          style={{
                            color: t.color,
                            borderColor: `${t.color}55`,
                            backgroundColor: `${t.color}10`,
                          }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                          {t.name}
                        </span>
                      ))
                    )}
                  </div>
                  {canEdit && titles.length > 0 && (
                    <button
                      onClick={() => setOpenMember(isOpen ? null : m.membership_id)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2"
                    >
                      {isOpen ? 'Fermer' : 'Modifier'}
                    </button>
                  )}
                </div>

                {isOpen && canEdit && titles.length > 0 && (
                  <div className="mt-3 ml-11 flex flex-wrap gap-2">
                    {titles.map(t => {
                      const has = m.title_ids.includes(t.id)
                      return (
                        <button
                          key={t.id}
                          onClick={() => toggle(m.membership_id, t.id, has)}
                          disabled={pending}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 transition-all disabled:opacity-50',
                            has
                              ? 'ring-current'
                              : 'ring-white/10 text-muted-foreground hover:text-foreground hover:ring-white/30'
                          )}
                          style={has ? {
                            color: t.color,
                            borderColor: t.color,
                            backgroundColor: `${t.color}15`,
                          } : undefined}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                          {t.name}
                          {has && <Check className="h-3 w-3" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {titles.length === 0 && (
        <p className="text-xs text-muted-foreground/60 mt-4">
          Créez d&apos;abord des titres ci-dessus pour pouvoir les attribuer.
        </p>
      )}
    </section>
  )
}

// ---------------- Danger zone ----------------

function DangerSection({
  associationId,
  currentUserId,
  members,
}: {
  associationId: string
  currentUserId: string
  members: MemberWithTitles[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  const me = members.find(m => m.user_id === currentUserId)
  const presidentCount = members.filter(m => m.role === 'president').length
  const isLastPresident = me?.role === 'president' && presidentCount <= 1

  function handleLeave() {
    if (isLastPresident) {
      toast.error('Désignez un autre président avant de quitter l\'association')
      return
    }
    startTransition(async () => {
      const res = await leaveAssociation(associationId)
      if (res.error) toast.error(res.error)
      else {
        toast.success('Vous avez quitté l\'association')
        router.push('/select')
        router.refresh()
      }
    })
  }

  return (
    <section className="pt-6 mt-4 border-t border-red-500/15">
      <div className="flex items-baseline gap-3 mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-red-400/70">
          Zone sensible
        </p>
        <h2 className="text-lg ml-auto font-heading italic font-normal text-red-300/90">
          Quitter
        </h2>
      </div>

      <div className="rounded-xl border border-red-500/15 bg-red-500/[0.03] p-5">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Quitter l&apos;association vous retire des conversations, des tâches et des budgets. Vos contributions passées restent intactes — seul votre accès est désactivé.
        </p>
        {isLastPresident && (
          <p className="text-xs text-amber-300/90 mt-2">
            Vous êtes le seul président actif. Désignez un autre président avant de quitter.
          </p>
        )}

        <div className="mt-4 flex items-center justify-end gap-3">
          {confirming ? (
            <>
              <button
                onClick={() => setConfirming(false)}
                disabled={pending}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleLeave}
                disabled={pending || isLastPresident}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {pending ? 'En cours...' : 'Confirmer le départ'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              disabled={isLastPresident}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <LogOut className="h-3.5 w-3.5" />
              Quitter l&apos;association
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
