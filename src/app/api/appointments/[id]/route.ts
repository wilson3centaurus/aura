import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      doctor:doctors!appointments_doctor_id_fkey(
        id, specialty, room_number, phone, latitude, longitude,
        user:users!doctors_user_id_fkey(name),
        department:departments!doctors_department_id_fkey(name, location, floor, latitude, longitude)
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
  const { status, scheduledAt, declineReason, notes } = body

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (status) updates.status = status

  if (status === 'ACCEPTED' || status === 'IN_PROGRESS') {
    updates.accepted_at = new Date().toISOString()
    updates.scheduled_at = scheduledAt
      ? new Date(scheduledAt).toISOString()
      : new Date().toISOString()
  }

  // Allow rescheduling without changing status
  if (scheduledAt && status !== 'ACCEPTED') {
    updates.scheduled_at = new Date(scheduledAt).toISOString()
  }

  if (status === 'DECLINED' && declineReason) {
    updates.decline_reason = declineReason
  }

  if (status === 'COMPLETED') {
    if (notes) updates.notes = notes
  }

  // Allow saving notes directly without status change
  if (notes && !status) {
    updates.notes = notes
  }

  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // ── Auto-manage doctor status ──────────────────────────────────────
  if (status && data?.doctor_id) {
    const doctorId = data.doctor_id

    if (status === 'ACCEPTED' || status === 'IN_PROGRESS') {
      const scheduledMs = updates.scheduled_at ? new Date(updates.scheduled_at as string).getTime() : Date.now()
      const isCurrentSession = status === 'IN_PROGRESS' || scheduledMs <= Date.now()

      if (isCurrentSession) {
        await supabase
          .from('doctors')
          .update({ status: 'BUSY' })
          .eq('id', doctorId)
      }
    } else if (status === 'COMPLETED' || status === 'DECLINED' || status === 'CANCELLED') {
      // Check if doctor still has other live appointments
      const { data: otherActive } = await supabase
        .from('appointments')
          .select('id, scheduled_at, status')
        .eq('doctor_id', doctorId)
        .neq('id', params.id)

      const stillBusy = (otherActive || []).some(appt => {
        if (appt.status === 'IN_PROGRESS') return true
        if (appt.status !== 'ACCEPTED') return false
        if (!appt.scheduled_at) return false
        return new Date(appt.scheduled_at).getTime() <= Date.now()
      })

      if (!stillBusy) {
        await supabase
          .from('doctors')
          .update({ status: 'AVAILABLE' })
          .eq('id', doctorId)
          .eq('status', 'BUSY')
      }
    }
  }
  // ──────────────────────────────────────────────────────────────────

  return NextResponse.json(data)
}
