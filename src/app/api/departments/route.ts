import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET() {
  const { data: departments, error } = await supabase
    .from('departments')
    .select('*')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get doctor counts per department
  const { data: doctors } = await supabase.from('doctors').select('department_id')
  const countMap: Record<string, number> = {}
  doctors?.forEach(d => {
    countMap[d.department_id] = (countMap[d.department_id] || 0) + 1
  })

  const result = departments?.map(d => ({ ...d, _count: { doctors: countMap[d.id] || 0 } }))
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const { name, location, floor, description, openTime, closeTime, icon, latitude, longitude, writtenDirections } = await request.json()

  if (!name || !location || !floor) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: department, error } = await supabase
    .from('departments')
    .insert({
      name,
      location,
      floor,
      description: description || null,
      open_time: openTime || '08:00',
      close_time: closeTime || '17:00',
      icon: icon || 'hospital',
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      written_directions: writtenDirections || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(department, { status: 201 })
}
