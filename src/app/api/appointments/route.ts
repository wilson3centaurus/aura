import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { getSession } from '@/lib/auth'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mine = searchParams.get('mine')

  let query = supabase
    .from('appointments')
    .select(`
      *,
      doctor:doctors!appointments_doctor_id_fkey(
        id,
        user:users!doctors_user_id_fkey(name)
      )
    `)
    .order('scheduled_at')

  if (mine === 'true') {
    const session = await getSession()
    if (session && session.role === 'DOCTOR') {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', session.userId)
        .single()
      if (doctor) query = query.eq('doctor_id', doctor.id)
    }
    // Always show PENDING regardless of date; filter out old declined/completed
    query = query.or('status.eq.PENDING,status.eq.ACCEPTED,status.eq.IN_PROGRESS,status.eq.COMPLETED')
  }

  const { data: appointments, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(appointments)
}

export async function POST(request: NextRequest) {
  const { patientName, patientPhone, symptoms, doctorId, scheduledAt, notes } = await request.json()

  if (!patientName || !doctorId || !scheduledAt) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const generateShortCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const dl = () => letters[Math.floor(Math.random() * letters.length)]
    const n = Math.floor(Math.random() * 90) + 10
    return `${dl()}${dl()}${n}`
  }

  let shortCode = ''
  for (let i = 0; i < 5; i++) {
    shortCode = generateShortCode()
    const { count } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('qr_code', shortCode)
    if (count === 0) break
  }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      patient_name: patientName,
      patient_phone: patientPhone || null,
      symptoms: symptoms || null,
      doctor_id: doctorId,
      scheduled_at: new Date(scheduledAt).toISOString(),
      notes: notes || null,
      qr_code: shortCode,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(appointment, { status: 201 })
}
