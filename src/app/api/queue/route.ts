import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')
  const mine = searchParams.get('mine')

  let query = supabase
    .from('queue_entries')
    .select(`
      *,
      doctor:doctors!queue_entries_doctor_id_fkey(
        id,
        user:users!doctors_user_id_fkey(name)
      ),
      department:departments!queue_entries_department_id_fkey(name)
    `)
    .order('priority')
    .order('created_at')

  if (statusFilter) {
    query = query.in('status', statusFilter.split(','))
  }

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
  }

  const { data: queue, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(queue)
}

export async function POST(request: NextRequest) {
  const { patientName, departmentId, doctorId, priority, symptoms } = await request.json()

  if (!patientName || !departmentId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Get next ticket number
  const { data: lastEntry } = await supabase
    .from('queue_entries')
    .select('ticket_number')
    .order('ticket_number', { ascending: false })
    .limit(1)
    .single()

  const ticketNumber = (lastEntry?.ticket_number || 0) + 1

  const { data: entry, error } = await supabase
    .from('queue_entries')
    .insert({
      ticket_number: ticketNumber,
      patient_name: patientName,
      department_id: departmentId,
      doctor_id: doctorId || null,
      priority: priority || 'ROUTINE',
      symptoms: symptoms || null,
    })
    .select(`
      *,
      doctor:doctors!queue_entries_doctor_id_fkey(
        id,
        user:users!doctors_user_id_fkey(name)
      ),
      department:departments!queue_entries_department_id_fkey(name)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Calculate position
  const { count } = await supabase
    .from('queue_entries')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'WAITING')
    .eq('department_id', departmentId)
    .lte('created_at', entry.created_at)

  return NextResponse.json({ ...entry, position: count }, { status: 201 })
}
