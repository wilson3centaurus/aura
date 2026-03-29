import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const qr = searchParams.get('qr')

  if (!qr) return NextResponse.json({ error: 'QR code required' }, { status: 400 })

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id, patient_name, patient_phone, symptoms, status,
      scheduled_at, accepted_at, decline_reason, notes, created_at, qr_code,
      doctor:doctors!appointments_doctor_id_fkey(
        id, specialty, room_number, phone, latitude, longitude,
        user:users!doctors_user_id_fkey(name),
        department:departments!doctors_department_id_fkey(name, location, floor, latitude, longitude)
      )
    `)
    .eq('qr_code', qr)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
  return NextResponse.json(data)
}
