import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: doctor, error } = await supabase
    .from('doctors')
    .select(`
      *,
      user:users!doctors_user_id_fkey(name, email, profile_image),
      department:departments!doctors_department_id_fkey(*)
    `)
    .eq('id', id)
    .single()

  if (error || !doctor) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(doctor)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: doc } = await supabase.from('doctors').select('user_id').eq('id', id).single()
  await supabase.from('doctors').delete().eq('id', id)
  if (doc?.user_id) await supabase.from('users').delete().eq('id', doc.user_id)
  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  // Update user fields if provided (name, email)
  const userUpdate: Record<string, unknown> = {}
  if (body.name !== undefined) userUpdate.name = body.name
  if (body.email !== undefined) userUpdate.email = body.email
  if (Object.keys(userUpdate).length > 0) {
    const { data: docRow } = await supabase.from('doctors').select('user_id').eq('id', id).single()
    if (docRow) await supabase.from('users').update(userUpdate).eq('id', docRow.user_id)
  }

  const updateData: Record<string, unknown> = {}
  if (body.status) updateData.status = body.status
  if (body.roomNumber !== undefined) updateData.room_number = body.roomNumber
  if (body.specialty) updateData.specialty = body.specialty
  if (body.departmentId) updateData.department_id = body.departmentId
  if (body.phone !== undefined) updateData.phone = body.phone
  if (body.latitude !== undefined) updateData.latitude = body.latitude
  if (body.longitude !== undefined) updateData.longitude = body.longitude

  const { data: doctor, error } = await supabase
    .from('doctors')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      user:users!doctors_user_id_fkey(name, email, profile_image, password_changed),
      department:departments!doctors_department_id_fkey(*)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  const is_activated = !!(doctor?.user?.profile_image && doctor?.latitude != null && doctor?.user?.password_changed)
  return NextResponse.json({ ...doctor, is_activated })
}
