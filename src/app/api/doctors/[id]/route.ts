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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  const updateData: Record<string, unknown> = {}
  if (body.status) updateData.status = body.status
  if (body.roomNumber !== undefined) updateData.room_number = body.roomNumber
  if (body.specialty) updateData.specialty = body.specialty
  if (body.departmentId) updateData.department_id = body.departmentId
  if (body.phone !== undefined) updateData.phone = body.phone

  const { data: doctor, error } = await supabase
    .from('doctors')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      user:users!doctors_user_id_fkey(name, email, profile_image),
      department:departments!doctors_department_id_fkey(*)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(doctor)
}
