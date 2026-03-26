import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

const SELECT_FIELDS = `
  *,
  user:users!doctors_user_id_fkey(name, email, profile_image, password_changed),
  department:departments!doctors_department_id_fkey(*)
`

function computeActivated(doctor: { latitude: number | null; user: { profile_image: string | null; password_changed: boolean } }) {
  return !!(doctor.user?.profile_image && doctor.latitude != null && doctor.user?.password_changed)
}

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'DOCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: doctor, error } = await supabase
    .from('doctors')
    .select(SELECT_FIELDS)
    .eq('user_id', session.userId)
    .single()

  if (error || !doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
  return NextResponse.json({ ...doctor, is_activated: computeActivated(doctor) })
}

export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'DOCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // Get doctor id
  const { data: doc } = await supabase.from('doctors').select('id').eq('user_id', session.userId).single()
  if (!doc) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  // Build user update
  const userUpdate: Record<string, unknown> = {}
  if (body.profileImage !== undefined) userUpdate.profile_image = body.profileImage
  if (body.name !== undefined) userUpdate.name = body.name
  if (body.email !== undefined) userUpdate.email = body.email

  // Password change
  if (body.password && body.currentPassword) {
    const { data: user } = await supabase.from('users').select('password').eq('id', session.userId).single()
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const valid = await bcrypt.compare(body.currentPassword, user.password)
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    userUpdate.password = await bcrypt.hash(body.password, 12)
    userUpdate.password_changed = true
  }

  if (Object.keys(userUpdate).length > 0) {
    const { error: ue } = await supabase.from('users').update(userUpdate).eq('id', session.userId)
    if (ue) return NextResponse.json({ error: ue.message }, { status: 400 })
  }

  // Build doctor update
  const doctorUpdate: Record<string, unknown> = {}
  if (body.latitude !== undefined) doctorUpdate.latitude = body.latitude
  if (body.longitude !== undefined) doctorUpdate.longitude = body.longitude

  if (Object.keys(doctorUpdate).length > 0) {
    await supabase.from('doctors').update(doctorUpdate).eq('id', doc.id)
  }

  const { data: updated } = await supabase.from('doctors').select(SELECT_FIELDS).eq('user_id', session.userId).single()
  return NextResponse.json({ ...updated, is_activated: updated ? computeActivated(updated as Parameters<typeof computeActivated>[0]) : false })
}
