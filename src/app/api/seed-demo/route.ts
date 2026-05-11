/**
 * POST /api/seed-demo
 *
 * Seeds the "Association des Esprits Curieux (AEC)" demo association.
 * Idempotent — safe to run multiple times.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Fixed demo UUIDs ──────────────────────────────────────────────────────────

const AEC_ID        = 'aaaaaaaa-0000-0000-0000-000000000001'
const U_LEA         = 'aaaaaaaa-0000-0000-0001-000000000001'
const U_MAXIME      = 'aaaaaaaa-0000-0000-0001-000000000002'
const U_CHLOE       = 'aaaaaaaa-0000-0000-0001-000000000003'
const U_ANTOINE     = 'aaaaaaaa-0000-0000-0001-000000000004'
const U_INES        = 'aaaaaaaa-0000-0000-0001-000000000005'
const U_THOMAS      = 'aaaaaaaa-0000-0000-0001-000000000006'
const U_CAMILLE     = 'aaaaaaaa-0000-0000-0001-000000000007'
const M_LEA         = 'aaaaaaaa-0000-0000-0002-000000000001'
const M_MAXIME      = 'aaaaaaaa-0000-0000-0002-000000000002'
const M_CHLOE       = 'aaaaaaaa-0000-0000-0002-000000000003'
const M_ANTOINE     = 'aaaaaaaa-0000-0000-0002-000000000004'
const M_INES        = 'aaaaaaaa-0000-0000-0002-000000000005'
const M_THOMAS      = 'aaaaaaaa-0000-0000-0002-000000000006'
const M_CAMILLE     = 'aaaaaaaa-0000-0000-0002-000000000007'
const EV_CAMUS_PAST = 'aaaaaaaa-0000-0000-0003-000000000001'
const EV_HUGO_PAST  = 'aaaaaaaa-0000-0000-0003-000000000002'
const EV_ATELIER    = 'aaaaaaaa-0000-0000-0003-000000000003'
const EV_ETRANGER   = 'aaaaaaaa-0000-0000-0003-000000000004'
const EV_AG         = 'aaaaaaaa-0000-0000-0003-000000000005'
const FC_COTIS      = 'aaaaaaaa-0000-0000-0004-000000000001'
const FC_ACHATS     = 'aaaaaaaa-0000-0000-0004-000000000002'
const FC_SUBVENTION = 'aaaaaaaa-0000-0000-0004-000000000003'
const FC_EVENEMENTS = 'aaaaaaaa-0000-0000-0004-000000000004'
const DF_ADMIN      = 'aaaaaaaa-0000-0000-0005-000000000001'
const DF_CR         = 'aaaaaaaa-0000-0000-0005-000000000002'
const DF_RESSOURCES = 'aaaaaaaa-0000-0000-0005-000000000003'
const NF_IDEES      = 'aaaaaaaa-0000-0000-0006-000000000001'
const NF_RESSOURCES = 'aaaaaaaa-0000-0000-0006-000000000002'
const CONV_LIVRE    = 'aaaaaaaa-0000-0000-0007-000000000001'
const CONV_AG       = 'aaaaaaaa-0000-0000-0007-000000000002'
const TG_LECTURE    = 'aaaaaaaa-0000-0000-0008-000000000001'
const TG_ADMIN      = 'aaaaaaaa-0000-0000-0008-000000000002'

// ── Core demo users (bureau + active members) ─────────────────────────────────

const DEMO_USERS = [
  { id: U_LEA,     email: 'lea.rousseau@aec-demo.ch',   full_name: 'Léa Rousseau',   role: 'president' as const, membershipId: M_LEA },
  { id: U_MAXIME,  email: 'maxime.bernard@aec-demo.ch', full_name: 'Maxime Bernard',  role: 'secretary' as const, membershipId: M_MAXIME },
  { id: U_CHLOE,   email: 'chloe.martin@aec-demo.ch',   full_name: 'Chloé Martin',    role: 'treasurer' as const, membershipId: M_CHLOE },
  { id: U_ANTOINE, email: 'antoine.dupont@aec-demo.ch', full_name: 'Antoine Dupont',  role: 'member' as const,    membershipId: M_ANTOINE },
  { id: U_INES,    email: 'ines.lefevre@aec-demo.ch',   full_name: 'Inès Lefèvre',    role: 'member' as const,    membershipId: M_INES },
  { id: U_THOMAS,  email: 'thomas.petit@aec-demo.ch',   full_name: 'Thomas Petit',    role: 'member' as const,    membershipId: M_THOMAS },
  { id: U_CAMILLE, email: 'camille.durand@aec-demo.ch', full_name: 'Camille Durand',  role: 'member' as const,    membershipId: M_CAMILLE },
]

// ── 250 bulk members — deterministic UUIDs ────────────────────────────────────

const PRENOMS_F = ['Alice','Ambre','Anaïs','Axelle','Bérénice','Camille','Charlotte','Clara','Clémence','Déborah','Elena','Elisa','Elise','Emma','Eva','Fanny','Flora','Gaëlle','Héloïse','Jade','Juliette','Laura','Laurie','Lena','Léonie','Lola','Louise','Luna','Lucie','Maëlys','Manon','Marine','Marion','Mathilde','Mélanie','Mia','Mila','Nadia','Naomi','Noemie','Océane','Olivia','Ophelie','Pauline','Roxane','Salomé','Sara','Sofia','Victoire','Zoé']
const PRENOMS_M = ['Adam','Adrien','Alexandre','Alexis','Arthur','Axel','Baptiste','Benjamin','Clément','Corentin','Damien','Dylan','Edouard','Emilien','Ethan','Evan','Félix','Florian','Gabriel','Guillaume','Hugo','Julien','Kilian','Liam','Louis','Lucas','Mathieu','Maxence','Mohammed','Nathan','Nicolas','Noah','Noe','Pierre','Quentin','Raphael','Romain','Samuel','Simon','Sylvain','Thomas','Théo','Tibo','Timothée','Tom','Tristan','Victor','Yanis','Yoan','Yves']
const NOMS = ['Arnaud','Aubert','Barbier','Blanc','Bonnet','Bouchard','Boulanger','Bourgeois','Boyer','Brunet','Carpentier','Chevalier','Colas','Colin','Collin','David','Denis','Dubois','Dufour','Dumont','Dupont','Dupuis','Durand','Faure','Fontaine','Fournier','Franck','Garnier','Gauthier','Gerard','Girard','Giraud','Gomez','Guerin','Guillaume','Henry','Humbert','Jacob','Lambert','Laurent','Leclerc','Lecomte','Lefebvre','Legrand','Lemaire','Leroy','Lucas','Marchal','Marchand','Masson','Mathieu','Michel','Morel','Moreau','Morin','Moulin','Muller','Noel','Paris','Perrier','Petit','Picard','Renard','Renaud','Richard','Robert','Robin','Roche','Roger','Rousseau','Roussel','Roy','Simon','Tessier','Thomas','Vidal','Vincent','Voisin']

function bulkUserId(i: number): string {
  const hi = String(Math.floor(i / 10000)).padStart(4, '0')
  const lo = String(i % 10000).padStart(4, '0')
  return `bbbbbbbb-0000-0000-${hi}-0000${lo}0000`
}

function generateBulkMembers(count: number) {
  const members = []
  for (let i = 0; i < count; i++) {
    const isFemale = i % 2 === 0
    const prenomList = isFemale ? PRENOMS_F : PRENOMS_M
    const prenom = prenomList[i % prenomList.length]
    const nom = NOMS[(i * 3 + (isFemale ? 7 : 13)) % NOMS.length]
    const fullName = `${prenom} ${nom}`
    const email = `${prenom.toLowerCase().replace(/[éèêë]/g,'e').replace(/[àâä]/g,'a').replace(/[îï]/g,'i').replace(/[ôö]/g,'o').replace(/[ûü]/g,'u').replace(/[ç]/g,'c')}.${nom.toLowerCase().replace(/[éèêë]/g,'e').replace(/[àâä]/g,'a').replace(/[îï]/g,'i').replace(/[ôö]/g,'o').replace(/[ûü]/g,'u').replace(/[ç]/g,'c')}${i + 10}@aec-demo.ch`
    const userId = bulkUserId(i)
    const joinedDaysAgo = 600 - i * 2
    const joinedAt = new Date(Date.now() - joinedDaysAgo * 86400000).toISOString()
    members.push({ index: i, userId, email, fullName, joinedAt })
  }
  return members
}

const BULK_MEMBERS = generateBulkMembers(250)

// ── Helpers ───────────────────────────────────────────────────────────────────

function rid() { return crypto.randomUUID() }

/** Log a DB result — returns true if OK, pushes error to log if not. */
function chk(
  label: string,
  result: { error: { message: string } | null },
  log: string[],
): boolean {
  if (result.error) {
    log.push(`  ✗ ${label}: ${result.error.message}`)
    return false
  }
  return true
}

