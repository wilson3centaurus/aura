import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import bcrypt from 'bcryptjs'

/** Return minutes since midnight for a "HH:MM" time string */
function toMins(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** Check if nowMinutes is within [start, end) */
function timeInRange(nowMinutes: number, startStr: string, endStr: string) {
  return nowMinutes >= toMins(startStr) && nowMinutes < toMins(endStr)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const onlyActivated = searchParams.get('activated') === 'true'

  // Fetch schedule settings stored in HospitalInfo with category = 'settings'
  const { data: settingsRows } = await supabase
    .from('hospital_info')
    .select('key, value')
    .eq('category', 'settings')

  const settings: Record<string, string> = {}
  for (const row of settingsRows ?? []) settings[row.key] = row.value

  const workStart  = settings.workStartTime  || '06:00'
  const workEnd    = settings.workEndTime    || '19:00'
  const lunchStart = settings.lunchStartTime || '13:00'
  const lunchEnd   = settings.lunchEndTime   || '14:00'

  // Current time in minutes since midnight
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  const isWorkTime  = timeInRange(nowMinutes, workStart, workEnd)
  const isLunchTime = timeInRange(nowMinutes, lunchStart, lunchEnd)

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
    ?.map(d => {
      // Apply schedule overrides — BUSY is always protected
      let effectiveStatus = d.status
      if (effectiveStatus !== 'BUSY') {
        if (!isWorkTime) {
          effectiveStatus = 'OFFLINE'
        } else if (isLunchTime) {
          effectiveStatus = 'ON_BREAK'
        }
      }
      return {
        ...d,
        status: effectiveStatus,
        is_activated: !!(d.user?.profile_image && d.latitude != null && d.user?.password_changed),
        _count: { queueEntries: countMap[d.id] || 0 },
      }
    })
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
