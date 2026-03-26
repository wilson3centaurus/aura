import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')

  let query = supabase
    .from('admitted_patients')
    .select('*')
    .eq('status', 'ADMITTED')
    .order('admission_date', { ascending: false })

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data: patients, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(patients)
}

export async function POST(request: NextRequest) {
  const { name, ward, room, bed, notes, dateOfBirth, wardId, bedId } = await request.json()

  if (!name || !ward || !room || !bed) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: patient, error } = await supabase
    .from('admitted_patients')
    .insert({
      name,
      ward,
      room,
      bed,
      admission_date: new Date().toISOString(),
      notes: notes || null,
      date_of_birth: dateOfBirth || null,
      ward_id: wardId || null,
      bed_id: bedId || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Mark bed as occupied if bedId provided
  if (bedId) {
    await supabase.from('beds').update({ is_occupied: true, patient_id: patient.id }).eq('id', bedId)
  }

  return NextResponse.json(patient, { status: 201 })
}
