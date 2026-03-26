import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET() {
  const { data: wards, error } = await supabase
    .from('wards')
    .select(`
      *,
      beds(id, bed_number, is_occupied, patient_id)
    `)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = wards?.map(w => ({
    ...w,
    occupied_beds: w.beds?.filter((b: { is_occupied: boolean }) => b.is_occupied).length || 0,
    available_beds: w.beds?.filter((b: { is_occupied: boolean }) => !b.is_occupied).length || 0,
  }))

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const { name, floor, wardType, nurseInCharge, totalBeds, latitude, longitude, writtenDirections } = await request.json()

  if (!name || !floor) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: ward, error } = await supabase
    .from('wards')
    .insert({
      name,
      floor,
      ward_type: wardType || 'General',
      nurse_in_charge: nurseInCharge || null,
      total_beds: totalBeds || 0,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      written_directions: writtenDirections || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Auto-create beds
  if (totalBeds && totalBeds > 0) {
    const prefix = name.substring(0, 3).toUpperCase().replace(/\s/g, '')
    const beds = Array.from({ length: totalBeds }, (_, i) => ({
      ward_id: ward.id,
      bed_number: `${prefix}${i + 1}`,
    }))
    await supabase.from('beds').insert(beds)
  }

  return NextResponse.json(ward, { status: 201 })
}
