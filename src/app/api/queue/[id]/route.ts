import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { status } = await request.json()

  const { data: entry, error } = await supabase
    .from('queue_entries')
    .update({ status })
    .eq('id', id)
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
  return NextResponse.json(entry)
}