async function ensureAuthUser(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  email: string,
  fullName: string,
) {
  // Check by deterministic UUID — not by profile (profile may not exist yet)
  const { data: existing } = await admin.auth.admin.getUserById(userId)
  if (existing?.user) return

  const { error } = await admin.auth.admin.createUser({
    id: userId,           // ← deterministic UUID, so FK constraints work
    email,
    password: 'AEC-Demo-2026!',
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (error && !error.message.toLowerCase().includes('already')) throw error
}

async function ensureBulkAuthUsers(
  admin: ReturnType<typeof createAdminClient>,
  members: typeof BULK_MEMBERS,
) {
  // Cheaper check: count profiles with our prefix
  const { count } = await admin
    .from('user_profiles')
    .select('id', { count: 'exact', head: true })
    .like('id', 'bbbbbbbb-%')
  if ((count ?? 0) >= members.length) return // already seeded

  // Create in parallel batches of 20
  const BATCH = 20
  for (let i = 0; i < members.length; i += BATCH) {
    const batch = members.slice(i, i + BATCH)
    await Promise.allSettled(
      batch.map(m => ensureAuthUser(admin, m.userId, m.email, m.fullName))
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const callerUserId = req.headers.get('x-user-id')
  if (!callerUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const log: string[] = []

  try {
    // ── 1. Core auth users ────────────────────────────────────────────────────
    for (const u of DEMO_USERS) {
      await ensureAuthUser(admin, u.id, u.email, u.full_name)
    }
    log.push('✓ Core demo users ensured (7)')

    // ── 2. Bulk auth users (250) ──────────────────────────────────────────────
    await ensureBulkAuthUsers(admin, BULK_MEMBERS)
    log.push('✓ Bulk users ensured (250)')

    // ── 3. User profiles ──────────────────────────────────────────────────────
    const profilesRes = await admin.from('user_profiles').upsert(
      DEMO_USERS.map(u => ({ id: u.id, email: u.email, full_name: u.full_name })),
      { onConflict: 'id' }
    )
    chk('core profiles', profilesRes, log)

    // Bulk profiles — insert in chunks of 100 to avoid payload limits
    const bulkProfiles = BULK_MEMBERS.map(m => ({
      id: m.userId,
      email: m.email,
      full_name: m.fullName,
    }))
    let bulkProfileErrors = 0
    for (let i = 0; i < bulkProfiles.length; i += 100) {
      const r = await admin.from('user_profiles').upsert(bulkProfiles.slice(i, i + 100), { onConflict: 'id' })
      if (r.error) bulkProfileErrors++
    }
    log.push(bulkProfileErrors === 0 ? '✓ User profiles upserted (257 total)' : `⚠ User profiles: ${bulkProfileErrors} batch(es) failed`)

    // ── 4. Association ────────────────────────────────────────────────────────
    const assocRes = await admin.from('associations').upsert({
      id: AEC_ID,
      name: "Association des Esprits Curieux",
      description: "Un club de lecture étudiant ouvert à toutes et tous, sans condition de faculté ni de niveau. Ses membres se retrouvent régulièrement pour discuter d'œuvres choisies ensemble — romans, essais, philosophie ou histoire. L'ambiance se veut conviviale et sans prétention : seule la curiosité est requise.",
      accent_color: '#7c3aed',
      slug: 'aec',
      is_public: true,
    }, { onConflict: 'id' })
    if (!chk('association', assocRes, log)) throw new Error('Association upsert failed — stopping')
    log.push('✓ Association created')

    // ── 5. Core memberships ───────────────────────────────────────────────────
    const membRes = await admin.from('association_memberships').upsert(
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
    chk('core memberships', membRes, log)

    // ── 6. Bulk memberships ───────────────────────────────────────────────────
    const { count: bulkMemberCount } = await admin
      .from('association_memberships')
      .select('id', { count: 'exact', head: true })
      .eq('association_id', AEC_ID)
      .like('user_id', 'bbbbbbbb-%')

    if ((bulkMemberCount ?? 0) < BULK_MEMBERS.length) {
      const bulkMemberships = BULK_MEMBERS.map(m => ({
        association_id: AEC_ID,
        user_id: m.userId,
        role: 'member' as const,
        is_active: true,
        joined_at: m.joinedAt,
      }))
      for (let i = 0; i < bulkMemberships.length; i += 100) {
        await admin.from('association_memberships').upsert(
          bulkMemberships.slice(i, i + 100),
          { onConflict: 'association_id,user_id' }
        )
      }
    }
    log.push('✓ Memberships created (257 total)')

    // ── 7. Caller as member ───────────────────────────────────────────────────
    const { data: callerMembership } = await admin
      .from('association_memberships').select('id')
      .eq('association_id', AEC_ID).eq('user_id', callerUserId).single()
    if (!callerMembership) {
      await admin.from('association_memberships').insert({
        association_id: AEC_ID, user_id: callerUserId, role: 'president', is_active: true,
      })
    }
    log.push('✓ Caller added to AEC')

    // ── 8. Association titles ─────────────────────────────────────────────────
    const { count: titleCount } = await admin
      .from('association_titles').select('id', { count: 'exact', head: true })
      .eq('association_id', AEC_ID)
    if ((titleCount ?? 0) === 0) {
      await admin.from('association_titles').insert([
        { association_id: AEC_ID, name: 'Fondateur·ice',        color: '#7c3aed', position: 0 },
        { association_id: AEC_ID, name: 'Responsable comm.',    color: '#0ea5e9', position: 1 },
        { association_id: AEC_ID, name: 'Bibliothécaire',       color: '#10b981', position: 2 },
      ])
    }
    log.push('✓ Titles created')

    // ── 9. Task groups ────────────────────────────────────────────────────────
    const tgRes = await admin.from('task_groups').upsert([
      { id: TG_LECTURE, association_id: AEC_ID, name: 'Séances de lecture', color: '#7c3aed', created_by: U_LEA },
      { id: TG_ADMIN,   association_id: AEC_ID, name: 'Administration',    color: '#0ea5e9', created_by: U_LEA },
    ], { onConflict: 'id' })
    chk('task groups', tgRes, log)
    log.push('✓ Task groups created')

    // ── 10. Tasks ─────────────────────────────────────────────────────────────
    const { count: taskCount } = await admin
      .from('tasks').select('id', { count: 'exact', head: true }).eq('association_id', AEC_ID)
    if ((taskCount ?? 0) === 0) {
      const tasksRes = await admin.from('tasks').insert([
        { association_id: AEC_ID, created_by: U_LEA, title: "Commander 8 ex. de 'Fahrenheit 451'",      priority: 'high',   status: 'todo',        assigned_to: U_CHLOE,   due_date: '2026-05-18', group_id: TG_LECTURE, is_personal: false, description: null },
        { association_id: AEC_ID, created_by: U_LEA, title: "Réserver la salle pour juin",              priority: 'high',   status: 'todo',        assigned_to: U_MAXIME,  due_date: '2026-05-20', group_id: TG_ADMIN,   is_personal: false, description: null },
        { association_id: AEC_ID, created_by: U_LEA, title: "Envoyer les convocations AG",              priority: 'high',   status: 'in_progress', assigned_to: U_MAXIME,  due_date: '2026-05-25', group_id: TG_ADMIN,   is_personal: false, description: null },
        { association_id: AEC_ID, created_by: U_LEA, title: "Préparer l'ordre du jour de l'AG",        priority: 'medium', status: 'in_progress', assigned_to: U_LEA,     due_date: '2026-06-10', group_id: TG_ADMIN,   is_personal: false, description: null },
        { association_id: AEC_ID, created_by: U_LEA, title: "Organiser le vote pour le livre de juillet", priority: 'medium', status: 'todo',     assigned_to: U_ANTOINE, due_date: '2026-05-30', group_id: TG_LECTURE, is_personal: false, description: null },
        { association_id: AEC_ID, created_by: U_LEA, title: "Mettre à jour la liste des membres",       priority: 'low',    status: 'todo',        assigned_to: U_MAXIME,  due_date: null,         group_id: TG_ADMIN,   is_personal: false, description: null },
        { association_id: AEC_ID, created_by: U_LEA, title: "Rédiger le CR de la soirée Misérables",   priority: 'medium', status: 'done',        assigned_to: U_MAXIME,  due_date: '2026-03-01', group_id: TG_LECTURE, is_personal: false, description: null },
        { association_id: AEC_ID, created_by: U_LEA, title: "Commander les livres pour L'Étranger",    priority: 'high',   status: 'done',        assigned_to: U_CHLOE,   due_date: '2026-05-10', group_id: TG_LECTURE, is_personal: false, description: null },
        { association_id: AEC_ID, created_by: U_LEA, title: "Préparer les questions de discussion",    priority: 'medium', status: 'done',        assigned_to: U_LEA,     due_date: '2026-05-15', group_id: TG_LECTURE, is_personal: false, description: null },
        { association_id: AEC_ID, created_by: U_LEA, title: "Poster l'annonce sur les réseaux",        priority: 'low',    status: 'done',        assigned_to: U_INES,    due_date: '2026-05-18', group_id: TG_LECTURE, is_personal: false, description: null },
      ])
      chk('tasks', tasksRes, log)
    }
    log.push('✓ Tasks created')

    // ── 11. Events ────────────────────────────────────────────────────────────
    const eventsRes = await admin.from('events').upsert([
      { id: EV_CAMUS_PAST, association_id: AEC_ID, created_by: U_LEA,    name: "Discussion : Le Mythe de Sisyphe",   description: "Séance de discussion autour de l'essai philosophique d'Albert Camus. Qu'est-ce que l'absurde ? Peut-on trouver un sens à l'existence malgré tout ?", event_date: '2026-01-15', start_time: '18:30:00', end_time: '20:30:00', location: 'Bibliothèque universitaire, salle 204', status: 'done',    max_participants: 20 },
      { id: EV_HUGO_PAST,  association_id: AEC_ID, created_by: U_LEA,    name: "Soirée littéraire : Les Misérables",  description: "Discussion du chef-d'œuvre de Victor Hugo. Jean Valjean, Cosette, Javert — retour sur les personnages inoubliables.", event_date: '2026-02-20', start_time: '19:00:00', end_time: '21:00:00', location: "Café des Étudiants, rue des Acacias 12",    status: 'done',    max_participants: 15 },
      { id: EV_ATELIER,    association_id: AEC_ID, created_by: U_MAXIME, name: "Atelier d'écriture créative",         description: "Atelier pratique pour explorer l'écriture courte : contraintes OuLiPo, micro-nouvelles et exercices de style.",           event_date: '2026-03-10', start_time: '17:00:00', end_time: '19:00:00', location: 'Salle B102, Bâtiment principal',           status: 'done',    max_participants: 12 },
      { id: EV_ETRANGER,   association_id: AEC_ID, created_by: U_LEA,    name: "Café littéraire : L'Étranger",        description: "Séance de discussion autour du roman d'Albert Camus. La notion d'absurde, l'indifférence de Meursault et la question de la culpabilité.",           event_date: '2026-05-22', start_time: '18:30:00', end_time: '20:30:00', location: 'Salle B204, Bâtiment principal',           status: 'planned', max_participants: 15 },
      { id: EV_AG,         association_id: AEC_ID, created_by: U_LEA,    name: "Assemblée Générale 2026",             description: "AG annuelle de l'AEC. Bilan de l'année, rapport financier, élection du bureau et planning 2026-2027.",                  event_date: '2026-06-15', start_time: '17:00:00', end_time: '19:00:00', location: "Amphithéâtre A1, Université",              status: 'planned', max_participants: null },
    ], { onConflict: 'id' })
    chk('events', eventsRes, log)
    log.push('✓ Events created')

    // ── 12. Event participants ────────────────────────────────────────────────
    await admin.from('event_participants').delete().in('event_id', [EV_CAMUS_PAST, EV_HUGO_PAST, EV_ATELIER, EV_ETRANGER, EV_AG])
    await admin.from('event_participants').insert([
      { id: rid(), event_id: EV_CAMUS_PAST, user_id: U_LEA,     response: 'going' },
      { id: rid(), event_id: EV_CAMUS_PAST, user_id: U_MAXIME,  response: 'going' },
      { id: rid(), event_id: EV_CAMUS_PAST, user_id: U_CHLOE,   response: 'going' },
      { id: rid(), event_id: EV_CAMUS_PAST, user_id: U_ANTOINE, response: 'going' },
      { id: rid(), event_id: EV_CAMUS_PAST, user_id: U_THOMAS,  response: 'going' },
      { id: rid(), event_id: EV_CAMUS_PAST, user_id: U_CAMILLE, response: 'declined' },
      { id: rid(), event_id: EV_HUGO_PAST,  user_id: U_LEA,     response: 'going' },
      { id: rid(), event_id: EV_HUGO_PAST,  user_id: U_MAXIME,  response: 'going' },
      { id: rid(), event_id: EV_HUGO_PAST,  user_id: U_ANTOINE, response: 'going' },
      { id: rid(), event_id: EV_HUGO_PAST,  user_id: U_INES,    response: 'going' },
      { id: rid(), event_id: EV_HUGO_PAST,  user_id: U_THOMAS,  response: 'maybe' },
      { id: rid(), event_id: EV_ATELIER,    user_id: U_LEA,     response: 'going' },
      { id: rid(), event_id: EV_ATELIER,    user_id: U_CHLOE,   response: 'going' },
      { id: rid(), event_id: EV_ATELIER,    user_id: U_ANTOINE, response: 'going' },
      { id: rid(), event_id: EV_ATELIER,    user_id: U_INES,    response: 'going' },
      { id: rid(), event_id: EV_ATELIER,    user_id: U_CAMILLE, response: 'going' },
      { id: rid(), event_id: EV_ETRANGER,   user_id: U_LEA,     response: 'going' },
      { id: rid(), event_id: EV_ETRANGER,   user_id: U_MAXIME,  response: 'going' },
      { id: rid(), event_id: EV_ETRANGER,   user_id: U_CHLOE,   response: 'going' },
      { id: rid(), event_id: EV_ETRANGER,   user_id: U_ANTOINE, response: 'going' },
      { id: rid(), event_id: EV_ETRANGER,   user_id: U_INES,    response: 'going' },
      { id: rid(), event_id: EV_ETRANGER,   user_id: U_THOMAS,  response: 'maybe' },
      { id: rid(), event_id: EV_ETRANGER,   user_id: U_CAMILLE, response: 'declined' },
      { id: rid(), event_id: EV_AG,         user_id: U_LEA,     response: 'going' },
      { id: rid(), event_id: EV_AG,         user_id: U_MAXIME,  response: 'going' },
      { id: rid(), event_id: EV_AG,         user_id: U_CHLOE,   response: 'going' },
      { id: rid(), event_id: EV_AG,         user_id: U_ANTOINE, response: 'going' },
      { id: rid(), event_id: EV_AG,         user_id: U_INES,    response: 'going' },
      { id: rid(), event_id: EV_AG,         user_id: U_THOMAS,  response: 'going' },
      { id: rid(), event_id: EV_AG,         user_id: U_CAMILLE, response: 'maybe' },
    ])
    log.push('✓ Event participants created')

    // ── 13. Event budget items ────────────────────────────────────────────────
    await admin.from('event_budget_items').delete().in('event_id', [EV_CAMUS_PAST, EV_HUGO_PAST, EV_ATELIER, EV_ETRANGER, EV_AG])
    await admin.from('event_budget_items').insert([
      { id: rid(), event_id: EV_CAMUS_PAST, type: 'expense', label: 'Collations',              planned_amount: 25,  actual_amount: 22.50 },
      { id: rid(), event_id: EV_HUGO_PAST,  type: 'expense', label: 'Boissons & snacks',        planned_amount: 40,  actual_amount: 37.80 },
      { id: rid(), event_id: EV_HUGO_PAST,  type: 'income',  label: 'Participation membres',    planned_amount: 20,  actual_amount: 20    },
      { id: rid(), event_id: EV_ATELIER,    type: 'expense', label: "Matériel d'écriture",      planned_amount: 30,  actual_amount: 28    },
      { id: rid(), event_id: EV_ATELIER,    type: 'income',  label: 'Inscriptions',             planned_amount: 30,  actual_amount: 30    },
      { id: rid(), event_id: EV_ETRANGER,   type: 'expense', label: 'Collations',               planned_amount: 35,  actual_amount: 0     },
      { id: rid(), event_id: EV_AG,         type: 'expense', label: 'Impression documents',     planned_amount: 15,  actual_amount: 0     },
      { id: rid(), event_id: EV_AG,         type: 'expense', label: 'Buffet de clôture',        planned_amount: 120, actual_amount: 0     },
      { id: rid(), event_id: EV_AG,         type: 'income',  label: 'Subvention événement',     planned_amount: 80,  actual_amount: 0     },
    ])
    log.push('✓ Event budget items created')

    // ── 14. Event tasks ───────────────────────────────────────────────────────
    await admin.from('event_tasks').delete().in('event_id', [EV_ETRANGER, EV_AG])
    await admin.from('event_tasks').insert([
      { id: rid(), event_id: EV_ETRANGER, title: "Commander les livres (8 ex.)",        assigned_to: U_CHLOE,  due_date: '2026-05-10', done: true,  position: 0 },
      { id: rid(), event_id: EV_ETRANGER, title: "Préparer les questions de discussion", assigned_to: U_LEA,    due_date: '2026-05-20', done: true,  position: 1 },
      { id: rid(), event_id: EV_ETRANGER, title: "Envoyer les rappels",                  assigned_to: U_MAXIME, due_date: '2026-05-20', done: false, position: 2 },
      { id: rid(), event_id: EV_ETRANGER, title: "Préparer les collations",              assigned_to: U_INES,   due_date: '2026-05-22', done: false, position: 3 },
      { id: rid(), event_id: EV_AG, title: "Rédiger le rapport annuel",         assigned_to: U_LEA,    due_date: '2026-06-01', done: false, position: 0 },
      { id: rid(), event_id: EV_AG, title: "Préparer le rapport financier",      assigned_to: U_CHLOE,  due_date: '2026-06-05', done: false, position: 1 },
      { id: rid(), event_id: EV_AG, title: "Convoquer les membres",              assigned_to: U_MAXIME, due_date: '2026-05-25', done: true,  position: 2 },
      { id: rid(), event_id: EV_AG, title: "Réserver l'amphithéâtre A1",        assigned_to: U_MAXIME, due_date: '2026-05-15', done: true,  position: 3 },
      { id: rid(), event_id: EV_AG, title: "Imprimer les bulletins de vote",     assigned_to: U_LEA,    due_date: '2026-06-14', done: false, position: 4 },
    ])
    log.push('✓ Event tasks created')

    // ── 15. Finance categories ────────────────────────────────────────────────
    const fcRes = await admin.from('finance_categories').upsert([
      { id: FC_COTIS,      association_id: AEC_ID, name: 'Cotisations',  color: '#10b981', position: 0 },
      { id: FC_ACHATS,     association_id: AEC_ID, name: 'Achats',       color: '#ef4444', position: 1 },
      { id: FC_SUBVENTION, association_id: AEC_ID, name: 'Subventions',  color: '#3b82f6', position: 2 },
      { id: FC_EVENEMENTS, association_id: AEC_ID, name: 'Événements',   color: '#f59e0b', position: 3 },
    ], { onConflict: 'id' })
    chk('finance categories', fcRes, log)
    log.push('✓ Finance categories created')

    // ── 16. Finance transactions (haute trésorerie) ───────────────────────────
    // Always delete and recreate so amounts are always up to date
    await admin.from('finances').delete().eq('association_id', AEC_ID)
    await admin.from('finances').insert([
      // ── Recettes ──
      // Cotisations : 257 membres × 30 CHF = 7 710 CHF
      { association_id: AEC_ID, created_by: U_CHLOE, type: 'income',  amount: 7710,  label: 'Cotisations annuelles 2025-2026 (257 membres × 30 CHF)', date: '2025-09-30', category_id: FC_COTIS },
      // Subventions
      { association_id: AEC_ID, created_by: U_CHLOE, type: 'income',  amount: 3000,  label: 'Subvention Université — fonctionnement annuel',           date: '2025-09-15', category_id: FC_SUBVENTION },
      { association_id: AEC_ID, created_by: U_CHLOE, type: 'income',  amount: 1500,  label: "Subvention Faculté des Lettres — soutien clubs étudiants", date: '2025-10-01', category_id: FC_SUBVENTION },
      { association_id: AEC_ID, created_by: U_CHLOE, type: 'income',  amount: 500,   label: 'Don — Fondation Culturelle Étudiante',                    date: '2025-11-20', category_id: FC_SUBVENTION },
      // Événements & ventes
      { association_id: AEC_ID, created_by: U_CHLOE, type: 'income',  amount: 385,   label: 'Vente livres lus (déstockage annuel)',                    date: '2025-12-10', category_id: FC_EVENEMENTS },
      { association_id: AEC_ID, created_by: U_CHLOE, type: 'income',  amount: 240,   label: 'Inscriptions atelier écriture (24 × 10 CHF)',             date: '2026-03-05', category_id: FC_EVENEMENTS },
      { association_id: AEC_ID, created_by: U_CHLOE, type: 'income',  amount: 160,   label: 'Soirée inter-asso — participation membres AEC',           date: '2026-04-12', category_id: FC_EVENEMENTS },
      // ── Dépenses ──
      { association_id: AEC_ID, created_by: U_CHLOE, type: 'expense', amount: 420,   label: 'Location salles — semestre automne 2025',                 date: '2025-09-10', category_id: FC_EVENEMENTS },
      { association_id: AEC_ID, created_by: U_CHLOE, type: 'expense', amount: 420,   label: 'Location salles — semestre printemps 2026',               date: '2026-02-01', category_id: FC_EVENEMENTS },
      { association_id: AEC_ID, created_by: U_CHLOE, type: 'expense', amount: 72,    label: "Achat livres : Le Mythe de Sisyphe (8 ex.)",              date: '2025-12-20', category_id: FC_ACHATS },
      { association_id: AEC_ID, created_by: U_CHLOE, type: 'expense', amount: 48,    label: 'Achat livres : Les Misérables (6 ex.)',                   date: '2026-01-28', category_id: FC_ACHATS },
      { association_id: AEC_ID, created_by: U_CHLOE, type: 'expense', amount: 64,    label: "Achat livres : L'Étranger (8 ex.)",                       date: '2026-04-30', category_id: FC_ACHATS },
      { association_id: AEC_ID, created_by: U_CHLOE, type: 'expense', amount: 22.50, label: 'Collations soirée Camus — janvier',                       date: '2026-01-15', category_id: FC_EVENEMENTS },
      { association_id: AEC_ID, created_by: U_CHLOE, type: 'expense', amount: 37.80, label: 'Collations soirée Hugo — février',                        date: '2026-02-20', category_id: FC_EVENEMENTS },
      { association_id: AEC_ID, created_by: U_CHLOE, type: 'expense', amount: 28,    label: "Matériel atelier d'écriture",                             date: '2026-03-08', category_id: FC_ACHATS },
      { association_id: AEC_ID, created_by: U_CHLOE, type: 'expense', amount: 45,    label: 'Communication & impression — semestre automne',           date: '2025-11-15', category_id: FC_EVENEMENTS },
      { association_id: AEC_ID, created_by: U_CHLOE, type: 'expense', amount: 18,    label: 'Impression flyers printemps 2026',                        date: '2026-04-15', category_id: FC_EVENEMENTS },
      { association_id: AEC_ID, created_by: U_CHLOE, type: 'expense', amount: 320,   label: 'Soirée inter-asso — part AEC (traiteur)',                 date: '2026-04-12', category_id: FC_EVENEMENTS },
      { association_id: AEC_ID, created_by: U_CHLOE, type: 'expense', amount: 85,    label: 'Abonnement outils numériques (Notion, Canva Pro)',        date: '2025-09-01', category_id: FC_ACHATS },
    ])
    log.push('✓ Finance transactions created (haute trésorerie ~13 495 CHF recettes / ~1 580 CHF dépenses)')

    // ── 17. Event budgets (dossiers) ──────────────────────────────────────────
    const EB1 = 'aaaaaaaa-0000-0000-0009-000000000001'
    const EB2 = 'aaaaaaaa-0000-0000-0009-000000000002'
    await admin.from('event_budgets').upsert([
      { id: EB1, association_id: AEC_ID, created_by: U_CHLOE, name: 'Budget annuel 2025-2026',  description: "Budget consolidé de l'AEC pour l'année académique 2025-2026.", status: 'active',   event_date: null },
      { id: EB2, association_id: AEC_ID, created_by: U_CHLOE, name: 'Budget AG 2026',           description: "Budget prévisionnel pour l'Assemblée Générale annuelle.",        status: 'planned',  event_date: '2026-06-15' },
    ], { onConflict: 'id' })
    await admin.from('event_budget_lines').delete().in('budget_id', [EB1, EB2])
    await admin.from('event_budget_lines').insert([
      { id: rid(), budget_id: EB1, type: 'income',  label: 'Cotisations membres (257 × 30 CHF)', planned_amount: 7710, actual_amount: 7710 },
      { id: rid(), budget_id: EB1, type: 'income',  label: 'Subventions (université + faculté)', planned_amount: 4500, actual_amount: 5000 },
      { id: rid(), budget_id: EB1, type: 'income',  label: 'Événements & inscriptions',          planned_amount: 700,  actual_amount: 785  },
      { id: rid(), budget_id: EB1, type: 'expense', label: 'Location salles (2 semestres)',       planned_amount: 840,  actual_amount: 840  },
      { id: rid(), budget_id: EB1, type: 'expense', label: 'Achats de livres',                   planned_amount: 250,  actual_amount: 184  },
      { id: rid(), budget_id: EB1, type: 'expense', label: 'Collations & événements',            planned_amount: 500,  actual_amount: 388.30 },
      { id: rid(), budget_id: EB1, type: 'expense', label: 'Communication & outils numériques',  planned_amount: 200,  actual_amount: 148  },
      { id: rid(), budget_id: EB2, type: 'income',  label: 'Subvention événement',               planned_amount: 80,   actual_amount: 0    },
      { id: rid(), budget_id: EB2, type: 'expense', label: 'Impression documents & votes',       planned_amount: 15,   actual_amount: 0    },
      { id: rid(), budget_id: EB2, type: 'expense', label: 'Buffet de clôture',                  planned_amount: 120,  actual_amount: 0    },
    ])
    log.push('✓ Event budgets created')

    // ── 18. Document folders ──────────────────────────────────────────────────
    await admin.from('document_folders').upsert([
      { id: DF_ADMIN,      association_id: AEC_ID, name: 'Administratif',  color: '#3b82f6', position: 0 },
      { id: DF_CR,         association_id: AEC_ID, name: 'Comptes-rendus', color: '#10b981', position: 1 },
      { id: DF_RESSOURCES, association_id: AEC_ID, name: 'Ressources',     color: '#7c3aed', position: 2 },
    ], { onConflict: 'id' })
    log.push('✓ Document folders created')

    // ── 19. Documents ─────────────────────────────────────────────────────────
    const { count: docCount } = await admin
      .from('documents').select('id', { count: 'exact', head: true }).eq('association_id', AEC_ID)
    if ((docCount ?? 0) === 0) {
      await admin.from('documents').insert([
        { id: rid(), association_id: AEC_ID, uploaded_by: U_MAXIME, name: "Statuts de l'AEC.pdf",                folder: 'Administratif',  folder_id: DF_ADMIN,      mime_type: 'application/pdf', file_path: `demo/${AEC_ID}/statuts.pdf`,        file_size: 145320 },
        { id: rid(), association_id: AEC_ID, uploaded_by: U_MAXIME, name: 'Règlement intérieur.pdf',              folder: 'Administratif',  folder_id: DF_ADMIN,      mime_type: 'application/pdf', file_path: `demo/${AEC_ID}/reglement.pdf`,      file_size: 87440  },
        { id: rid(), association_id: AEC_ID, uploaded_by: U_MAXIME, name: 'Charte des membres.pdf',               folder: 'Administratif',  folder_id: DF_ADMIN,      mime_type: 'application/pdf', file_path: `demo/${AEC_ID}/charte.pdf`,         file_size: 62100  },
        { id: rid(), association_id: AEC_ID, uploaded_by: U_MAXIME, name: 'PV Assemblée Générale 2025.pdf',       folder: 'Comptes-rendus', folder_id: DF_CR,         mime_type: 'application/pdf', file_path: `demo/${AEC_ID}/pv_ag_2025.pdf`,    file_size: 214500 },
        { id: rid(), association_id: AEC_ID, uploaded_by: U_MAXIME, name: 'CR Réunion — Janvier 2026.pdf',        folder: 'Comptes-rendus', folder_id: DF_CR,         mime_type: 'application/pdf', file_path: `demo/${AEC_ID}/cr_jan2026.pdf`,    file_size: 78900  },
        { id: rid(), association_id: AEC_ID, uploaded_by: U_MAXIME, name: 'CR Réunion — Février 2026.pdf',        folder: 'Comptes-rendus', folder_id: DF_CR,         mime_type: 'application/pdf', file_path: `demo/${AEC_ID}/cr_fev2026.pdf`,    file_size: 92300  },
        { id: rid(), association_id: AEC_ID, uploaded_by: U_MAXIME, name: 'CR Réunion — Mars 2026.pdf',           folder: 'Comptes-rendus', folder_id: DF_CR,         mime_type: 'application/pdf', file_path: `demo/${AEC_ID}/cr_mar2026.pdf`,    file_size: 68700  },
        { id: rid(), association_id: AEC_ID, uploaded_by: U_LEA,    name: 'Liste livres lus 2024-2025.pdf',       folder: 'Ressources',     folder_id: DF_RESSOURCES, mime_type: 'application/pdf', file_path: `demo/${AEC_ID}/liste_livres.pdf`,  file_size: 34200  },
        { id: rid(), association_id: AEC_ID, uploaded_by: U_LEA,    name: 'Guide animation club lecture.pdf',     folder: 'Ressources',     folder_id: DF_RESSOURCES, mime_type: 'application/pdf', file_path: `demo/${AEC_ID}/guide_anim.pdf`,    file_size: 156800 },
        { id: rid(), association_id: AEC_ID, uploaded_by: U_LEA,    name: 'Planning séances mai-juin 2026.pdf',   folder: 'Ressources',     folder_id: DF_RESSOURCES, mime_type: 'application/pdf', file_path: `demo/${AEC_ID}/planning_s2.pdf`,   file_size: 41600  },
      ])
    }
    log.push('✓ Documents created')

    // ── 20. Note folders ──────────────────────────────────────────────────────
    await admin.from('note_folders').upsert([
      { id: NF_IDEES,      association_id: AEC_ID, created_by: U_LEA,    name: 'Idées & sélection',  color: '#7c3aed', position: 0 },
      { id: NF_RESSOURCES, association_id: AEC_ID, created_by: U_MAXIME, name: 'Organisation',       color: '#0ea5e9', position: 1 },
    ], { onConflict: 'id' })
    log.push('✓ Note folders created')

    // ── 21. Notes ─────────────────────────────────────────────────────────────
    const { count: noteCount } = await admin
      .from('notes').select('id', { count: 'exact', head: true }).eq('association_id', AEC_ID)
    if ((noteCount ?? 0) === 0) {
      await admin.from('notes').insert([
        {
          id: rid(), association_id: AEC_ID, folder_id: NF_IDEES, created_by: U_LEA,
          title: 'Sélection livres 2025-2026',
          content: `# Sélection livres 2025-2026\n\n## Lus cette année\n- **Le Mythe de Sisyphe** — Albert Camus ✅\n- **Les Misérables** — Victor Hugo ✅\n- **L'Étranger** — Albert Camus (en cours)\n\n## Proposés pour le prochain semestre\n1. Fahrenheit 451 — Ray Bradbury 🔥\n2. 1984 — George Orwell\n3. Le Seigneur des Anneaux — J.R.R. Tolkien\n4. La Métamorphose — Franz Kafka\n\n## Critères de sélection\n- Accessibilité (pas trop long)\n- Richesse pour la discussion\n- Diversité des genres et époques`,
        },
        {
          id: rid(), association_id: AEC_ID, folder_id: NF_IDEES, created_by: U_ANTOINE,
          title: 'Idées de thématiques pour les séances',
          content: `# Idées de thématiques\n\n## Pour les prochaines séances\n- **L'absurde dans la littérature** : Camus, Kafka, Beckett\n- **Utopies et dystopies** : Orwell, Huxley, Bradbury\n- **Le voyage initiatique** : classique dans beaucoup de romans\n- **Les femmes dans la littérature** : Beauvoir, Duras, Ernaux\n\n## Formats innovants\n- Soirée "première ligne" : chaque membre lit la première ligne de son livre préféré\n- Blind date avec un livre : livre emballé, sans titre visible\n- Débat : adaptation film vs livre original`,
        },
        {
          id: rid(), association_id: AEC_ID, folder_id: NF_RESSOURCES, created_by: U_MAXIME,
          title: "Planning AG 2026 — ordre du jour",
          content: `# Assemblée Générale 2026\n**Date :** 15 juin 2026, 17h00–19h00\n**Lieu :** Amphithéâtre A1\n\n## Ordre du jour\n1. **Ouverture de séance** — Léa Rousseau (10 min)\n2. **Rapport moral** — bilan de l'année (15 min)\n3. **Rapport financier** — état des comptes, budget prévisionnel (15 min)\n4. **Questions des membres** (15 min)\n5. **Élection du nouveau bureau** (20 min)\n6. **Projets 2026-2027** — présentation et vote (15 min)\n7. **Clôture & buffet** (30 min)`,
        },
        {
          id: rid(), association_id: AEC_ID, folder_id: NF_RESSOURCES, created_by: U_CHLOE,
          title: 'Budget prévisionnel 2026-2027',
          content: `# Budget prévisionnel 2026-2027\n\n## Hypothèses\n- 300 membres actifs (objectif de croissance)\n- 10 séances de lecture\n- 2 événements spéciaux\n\n## Recettes estimées\n| Poste | Montant |\n|---|---|\n| Cotisations (300 × 30 CHF) | 9 000 CHF |\n| Subventions | 5 000 CHF |\n| Événements | 1 000 CHF |\n| **Total** | **15 000 CHF** |\n\n## Dépenses estimées\n| Poste | Montant |\n|---|---|\n| Location salles | 1 200 CHF |\n| Livres & matériel | 600 CHF |\n| Événements | 1 500 CHF |\n| Communication | 300 CHF |\n| **Total** | **3 600 CHF** |\n\n**Excédent prévisionnel : +11 400 CHF**`,
        },
      ])
    }
    log.push('✓ Notes created')

    // ── 22. Conversations & messages ──────────────────────────────────────────
    const { count: convCount } = await admin
      .from('conversations').select('id', { count: 'exact', head: true }).eq('association_id', AEC_ID)
    if ((convCount ?? 0) === 0) {
      await admin.from('conversations').insert([
        { id: CONV_LIVRE, association_id: AEC_ID, title: "Choix du livre pour juin", created_by: U_LEA, created_at: '2026-04-28T10:00:00Z', updated_at: '2026-05-03T16:45:00Z' },
        { id: CONV_AG,    association_id: AEC_ID, title: "Organisation AG 2026",     created_by: U_LEA, created_at: '2026-05-01T09:00:00Z', updated_at: '2026-05-10T11:20:00Z' },
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
        { id: rid(), conversation_id: CONV_LIVRE, sender_id: U_LEA,     content: "Bonjour à tous ! On doit choisir notre livre pour juin. J'hésite entre Fahrenheit 451 de Bradbury et 1984 d'Orwell. Vous avez une préférence ? 🤔", created_at: '2026-04-28T10:15:00Z' },
        { id: rid(), conversation_id: CONV_LIVRE, sender_id: U_ANTOINE, content: "Je vote pour Fahrenheit 451 ! Plus court et très actuel avec les questions de censure sur les réseaux. On aurait plein de choses à dire.", created_at: '2026-04-28T11:02:00Z' },
        { id: rid(), conversation_id: CONV_LIVRE, sender_id: U_CHLOE,   content: "1984 pour moi. Un classique incontournable et le parallèle avec aujourd'hui est saisissant. Mais Bradbury c'est bien aussi...", created_at: '2026-04-28T11:45:00Z' },
        { id: rid(), conversation_id: CONV_LIVRE, sender_id: U_MAXIME,  content: "Fahrenheit 451 ! Et si on invitait quelqu'un de la fac de lettres pour animer la discussion ?", created_at: '2026-04-29T09:30:00Z' },
        { id: rid(), conversation_id: CONV_LIVRE, sender_id: U_INES,    content: "Bonne idée ! Je peux contacter le prof Moreau. Je suis pour Fahrenheit 451 aussi 🙋", created_at: '2026-04-29T10:15:00Z' },
        { id: rid(), conversation_id: CONV_LIVRE, sender_id: U_LEA,     content: "Super ! On vote donc pour Fahrenheit 451. Inès, tu te charges du contact avec le prof Moreau ?", created_at: '2026-04-30T14:00:00Z' },
        { id: rid(), conversation_id: CONV_LIVRE, sender_id: U_CHLOE,   content: "Je vais chercher le meilleur prix pour les livres. Combien d'exemplaires ? 8 comme d'habitude ?", created_at: '2026-05-01T08:45:00Z' },
        { id: rid(), conversation_id: CONV_LIVRE, sender_id: U_LEA,     content: "Oui, 8 exemplaires. Merci Chloé !", created_at: '2026-05-03T16:45:00Z' },
        { id: rid(), conversation_id: CONV_AG, sender_id: U_LEA,    content: "L'AG approche ! Maxime tu as réservé l'amphi A1 ? Et Chloé, le rapport financier sera prêt quand ?", created_at: '2026-05-01T09:15:00Z' },
        { id: rid(), conversation_id: CONV_AG, sender_id: U_MAXIME, content: "Réservé ! Amphi A1, 15 juin 17h-19h. J'ai aussi envoyé les convocations ce matin.", created_at: '2026-05-01T10:30:00Z' },
        { id: rid(), conversation_id: CONV_AG, sender_id: U_CHLOE,  content: "Le rapport sera prêt pour le 10 juin. Avec 257 membres et +11 900 CHF de bilan, on a de belles choses à présenter 😊", created_at: '2026-05-01T11:00:00Z' },
        { id: rid(), conversation_id: CONV_AG, sender_id: U_THOMAS, content: "Je peux aider pour le buffet ! Ma coloc a un grand appart, on pourrait y faire l'after si vous voulez.", created_at: '2026-05-02T14:20:00Z' },
        { id: rid(), conversation_id: CONV_AG, sender_id: U_LEA,    content: "Super idée Thomas ! On fait l'AG à l'amphi et l'after chez toi. N'oublie pas les bulletins de vote Maxime.", created_at: '2026-05-03T09:00:00Z' },
        { id: rid(), conversation_id: CONV_AG, sender_id: U_MAXIME, content: "Sur le coup. Pour les candidatures au bureau, qui se représente à part Léa ?", created_at: '2026-05-10T11:20:00Z' },
      ])
    }
    log.push('✓ Conversations & messages created')

    // ── Done ──────────────────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      associationId: AEC_ID,
      memberCount: 257 + 1, // 257 demo + caller
      treasury: '~11 915 CHF (13 495 CHF recettes − 1 580 CHF dépenses)',
      log,
      message: "L'AEC a été créée avec 257 membres et une trésorerie de ~11 900 CHF. Sélectionnez l'association dans le sélecteur.",
    })

  } catch (err) {
    console.error('[seed-demo] error:', err)
    return NextResponse.json({ success: false, error: String(err), log }, { status: 500 })
  }
}
