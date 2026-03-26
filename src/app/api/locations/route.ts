import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET() {
  try {
    const { data: pins, error } = await supabase
      .from('location_pins')
      .select('*')
      .order('category')
      .order('name')

    if (error) throw error
    return NextResponse.json(pins)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('aura-token')?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload || payload.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, category, description, latitude, longitude, writtenDirections, floor, iconName } = await req.json()

    if (!name || latitude == null || longitude == null) {
      return NextResponse.json({ error: 'name, latitude and longitude are required' }, { status: 400 })
    }

    const { data: pin, error } = await supabase
      .from('location_pins')
      .insert({
        name,
        category: category || 'other',
        description: description || null,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        written_directions: writtenDirections || null,
        floor: floor || 'Ground Floor',
        icon_name: iconName || 'location',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(pin, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create location pin' }, { status: 500 })
  }
}
