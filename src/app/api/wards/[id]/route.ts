import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: ward, error: wardError } = await supabase
    .from('wards')
    .select('*')
    .eq('id', id)
    .single()

  if (wardError || !ward) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Fetch beds separately (no FK from beds.patient_id → admitted_patients in schema)
  const { data: beds } = await supabase
    .from('beds')
    .select('id, bed_number, is_occupied, patient_id')
    .eq('ward_id', id)
    .order('bed_number')

  const bedsArr = beds || []
  const patientIds = bedsArr.filter((b: any) => b.patient_id).map((b: any) => b.patient_id as string)

  let patientMap: Record<string, any> = {}
  if (patientIds.length > 0) {
    const { data: patients } = await supabase
      .from('admitted_patients')
      .select('id, name, admission_date, notes, date_of_birth')
      .in('id', patientIds)
    for (const p of (patients || [])) patientMap[p.id] = p
  }

  const bedsWithPatients = bedsArr.map((b: any) => ({
    ...b,
    patient: b.patient_id ? (patientMap[b.patient_id] || null) : null,
  }))

  return NextResponse.json({ ...ward, beds: bedsWithPatients })
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
  if (body.totalBeds !== undefined) updateData.total_beds = body.totalBeds

  const { data: ward, error } = await supabase
    .from('wards')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Adjust beds if totalBeds changed
  if (body.totalBeds !== undefined && ward) {
    const newTotal = parseInt(body.totalBeds)
    const { data: existingBeds } = await supabase
      .from('beds')
      .select('id, bed_number, is_occupied')
      .eq('ward_id', id)
      .order('bed_number')

    const current = existingBeds || []
    const diff = newTotal - current.length

    if (diff > 0) {
      // Add new beds
      const prefix = ward.name.substring(0, 3).toUpperCase().replace(/\s/g, '')
      const startNum = current.length + 1
      const newBeds = Array.from({ length: diff }, (_, i) => ({
        ward_id: id,
        bed_number: `${prefix}${startNum + i}`,
      }))
      await supabase.from('beds').insert(newBeds)
    } else if (diff < 0) {
      // Remove unoccupied beds from the end
      const toRemove = current
        .filter(b => !b.is_occupied)
        .slice(diff) // last |diff| unoccupied beds
      if (toRemove.length > 0) {
        await supabase.from('beds').delete().in('id', toRemove.map(b => b.id))
      }
    }
  }

  return NextResponse.json(ward)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { error } = await supabase.from('wards').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
