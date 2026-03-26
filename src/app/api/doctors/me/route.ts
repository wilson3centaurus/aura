import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'DOCTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: doctor, error } = await supabase
    .from('doctors')
    .select(`
      *,
      user:users!doctors_user_id_fkey(name, email, profile_image),
      department:departments!doctors_department_id_fkey(*)
    `)
    .eq('user_id', session.userId)
    .single()

  if (error || !doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
  return NextResponse.json(doctor)
}
