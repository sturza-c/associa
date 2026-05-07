import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const associationId = searchParams.get('associationId')
  const yearParam = searchParams.get('year')

  if (!associationId) return NextResponse.json({ error: 'Missing associationId' }, { status: 400 })

  // Auth already verified by middleware
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Verify membership (admin client — no extra auth roundtrip)
  const { data: membership } = await admin
    .from('association_memberships')
    .select('role')
    .eq('association_id', associationId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()
  if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Detect available years
  const { data: yearsData } = await admin
    .from('cotisations')
    .select('year')
    .eq('association_id', associationId)
    .order('year', { ascending: false })

  const years: number[] = [...new Set((yearsData ?? []).map(r => r.year as number))]

  // Active members with profiles
  const { data: members } = await admin
    .from('association_memberships')
    .select('id, user_id, role, joined_at, user_profiles(full_name, email, avatar_url)')
    .eq('association_id', associationId)
    .eq('is_active', true)

  const year = yearParam ? parseInt(yearParam) : (years[0] ?? new Date().getFullYear())

  let cotisations: unknown[] = []
  if (years.length > 0 || yearParam) {
    const { data, error } = await admin
      .from('cotisations')
      .select('id, membership_id, external_name, external_email, year, amount_due, amount_paid, paid_at, payment_method, notes, updated_at')
      .eq('association_id', associationId)
      .eq('year', year)
    if (!error) cotisations = data ?? []
  }

  return NextResponse.json({
    years,
    activeYear: year,
    members: members ?? [],
    cotisations,
    callerRole: membership.role,
  })
}
