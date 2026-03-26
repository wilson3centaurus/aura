import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name
  if (body.location !== undefined) updateData.location = body.location
  if (body.floor !== undefined) updateData.floor = body.floor
  if (body.description !== undefined) updateData.description = body.description || null
  if (body.openTime !== undefined) updateData.open_time = body.openTime
  if (body.closeTime !== undefined) updateData.close_time = body.closeTime
  if (body.writtenDirections !== undefined) updateData.written_directions = body.writtenDirections || null
  if (body.latitude !== undefined) updateData.latitude = body.latitude ? parseFloat(body.latitude) : null
  if (body.longitude !== undefined) updateData.longitude = body.longitude ? parseFloat(body.longitude) : null

  const { data, error } = await supabase
    .from('departments')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabase.from('departments').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
