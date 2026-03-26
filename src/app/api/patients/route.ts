import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const status = searchParams.get('status')

  let query = supabase
    .from('admitted_patients')
    .select('*')
    .order('admission_date', { ascending: false })

  if (status) query = query.eq('status', status)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data: patients, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrich with ward/bed names via separate queries
  const wardIds = Array.from(new Set(patients?.filter(p => p.ward_id).map(p => p.ward_id as string) || []))
  const bedIds  = Array.from(new Set(patients?.filter(p => p.bed_id).map(p => p.bed_id as string) || []))

  const [wardsRes, bedsRes] = await Promise.all([
    wardIds.length > 0 ? supabase.from('wards').select('id, name').in('id', wardIds) : { data: [] },
    bedIds.length  > 0 ? supabase.from('beds').select('id, bed_number').in('id', bedIds)  : { data: [] },
  ])

  const wardMap: Record<string, string> = {}
  const bedMap:  Record<string, string> = {}
  for (const w of (wardsRes.data || [])) wardMap[w.id] = w.name
  for (const b of (bedsRes.data  || [])) bedMap[b.id]  = b.bed_number

  const enriched = (patients || []).map(p => ({
    ...p,
    ward: p.ward_id ? { id: p.ward_id, name: wardMap[p.ward_id] || p.ward || null } : null,
    bed:  p.bed_id  ? { id: p.bed_id,  bed_number: bedMap[p.bed_id] || p.bed || null }  : null,
  }))

  return NextResponse.json(enriched)
}

export async function POST(request: NextRequest) {
  const { name, ward, bed, notes, dateOfBirth, wardId, bedId } = await request.json()

  if (!name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: patient, error } = await supabase
    .from('admitted_patients')
    .insert({
      name,
      ward: ward || null,
      room: ward || null,
      bed: bed || null,
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
