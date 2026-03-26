import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const onlyActivated = searchParams.get('activated') === 'true'

  const { data: doctors, error } = await supabase
    .from('doctors')
    .select(`
      *,
      user:users!doctors_user_id_fkey(name, email, profile_image, password_changed),
      department:departments!doctors_department_id_fkey(id, name)
    `)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get queue counts per doctor
  const { data: queueCounts } = await supabase
    .from('queue_entries')
    .select('doctor_id')
    .in('status', ['WAITING', 'CALLED'])

  const countMap: Record<string, number> = {}
  queueCounts?.forEach(q => {
    if (q.doctor_id) countMap[q.doctor_id] = (countMap[q.doctor_id] || 0) + 1
  })

  const result = doctors
    ?.map(d => ({
      ...d,
      is_activated: !!(d.user?.profile_image && d.latitude != null && d.user?.password_changed),
      _count: { queueEntries: countMap[d.id] || 0 },
    }))
    .filter(d => !onlyActivated || d.is_activated)

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const { name, email, password, specialty, departmentId, roomNumber, phone } = await request.json()

  if (!name || !email || !password || !specialty || !departmentId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  // Create user first
  const { data: user, error: userErr } = await supabase
    .from('users')
    .insert({ name, email, password: hashedPassword, role: 'DOCTOR' })
    .select()
    .single()

  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 400 })

  // Create doctor record
  const { data: doctor, error: docErr } = await supabase
    .from('doctors')
    .insert({
      user_id: user.id,
      specialty,
      department_id: departmentId,
      room_number: roomNumber || null,
      phone: phone || null,
    })
    .select(`
      *,
      user:users!doctors_user_id_fkey(name, email, profile_image),
      department:departments!doctors_department_id_fkey(id, name)
    `)
    .single()

  if (docErr) return NextResponse.json({ error: docErr.message }, { status: 400 })

  return NextResponse.json(doctor, { status: 201 })
}
