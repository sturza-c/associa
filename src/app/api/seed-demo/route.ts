/**
 * POST /api/seed-demo
 *
 * Seeds the "Association des Esprits Curieux (AEC)" demo association with
 * realistic members, events, tasks, documents, finances, messages and notes.
 * Idempotent — safe to run multiple times.
 *
 * The authenticated user (x-user-id) is automatically added as a member
 * so they can navigate the populated dashboard immediately.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Fixed demo UUIDs (deterministic, never change) ────────────────────────────

const AEC_ID         = 'aaaaaaaa-0000-0000-0000-000000000001'

// Demo user IDs
const U_LEA          = 'aaaaaaaa-0000-0000-0001-000000000001'
const U_MAXIME       = 'aaaaaaaa-0000-0000-0001-000000000002'
const U_CHLOE        = 'aaaaaaaa-0000-0000-0001-000000000003'
const U_ANTOINE      = 'aaaaaaaa-0000-0000-0001-000000000004'
const U_INES         = 'aaaaaaaa-0000-0000-0001-000000000005'
const U_THOMAS       = 'aaaaaaaa-0000-0000-0001-000000000006'
const U_CAMILLE      = 'aaaaaaaa-0000-0000-0001-000000000007'

// Membership IDs
const M_LEA          = 'aaaaaaaa-0000-0000-0002-000000000001'
const M_MAXIME       = 'aaaaaaaa-0000-0000-0002-000000000002'
const M_CHLOE        = 'aaaaaaaa-0000-0000-0002-000000000003'
const M_ANTOINE      = 'aaaaaaaa-0000-0000-0002-000000000004'
const M_INES         = 'aaaaaaaa-0000-0000-0002-000000000005'
const M_THOMAS       = 'aaaaaaaa-0000-0000-0002-000000000006'
const M_CAMILLE      = 'aaaaaaaa-0000-0000-0002-000000000007'

// Event IDs
const EV_CAMUS_PAST  = 'aaaaaaaa-0000-0000-0003-000000000001'
const EV_HUGO_PAST   = 'aaaaaaaa-0000-0000-0003-000000000002'
const EV_ATELIER     = 'aaaaaaaa-0000-0000-0003-000000000003'
const EV_ETRANGER    = 'aaaaaaaa-0000-0000-0003-000000000004'
const EV_AG          = 'aaaaaaaa-0000-0000-0003-000000000005'

// Finance category IDs
const FC_COTIS       = 'aaaaaaaa-0000-0000-0004-000000000001'
const FC_ACHATS      = 'aaaaaaaa-0000-0000-0004-000000000002'
const FC_SUBVENTION  = 'aaaaaaaa-0000-0000-0004-000000000003'
const FC_EVENEMENTS  = 'aaaaaaaa-0000-0000-0004-000000000004'

// Document folder IDs
const DF_ADMIN       = 'aaaaaaaa-0000-0000-0005-000000000001'
const DF_CR          = 'aaaaaaaa-0000-0000-0005-000000000002'
const DF_RESSOURCES  = 'aaaaaaaa-0000-0000-0005-000000000003'

// Note folder IDs
const NF_IDEES       = 'aaaaaaaa-0000-0000-0006-000000000001'
const NF_RESSOURCES  = 'aaaaaaaa-0000-0000-0006-000000000002'

// Conversation IDs
const CONV_LIVRE     = 'aaaaaaaa-0000-0000-0007-000000000001'
const CONV_AG        = 'aaaaaaaa-0000-0000-0007-000000000002'

// Task group IDs
const TG_LECTURE     = 'aaaaaaaa-0000-0000-0008-000000000001'
const TG_ADMIN       = 'aaaaaaaa-0000-0000-0008-000000000002'

// ── Demo users data ───────────────────────────────────────────────────────────

const DEMO_USERS = [
  { id: U_LEA,     email: 'lea.rousseau@aec-demo.ch',    full_name: 'Léa Rousseau',    role: 'president' as const,  membershipId: M_LEA },
  { id: U_MAXIME,  email: 'maxime.bernard@aec-demo.ch',  full_name: 'Maxime Bernard',   role: 'secretary' as const,  membershipId: M_MAXIME },
  { id: U_CHLOE,   email: 'chloe.martin@aec-demo.ch',    full_name: 'Chloé Martin',     role: 'treasurer' as const,  membershipId: M_CHLOE },
  { id: U_ANTOINE, email: 'antoine.dupont@aec-demo.ch',  full_name: 'Antoine Dupont',   role: 'member' as const,     membershipId: M_ANTOINE },
  { id: U_INES,    email: 'ines.lefevre@aec-demo.ch',    full_name: 'Inès Lefèvre',     role: 'member' as const,     membershipId: M_INES },
  { id: U_THOMAS,  email: 'thomas.petit@aec-demo.ch',    full_name: 'Thomas Petit',     role: 'member' as const,     membershipId: M_THOMAS },
  { id: U_CAMILLE, email: 'camille.durand@aec-demo.ch',  full_name: 'Camille Durand',   role: 'member' as const,     membershipId: M_CAMILLE },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function id() { return crypto.randomUUID() }

async function ensureAuthUser(admin: ReturnType<typeof createAdminClient>, userId: string, email: string, fullName: string) {
  // Check if user already exists in user_profiles (proxy for auth existence)
  const { data: existing } = await admin
    .from('user_profiles').select('id').eq('id', userId).single()
  if (existing) return { id: userId }

  // Try to create the auth user
  try {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: 'AEC-Demo-2026!',
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })
    if (error) throw error
    return data.user
  } catch (e: unknown) {
    // If creation fails because user exists under a different UUID, look them up
    const err = e as { message?: string; code?: string }
    if (err?.message?.includes('already') || err?.code === '23505') {
      return { id: userId }
    }
    throw e
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const callerUserId = req.headers.get('x-user-id')
  if (!callerUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const log: string[] = []

  try {
    // ── 1. Create demo auth users ─────────────────────────────────────────────
    for (const u of DEMO_USERS) {
      await ensureAuthUser(admin, u.id, u.email, u.full_name)
    }
    log.push('✓ Demo users ensured')

    // ── 2. Upsert user profiles ───────────────────────────────────────────────
    await admin.from('user_profiles').upsert(
      DEMO_USERS.map(u => ({ id: u.id, email: u.email, full_name: u.full_name })),
      { onConflict: 'id' }
    )
    log.push('✓ User profiles upserted')

    // ── 3. Create the AEC association ─────────────────────────────────────────
    await admin.from('associations').upsert({
      id: AEC_ID,
      name: "Association des Esprits Curieux",
      description: "Un club de lecture étudiant ouvert à toutes et tous, sans condition de faculté ni de niveau. Ses membres se retrouvent régulièrement pour discuter d'œuvres choisies ensemble — romans, essais, philosophie ou histoire. L'ambiance se veut conviviale et sans prétention : seule la curiosité est requise.",
      accent_color: '#7c3aed',
      slug: 'aec',
      is_public: true,
    }, { onConflict: 'id' })
    log.push('✓ Association created')

    // ── 4. Memberships (demo users) ───────────────────────────────────────────
    await admin.from('association_memberships').upsert(
      DEMO_USERS.map((u, i) => ({
        id: u.membershipId,
        association_id: AEC_ID,
        user_id: u.id,
        role: u.role,
        is_active: true,
        joined_at: `2025-09-${String(5 + i).padStart(2, '0')}T10:00:00Z`,
      })),
      { onConflict: 'id' }
    )
    log.push('✓ Demo memberships created')

    // ── 5. Add caller as member ───────────────────────────────────────────────
    const { data: callerMembership } = await admin
      .from('association_memberships')
      .select('id')
      .eq('association_id', AEC_ID)
      .eq('user_id', callerUserId)
      .single()

    if (!callerMembership) {
      await admin.from('association_memberships').insert({
        association_id: AEC_ID,
        user_id: callerUserId,
        role: 'president',
        is_active: true,
      })
      log.push('✓ Caller added as president')
    } else {
      log.push('✓ Caller already member')
    }

    // ── 6. Association titles ─────────────────────────────────────────────────
    await admin.from('association_titles').upsert([
      { id: id(), association_id: AEC_ID, name: 'Fondateur·ice', color: '#7c3aed', position: 0 },
      { id: id(), association_id: AEC_ID, name: 'Responsable comm.', color: '#0ea5e9', position: 1 },
      { id: id(), association_id: AEC_ID, name: 'Bibliothécaire', color: '#10b981', position: 2 },
    ], { onConflict: 'association_id, name' }).throwOnError()
    log.push('✓ Association titles created')

    // ── 7. Task groups ────────────────────────────────────────────────────────
    await admin.from('task_groups').upsert([
      { id: TG_LECTURE, association_id: AEC_ID, name: 'Séances de lecture', color: '#7c3aed', created_by: U_LEA },
      { id: TG_ADMIN,   association_id: AEC_ID, name: 'Administration',    color: '#0ea5e9', created_by: U_LEA },
    ], { onConflict: 'id' })
    log.push('✓ Task groups created')

    // ── 8. Tasks ──────────────────────────────────────────────────────────────
    const TASKS = [
      { id: id(), title: "Commander 8 ex. de 'Fahrenheit 451'",      priority: 'high'   as const, status: 'todo'       as const, assigned_to: U_CHLOE,   due_date: '2026-05-18', group_id: TG_LECTURE },
      { id: id(), title: "Réserver la salle pour juin",               priority: 'high'   as const, status: 'todo'       as const, assigned_to: U_MAXIME,  due_date: '2026-05-20', group_id: TG_ADMIN },
      { id: id(), title: "Envoyer les convocations AG",               priority: 'high'   as const, status: 'in_progress'as const, assigned_to: U_MAXIME,  due_date: '2026-05-25', group_id: TG_ADMIN },
      { id: id(), title: "Préparer l'ordre du jour de l'AG",         priority: 'medium' as const, status: 'in_progress'as const, assigned_to: U_LEA,     due_date: '2026-06-10', group_id: TG_ADMIN },
      { id: id(), title: "Organiser le vote pour le livre de juillet",priority: 'medium' as const, status: 'todo'       as const, assigned_to: U_ANTOINE, due_date: '2026-05-30', group_id: TG_LECTURE },
      { id: id(), title: "Mettre à jour la liste des membres",        priority: 'low'    as const, status: 'todo'       as const, assigned_to: U_MAXIME,  due_date: null,         group_id: TG_ADMIN },
      { id: id(), title: "Rédiger le CR de la soirée Misérables",    priority: 'medium' as const, status: 'done'       as const, assigned_to: U_MAXIME,  due_date: '2026-03-01', group_id: TG_LECTURE },
      { id: id(), title: "Commander les livres pour L'Étranger",     priority: 'high'   as const, status: 'done'       as const, assigned_to: U_CHLOE,   due_date: '2026-05-10', group_id: TG_LECTURE },
      { id: id(), title: "Préparer les questions de discussion",      priority: 'medium' as const, status: 'done'       as const, assigned_to: U_LEA,     due_date: '2026-05-15', group_id: TG_LECTURE },
      { id: id(), title: "Poster l'annonce sur les réseaux sociaux",  priority: 'low'    as const, status: 'done'       as const, assigned_to: U_INES,    due_date: '2026-05-18', group_id: TG_LECTURE },
    ]
    for (const t of TASKS) {
      await admin.from('tasks').upsert({
        ...t,
        association_id: AEC_ID,
        created_by: U_LEA,
        description: null,
        is_personal: false,
      }, { onConflict: 'id' })
    }
    log.push('✓ Tasks created')

    // ── 9. Events ─────────────────────────────────────────────────────────────
    await admin.from('events').upsert([
      {
        id: EV_CAMUS_PAST,
        association_id: AEC_ID,
        name: "Discussion : Le Mythe de Sisyphe",
        description: "Séance de discussion autour de l'essai philosophique d'Albert Camus. Qu'est-ce que l'absurde ? Peut-on trouver un sens à l'existence malgré tout ?",
        event_date: '2026-01-15',
        start_time: '18:30:00',
        end_time: '20:30:00',
        location: 'Bibliothèque universitaire, salle 204',
        status: 'done',
        max_participants: 20,
        created_by: U_LEA,
      },
      {
        id: EV_HUGO_PAST,
        association_id: AEC_ID,
        name: "Soirée littéraire : Les Misérables",
        description: "Discussion du chef-d'œuvre de Victor Hugo. Jean Valjean, Cosette, Javert — retour sur les personnages inoubliables et les thèmes universels de ce roman.",
        event_date: '2026-02-20',
        start_time: '19:00:00',
        end_time: '21:00:00',
        location: 'Café des Étudiants, rue des Acacias 12',
        status: 'done',
        max_participants: 15,
        created_by: U_LEA,
      },
      {
        id: EV_ATELIER,
        association_id: AEC_ID,
        name: "Atelier d'écriture créative",
        description: "Atelier pratique pour explorer l'écriture courte : contraintes OuLiPo, micro-nouvelles et exercices de style.",
        event_date: '2026-03-10',
        start_time: '17:00:00',
        end_time: '19:00:00',
        location: 'Salle B102, Bâtiment principal',
        status: 'done',
        max_participants: 12,
        created_by: U_MAXIME,
      },
      {
        id: EV_ETRANGER,
        association_id: AEC_ID,
        name: "Café littéraire : L'Étranger",
        description: "Séance de discussion autour du roman d'Albert Camus. La notion d'absurde, l'indifférence de Meursault et la question de la culpabilité seront au cœur des échanges.",
        event_date: '2026-05-22',
        start_time: '18:30:00',
        end_time: '20:30:00',
        location: 'Salle B204, Bâtiment principal',
        status: 'planned',
        max_participants: 15,
        created_by: U_LEA,
      },
      {
        id: EV_AG,
        association_id: AEC_ID,
        name: "Assemblée Générale 2026",
        description: "AG annuelle de l'AEC. Bilan de l'année écoulée, rapport financier, élection du nouveau bureau et planning 2026-2027. La présence de tous les membres est souhaitée.",
        event_date: '2026-06-15',
        start_time: '17:00:00',
        end_time: '19:00:00',
        location: 'Amphithéâtre A1, Université',
        status: 'planned',
        max_participants: null,
        created_by: U_LEA,
      },
    ], { onConflict: 'id' })
    log.push('✓ Events created')

    // ── 10. Event participants ─────────────────────────────────────────────────
    const participants = [
      // Past event 1 — Camus
      { id: id(), event_id: EV_CAMUS_PAST, user_id: U_LEA,     response: 'going'    as const },
      { id: id(), event_id: EV_CAMUS_PAST, user_id: U_MAXIME,  response: 'going'    as const },
      { id: id(), event_id: EV_CAMUS_PAST, user_id: U_CHLOE,   response: 'going'    as const },
      { id: id(), event_id: EV_CAMUS_PAST, user_id: U_ANTOINE, response: 'going'    as const },
      { id: id(), event_id: EV_CAMUS_PAST, user_id: U_THOMAS,  response: 'going'    as const },
      { id: id(), event_id: EV_CAMUS_PAST, user_id: U_CAMILLE, response: 'declined' as const },
      // Past event 2 — Hugo
      { id: id(), event_id: EV_HUGO_PAST, user_id: U_LEA,     response: 'going'    as const },
      { id: id(), event_id: EV_HUGO_PAST, user_id: U_MAXIME,  response: 'going'    as const },
      { id: id(), event_id: EV_HUGO_PAST, user_id: U_ANTOINE, response: 'going'    as const },
      { id: id(), event_id: EV_HUGO_PAST, user_id: U_INES,    response: 'going'    as const },
      { id: id(), event_id: EV_HUGO_PAST, user_id: U_THOMAS,  response: 'maybe'    as const },
      // Atelier
      { id: id(), event_id: EV_ATELIER, user_id: U_LEA,     response: 'going'    as const },
      { id: id(), event_id: EV_ATELIER, user_id: U_CHLOE,   response: 'going'    as const },
      { id: id(), event_id: EV_ATELIER, user_id: U_ANTOINE, response: 'going'    as const },
      { id: id(), event_id: EV_ATELIER, user_id: U_INES,    response: 'going'    as const },
      { id: id(), event_id: EV_ATELIER, user_id: U_CAMILLE, response: 'going'    as const },
      { id: id(), event_id: EV_ATELIER, user_id: U_THOMAS,  response: 'maybe'    as const },
      // L'Étranger (upcoming)
      { id: id(), event_id: EV_ETRANGER, user_id: U_LEA,     response: 'going'    as const },
      { id: id(), event_id: EV_ETRANGER, user_id: U_MAXIME,  response: 'going'    as const },
      { id: id(), event_id: EV_ETRANGER, user_id: U_CHLOE,   response: 'going'    as const },
      { id: id(), event_id: EV_ETRANGER, user_id: U_ANTOINE, response: 'going'    as const },
      { id: id(), event_id: EV_ETRANGER, user_id: U_INES,    response: 'going'    as const },
      { id: id(), event_id: EV_ETRANGER, user_id: U_THOMAS,  response: 'maybe'    as const },
      { id: id(), event_id: EV_ETRANGER, user_id: U_CAMILLE, response: 'declined' as const },
      // AG
      { id: id(), event_id: EV_AG, user_id: U_LEA,     response: 'going' as const },
      { id: id(), event_id: EV_AG, user_id: U_MAXIME,  response: 'going' as const },
      { id: id(), event_id: EV_AG, user_id: U_CHLOE,   response: 'going' as const },
      { id: id(), event_id: EV_AG, user_id: U_ANTOINE, response: 'going' as const },
      { id: id(), event_id: EV_AG, user_id: U_INES,    response: 'going' as const },
      { id: id(), event_id: EV_AG, user_id: U_THOMAS,  response: 'going' as const },
      { id: id(), event_id: EV_AG, user_id: U_CAMILLE, response: 'maybe' as const },
    ]
    // Delete existing then re-insert to avoid unique conflicts
    await admin.from('event_participants').delete().in('event_id', [EV_CAMUS_PAST, EV_HUGO_PAST, EV_ATELIER, EV_ETRANGER, EV_AG])
    await admin.from('event_participants').insert(participants)
    log.push('✓ Event participants created')

    // ── 11. Event budget items ────────────────────────────────────────────────
    await admin.from('event_budget_items').delete().in('event_id', [EV_CAMUS_PAST, EV_HUGO_PAST, EV_ATELIER, EV_ETRANGER, EV_AG])
    await admin.from('event_budget_items').insert([
      // Camus
      { id: id(), event_id: EV_CAMUS_PAST, type: 'expense', label: 'Collations',       planned_amount: 25, actual_amount: 22.50 },
      // Hugo
      { id: id(), event_id: EV_HUGO_PAST,  type: 'expense', label: 'Boissons & snacks', planned_amount: 40, actual_amount: 37.80 },
      { id: id(), event_id: EV_HUGO_PAST,  type: 'income',  label: 'Participation membres', planned_amount: 20, actual_amount: 20 },
      // Atelier
      { id: id(), event_id: EV_ATELIER, type: 'expense', label: 'Matériel d\'écriture', planned_amount: 30, actual_amount: 28 },
      { id: id(), event_id: EV_ATELIER, type: 'income',  label: 'Inscription',          planned_amount: 30, actual_amount: 30 },
      // L'Étranger (upcoming, planned only)
      { id: id(), event_id: EV_ETRANGER, type: 'expense', label: 'Location salle',   planned_amount: 0,  actual_amount: 0 },
      { id: id(), event_id: EV_ETRANGER, type: 'expense', label: 'Collations',       planned_amount: 35, actual_amount: 0 },
      // AG
      { id: id(), event_id: EV_AG, type: 'expense', label: 'Impression documents', planned_amount: 15,  actual_amount: 0 },
      { id: id(), event_id: EV_AG, type: 'expense', label: 'Buffet de clôture',     planned_amount: 120, actual_amount: 0 },
      { id: id(), event_id: EV_AG, type: 'income',  label: 'Subvention événement', planned_amount: 80,  actual_amount: 0 },
    ])
    log.push('✓ Event budget items created')

    // ── 12. Event tasks ───────────────────────────────────────────────────────
    await admin.from('event_tasks').delete().in('event_id', [EV_ETRANGER, EV_AG])
    await admin.from('event_tasks').insert([
      // L'Étranger
      { id: id(), event_id: EV_ETRANGER, title: "Commander les livres (8 ex.)", assigned_to: U_CHLOE,  due_date: '2026-05-10', done: true,  position: 0 },
      { id: id(), event_id: EV_ETRANGER, title: "Préparer les questions de discussion", assigned_to: U_LEA, due_date: '2026-05-20', done: true, position: 1 },
      { id: id(), event_id: EV_ETRANGER, title: "Envoyer les rappels aux membres", assigned_to: U_MAXIME, due_date: '2026-05-20', done: false, position: 2 },
      { id: id(), event_id: EV_ETRANGER, title: "Préparer les collations",         assigned_to: U_INES,   due_date: '2026-05-22', done: false, position: 3 },
      // AG
      { id: id(), event_id: EV_AG, title: "Rédiger le rapport annuel",          assigned_to: U_LEA,    due_date: '2026-06-01', done: false, position: 0 },
      { id: id(), event_id: EV_AG, title: "Préparer le rapport financier",       assigned_to: U_CHLOE,  due_date: '2026-06-05', done: false, position: 1 },
      { id: id(), event_id: EV_AG, title: "Convoquer les membres (e-mail)",      assigned_to: U_MAXIME, due_date: '2026-05-25', done: true,  position: 2 },
      { id: id(), event_id: EV_AG, title: "Réserver l'amphithéâtre A1",         assigned_to: U_MAXIME, due_date: '2026-05-15', done: true,  position: 3 },
      { id: id(), event_id: EV_AG, title: "Imprimer les bulletins de vote",      assigned_to: U_LEA,    due_date: '2026-06-14', done: false, position: 4 },
    ])
    log.push('✓ Event tasks created')

    // ── 13. Finance categories ────────────────────────────────────────────────
    await admin.from('finance_categories').upsert([
      { id: FC_COTIS,      association_id: AEC_ID, name: 'Cotisations',  color: '#10b981', position: 0 },
      { id: FC_ACHATS,     association_id: AEC_ID, name: 'Achats',       color: '#ef4444', position: 1 },
      { id: FC_SUBVENTION, association_id: AEC_ID, name: 'Subventions',  color: '#3b82f6', position: 2 },
      { id: FC_EVENEMENTS, association_id: AEC_ID, name: 'Événements',   color: '#f59e0b', position: 3 },
    ], { onConflict: 'id' })
    log.push('✓ Finance categories created')

    // ── 14. Finance transactions ──────────────────────────────────────────────
    const FINANCES = [
      // Revenus
      { type: 'income' as const, amount: 300, label: 'Subvention universitaire 2025-2026', date: '2025-09-15', category_id: FC_SUBVENTION },
      { type: 'income' as const, amount: 210, label: 'Cotisations membres 2025-2026 (7 × 30 CHF)', date: '2025-09-30', category_id: FC_COTIS },
      { type: 'income' as const, amount: 50,  label: 'Dons et soutiens divers',            date: '2025-11-10', category_id: FC_COTIS },
      { type: 'income' as const, amount: 30,  label: 'Vente bouquins déstockage',           date: '2025-12-05', category_id: FC_EVENEMENTS },
      // Dépenses
      { type: 'expense' as const, amount: 120, label: 'Location salle semestre automne',    date: '2025-09-10', category_id: FC_EVENEMENTS },
      { type: 'expense' as const, amount: 72,  label: "Achat livres : Le Mythe de Sisyphe (8 ex.)", date: '2025-12-20', category_id: FC_ACHATS },
      { type: 'expense' as const, amount: 22.50, label: 'Collations soirée Camus',           date: '2026-01-15', category_id: FC_EVENEMENTS },
      { type: 'expense' as const, amount: 48,  label: 'Achat livres : Les Misérables (6 ex.)', date: '2026-01-28', category_id: FC_ACHATS },
      { type: 'expense' as const, amount: 17.80, label: 'Boissons soirée Hugo (complément)', date: '2026-02-20', category_id: FC_EVENEMENTS },
      { type: 'expense' as const, amount: 28,  label: "Matériel atelier d'écriture",         date: '2026-03-08', category_id: FC_ACHATS },
      { type: 'expense' as const, amount: 64,  label: "Achat livres : L'Étranger (8 ex.)",   date: '2026-04-30', category_id: FC_ACHATS },
      { type: 'expense' as const, amount: 18,  label: 'Impression flyers printemps 2026',    date: '2026-04-15', category_id: FC_EVENEMENTS },
    ]
    // Check if finances already exist
    const { count: financeCount } = await admin
      .from('finances')
      .select('id', { count: 'exact', head: true })
      .eq('association_id', AEC_ID)
    if ((financeCount ?? 0) === 0) {
      await admin.from('finances').insert(
        FINANCES.map(f => ({ ...f, association_id: AEC_ID, created_by: U_LEA }))
      )
    }
    log.push('✓ Finance transactions created')

    // ── 15. Event budgets (dossiers) ──────────────────────────────────────────
    const EB1 = 'aaaaaaaa-0000-0000-0009-000000000001'
    const EB2 = 'aaaaaaaa-0000-0000-0009-000000000002'
    await admin.from('event_budgets').upsert([
      { id: EB1, association_id: AEC_ID, created_by: U_CHLOE, name: 'Budget annuel 2025-2026',  description: 'Budget consolidé de l\'association pour l\'année académique 2025-2026.', status: 'active', event_date: null },
      { id: EB2, association_id: AEC_ID, created_by: U_CHLOE, name: 'Budget AG 2026',           description: "Budget prévisionnel pour l'Assemblée Générale annuelle.",               status: 'planned', event_date: '2026-06-15' },
    ], { onConflict: 'id' })
    await admin.from('event_budget_lines').delete().eq('budget_id', EB1)
    await admin.from('event_budget_lines').delete().eq('budget_id', EB2)
    await admin.from('event_budget_lines').insert([
      { id: id(), budget_id: EB1, type: 'income',  label: 'Subvention universitaire',     planned_amount: 300, actual_amount: 300 },
      { id: id(), budget_id: EB1, type: 'income',  label: 'Cotisations membres',           planned_amount: 210, actual_amount: 210 },
      { id: id(), budget_id: EB1, type: 'income',  label: 'Dons et soutiens',             planned_amount: 50,  actual_amount: 50  },
      { id: id(), budget_id: EB1, type: 'expense', label: 'Location salles',              planned_amount: 120, actual_amount: 120 },
      { id: id(), budget_id: EB1, type: 'expense', label: 'Achats de livres',             planned_amount: 220, actual_amount: 212 },
      { id: id(), budget_id: EB1, type: 'expense', label: 'Collations & événements',      planned_amount: 120, actual_amount: 68.30 },
      { id: id(), budget_id: EB1, type: 'expense', label: 'Communication & impression',   planned_amount: 30,  actual_amount: 18  },
      // AG budget
      { id: id(), budget_id: EB2, type: 'income',  label: 'Subvention événement',         planned_amount: 80,  actual_amount: 0 },
      { id: id(), budget_id: EB2, type: 'expense', label: 'Impression documents & votes', planned_amount: 15,  actual_amount: 0 },
      { id: id(), budget_id: EB2, type: 'expense', label: 'Buffet de clôture',            planned_amount: 120, actual_amount: 0 },
    ])
    log.push('✓ Event budgets (dossiers) created')

    // ── 16. Document folders ──────────────────────────────────────────────────
    await admin.from('document_folders').upsert([
      { id: DF_ADMIN,      association_id: AEC_ID, name: 'Administratif',   color: '#3b82f6', position: 0 },
      { id: DF_CR,         association_id: AEC_ID, name: 'Comptes-rendus',  color: '#10b981', position: 1 },
      { id: DF_RESSOURCES, association_id: AEC_ID, name: 'Ressources',      color: '#7c3aed', position: 2 },
    ], { onConflict: 'id' })
    log.push('✓ Document folders created')

    // ── 17. Documents (metadata only, no actual files) ────────────────────────
    const DOCS = [
      { name: 'Statuts de l\'AEC.pdf',           folder: 'Administratif',  folder_id: DF_ADMIN,      mime_type: 'application/pdf', file_size: 145320 },
      { name: 'Règlement intérieur.pdf',          folder: 'Administratif',  folder_id: DF_ADMIN,      mime_type: 'application/pdf', file_size: 87440 },
      { name: 'Charte des membres.pdf',           folder: 'Administratif',  folder_id: DF_ADMIN,      mime_type: 'application/pdf', file_size: 62100 },
      { name: 'PV Assemblée Générale 2025.pdf',   folder: 'Comptes-rendus', folder_id: DF_CR,         mime_type: 'application/pdf', file_size: 214500 },
      { name: 'CR Réunion - Janvier 2026.pdf',    folder: 'Comptes-rendus', folder_id: DF_CR,         mime_type: 'application/pdf', file_size: 78900 },
      { name: 'CR Réunion - Février 2026.pdf',    folder: 'Comptes-rendus', folder_id: DF_CR,         mime_type: 'application/pdf', file_size: 92300 },
      { name: 'CR Réunion - Mars 2026.pdf',       folder: 'Comptes-rendus', folder_id: DF_CR,         mime_type: 'application/pdf', file_size: 68700 },
      { name: 'Liste livres lus 2024-2025.pdf',   folder: 'Ressources',     folder_id: DF_RESSOURCES, mime_type: 'application/pdf', file_size: 34200 },
      { name: 'Guide animation club lecture.pdf', folder: 'Ressources',     folder_id: DF_RESSOURCES, mime_type: 'application/pdf', file_size: 156800 },
      { name: 'Planning séances mai-juin 2026.pdf', folder: 'Ressources',   folder_id: DF_RESSOURCES, mime_type: 'application/pdf', file_size: 41600 },
    ]
    const { count: docCount } = await admin
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('association_id', AEC_ID)
    if ((docCount ?? 0) === 0) {
      await admin.from('documents').insert(
        DOCS.map((d, i) => ({
          id: id(),
          association_id: AEC_ID,
          uploaded_by: i < 3 ? U_MAXIME : i < 7 ? U_MAXIME : U_LEA,
          name: d.name,
          file_path: `demo/${AEC_ID}/${d.name.replace(/\s/g, '_').replace(/'/g, '')}`,
          file_size: d.file_size,
          mime_type: d.mime_type,
          folder: d.folder,
          folder_id: d.folder_id,
        }))
      )
    }
    log.push('✓ Documents created')

    // ── 18. Note folders ──────────────────────────────────────────────────────
    await admin.from('note_folders').upsert([
      { id: NF_IDEES,      association_id: AEC_ID, created_by: U_LEA,    name: 'Idées & sélection',  color: '#7c3aed', position: 0 },
      { id: NF_RESSOURCES, association_id: AEC_ID, created_by: U_MAXIME, name: 'Organisation',       color: '#0ea5e9', position: 1 },
    ], { onConflict: 'id' })
    log.push('✓ Note folders created')

    // ── 19. Notes ─────────────────────────────────────────────────────────────
    const { count: noteCount } = await admin
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('association_id', AEC_ID)
    if ((noteCount ?? 0) === 0) {
      await admin.from('notes').insert([
        {
          id: id(),
          association_id: AEC_ID,
          folder_id: NF_IDEES,
          created_by: U_LEA,
          title: 'Sélection livres 2025-2026',
          content: `# Sélection livres 2025-2026\n\n## Lus cette année\n- **Le Mythe de Sisyphe** — Albert Camus ✅\n- **Les Misérables** — Victor Hugo ✅\n- **L'Étranger** — Albert Camus (en cours)\n\n## Proposés pour le prochain semestre\n1. Fahrenheit 451 — Ray Bradbury 🔥\n2. 1984 — George Orwell\n3. Le Seigneur des Anneaux — J.R.R. Tolkien\n4. La Métamorphose — Franz Kafka\n5. L'Alchimiste — Paulo Coelho\n\n## Critères de sélection\n- Accessibilité (pas trop long pour les non-lecteurs)\n- Richesse pour la discussion\n- Diversité des genres et des époques`,
        },
        {
          id: id(),
          association_id: AEC_ID,
          folder_id: NF_IDEES,
          created_by: U_ANTOINE,
          title: 'Idées de thématiques pour les séances',
          content: `# Idées de thématiques\n\n## Pour les prochaines séances\n- **L'absurde dans la littérature** : Camus, Kafka, Beckett\n- **Utopies et dystopies** : Orwell, Huxley, Bradbury\n- **Le voyage initiatique** : classique dans beaucoup de romans\n- **Les femmes dans la littérature** : Beauvoir, Duras, Ernaux\n\n## Format innovant\n- Soirée "première ligne" : chaque membre apporte son livre préféré et lit la première ligne\n- Blind date avec un livre : chaque membre reçoit un livre emballé, sans titre visible\n- Débat : adaptation film vs livre original`,
        },
        {
          id: id(),
          association_id: AEC_ID,
          folder_id: NF_RESSOURCES,
          created_by: U_MAXIME,
          title: 'Planning AG 2026 — ordre du jour',
          content: `# Assemblée Générale 2026\n**Date :** 15 juin 2026, 17h00–19h00\n**Lieu :** Amphithéâtre A1\n\n## Ordre du jour\n1. **Ouverture de séance** — Léa Rousseau (10 min)\n2. **Rapport moral** — bilan de l'année, activités réalisées (15 min)\n3. **Rapport financier** — état des comptes, budget prévisionnel (15 min)\n4. **Questions des membres** (15 min)\n5. **Élection du nouveau bureau** (20 min)\n   - Présidente / Président\n   - Secrétaire\n   - Trésorier·ère\n6. **Projets 2026-2027** — présentation et vote (15 min)\n7. **Clôture & buffet** (30 min)\n\n## Candidatures au bureau\n- Léa Rousseau : se représente à la présidence\n- À confirmer pour secrétaire et trésorier·ère`,
        },
        {
          id: id(),
          association_id: AEC_ID,
          folder_id: NF_RESSOURCES,
          created_by: U_CHLOE,
          title: 'Budget prévisionnel 2026-2027',
          content: `# Budget prévisionnel 2026-2027\n\n## Hypothèses\n- 10 membres actifs (objectif de croissance)\n- 8 séances de lecture\n- 1 événement spécial (soirée inter-asso)\n- 1 AG\n\n## Recettes estimées\n| Poste | Montant |\n|---|---|\n| Cotisations (10 × 30 CHF) | 300 CHF |\n| Subvention universitaire | 350 CHF |\n| Inscriptions événements | 80 CHF |\n| **Total recettes** | **730 CHF** |\n\n## Dépenses estimées\n| Poste | Montant |\n|---|---|\n| Achats de livres | 280 CHF |\n| Location salles | 150 CHF |\n| Collations & événements | 160 CHF |\n| Communication | 40 CHF |\n| **Total dépenses** | **630 CHF** |\n\n**Excédent prévisionnel : +100 CHF**`,
        },
      ])
    }
    log.push('✓ Notes created')

    // ── 20. Conversations & messages ──────────────────────────────────────────
    const { count: convCount } = await admin
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('association_id', AEC_ID)

    if ((convCount ?? 0) === 0) {
      await admin.from('conversations').insert([
        {
          id: CONV_LIVRE,
          association_id: AEC_ID,
          title: "Choix du livre pour juin",
          created_by: U_LEA,
          created_at: '2026-04-28T10:00:00Z',
          updated_at: '2026-05-03T16:45:00Z',
        },
        {
          id: CONV_AG,
          association_id: AEC_ID,
          title: "Organisation AG 2026",
          created_by: U_LEA,
          created_at: '2026-05-01T09:00:00Z',
          updated_at: '2026-05-10T11:20:00Z',
        },
      ])

      await admin.from('conversation_participants').insert([
        { conversation_id: CONV_LIVRE, user_id: U_LEA },
        { conversation_id: CONV_LIVRE, user_id: U_MAXIME },
        { conversation_id: CONV_LIVRE, user_id: U_CHLOE },
        { conversation_id: CONV_LIVRE, user_id: U_ANTOINE },
        { conversation_id: CONV_LIVRE, user_id: U_INES },
        { conversation_id: CONV_AG, user_id: U_LEA },
        { conversation_id: CONV_AG, user_id: U_MAXIME },
        { conversation_id: CONV_AG, user_id: U_CHLOE },
        { conversation_id: CONV_AG, user_id: U_THOMAS },
      ])

      await admin.from('messages').insert([
        // Choix du livre
        { id: id(), conversation_id: CONV_LIVRE, sender_id: U_LEA,     content: "Bonjour à tous ! On doit choisir notre livre pour juin. J'hésite entre Fahrenheit 451 de Bradbury et 1984 d'Orwell. Vous avez une préférence ? 🤔",   created_at: '2026-04-28T10:15:00Z' },
        { id: id(), conversation_id: CONV_LIVRE, sender_id: U_ANTOINE,  content: "Je vote pour Fahrenheit 451 ! Plus court et très actuel avec les questions de censure sur les réseaux. On aurait plein de choses à dire.",             created_at: '2026-04-28T11:02:00Z' },
        { id: id(), conversation_id: CONV_LIVRE, sender_id: U_CHLOE,    content: "1984 pour moi. Un classique incontournable et le parallèle avec aujourd'hui est saisissant. Mais Bradbury c'est bien aussi...",                         created_at: '2026-04-28T11:45:00Z' },
        { id: id(), conversation_id: CONV_LIVRE, sender_id: U_MAXIME,   content: "Fahrenheit 451 ! Et si on invitait quelqu'un de la fac de lettres pour animer la discussion ? On avait parlé de ça l'année dernière.",                  created_at: '2026-04-29T09:30:00Z' },
        { id: id(), conversation_id: CONV_LIVRE, sender_id: U_INES,     content: "Bonne idée Maxime ! Je peux contacter le prof Moreau, il fait des cours sur la SF. Pour le livre je suis pour Fahrenheit 451 🙋",                        created_at: '2026-04-29T10:15:00Z' },
        { id: id(), conversation_id: CONV_LIVRE, sender_id: U_LEA,      content: "Super ! On vote donc pour Fahrenheit 451. Inès, tu peux te charger du contact avec le prof Moreau ? Et Chloé peut commander les livres quand c'est acté.", created_at: '2026-04-30T14:00:00Z' },
        { id: id(), conversation_id: CONV_LIVRE, sender_id: U_CHLOE,    content: "Pas de problème ! Je vais chercher le meilleur prix. Vous avez besoin de combien d'exemplaires ? 8 comme d'habitude ?",                                 created_at: '2026-05-01T08:45:00Z' },
        { id: id(), conversation_id: CONV_LIVRE, sender_id: U_LEA,      content: "Oui, 8 exemplaires. Merci Chloé ! Inès tu as des nouvelles du prof Moreau ?",                                                                            created_at: '2026-05-03T16:45:00Z' },
        // Organisation AG
        { id: id(), conversation_id: CONV_AG, sender_id: U_LEA,    content: "L'AG approche ! Maxime tu as reservé l'amphi A1 ? Et Chloé, le rapport financier sera prêt pour quand ?",                                                     created_at: '2026-05-01T09:15:00Z' },
        { id: id(), conversation_id: CONV_AG, sender_id: U_MAXIME, content: "Réservé ! Amphi A1, 15 juin 17h-19h. J'ai aussi envoyé les convocations par mail à tous les membres ce matin.",                                               created_at: '2026-05-01T10:30:00Z' },
        { id: id(), conversation_id: CONV_AG, sender_id: U_CHLOE,  content: "Le rapport sera prêt pour le 10 juin. Je prépare aussi le budget prévisionnel pour 2026-2027. On fait un buffet après l'AG ?",                                created_at: '2026-05-01T11:00:00Z' },
        { id: id(), conversation_id: CONV_AG, sender_id: U_THOMAS, content: "Je peux aider pour le buffet ! Ma coloc a un grand appartement, on pourrait y faire l'after si vous voulez quelque chose de plus sympa qu'un buffet de salle.", created_at: '2026-05-02T14:20:00Z' },
        { id: id(), conversation_id: CONV_AG, sender_id: U_LEA,    content: "Super idée Thomas ! On fait l'AG à l'amphi et l'after chez toi. Maxime peux-tu ajouter ça dans la convocation ? Et n'oublie pas les bulletins de vote.",       created_at: '2026-05-03T09:00:00Z' },
        { id: id(), conversation_id: CONV_AG, sender_id: U_MAXIME, content: "Je mets à jour le mail. Pour les candidatures au bureau, on a Léa pour la présidence. Qui se présente pour secrétaire et trésorier·ère cette année ?",         created_at: '2026-05-10T11:20:00Z' },
      ])
    }
    log.push('✓ Conversations & messages created')

    // ── Done ──────────────────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      associationId: AEC_ID,
      log,
      message: "L'AEC a été créée avec succès ! Rendez-vous sur votre dashboard pour la sélectionner.",
    })

  } catch (err) {
    console.error('[seed-demo] error:', err)
    return NextResponse.json(
      { success: false, error: String(err), log },
      { status: 500 }
    )
  }
}
