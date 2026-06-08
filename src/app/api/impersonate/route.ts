import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { signToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { doctorId, key } = await request.json()

  if (!doctorId || !key) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const validKey = process.env.ADMIN_IMPERSONATOR_KEY
  if (!validKey || key !== validKey) {
    return NextResponse.json({ error: 'Invalid impersonator key' }, { status: 403 })
  }

  const { data: doctor, error } = await supabase
    .from('doctors')
    .select('*, user:users!doctors_user_id_fkey(id, name, email, role)')
    .eq('id', doctorId)
    .single()

  if (error || !doctor) {
    return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
  }

  const token = await signToken({
    userId: doctor.user.id,
    role: 'DOCTOR',
    name: doctor.user.name,
  })

  const response = NextResponse.json({
    success: true,
    doctor: { name: doctor.user.name, email: doctor.user.email },
  })

  response.cookies.set('aura-token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  })

  return response
}
