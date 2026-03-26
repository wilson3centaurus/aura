import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: ward, error } = await supabase
    .from('wards')
    .select(`
      *,
      beds(
        id, bed_number, is_occupied, patient_id,
        patient:admitted_patients!beds_patient_id_fkey(id, name, notes)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !ward) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(ward)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name
  if (body.floor !== undefined) updateData.floor = body.floor
  if (body.wardType !== undefined) updateData.ward_type = body.wardType
  if (body.nurseInCharge !== undefined) updateData.nurse_in_charge = body.nurseInCharge
  if (body.latitude !== undefined) updateData.latitude = body.latitude
  if (body.longitude !== undefined) updateData.longitude = body.longitude
  if (body.writtenDirections !== undefined) updateData.written_directions = body.writtenDirections

  const { data: ward, error } = await supabase
    .from('wards')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(ward)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { error } = await supabase.from('wards').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
