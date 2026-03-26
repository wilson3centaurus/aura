import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get('aura-token')?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload || payload.role !== 'ADMIN') return false
  return true
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  try {
    const data = await req.json()
    const { data: pin, error } = await supabase
      .from('location_pins')
      .update({
        name: data.name,
        category: data.category,
        description: data.description ?? null,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        written_directions: data.writtenDirections ?? null,
        floor: data.floor,
        icon_name: data.iconName ?? 'location',
        is_active: data.isActive ?? true,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(pin)
  } catch {
    return NextResponse.json({ error: 'Failed to update pin' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  try {
    const { error } = await supabase.from('location_pins').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete pin' }, { status: 500 })
  }
}
