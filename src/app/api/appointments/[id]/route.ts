import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      doctor:doctors!appointments_doctor_id_fkey(
        id, specialty, room_number, phone,
        user:users!doctors_user_id_fkey(name),
        department:departments!doctors_department_id_fkey(name, location, floor)
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== 'DOCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { status, scheduledAt, declineReason } = body

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'ACCEPTED') {
    updates.accepted_at = new Date().toISOString()
    updates.scheduled_at = scheduledAt
      ? new Date(scheduledAt).toISOString()
      : new Date().toISOString()
  }

  if (status === 'DECLINED' && declineReason) {
    updates.decline_reason = declineReason
  }

  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
