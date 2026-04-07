import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET() {
  const { data: info, error } = await supabase
    .from('hospital_info')
    .select('*')
    .order('category')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(info)
}

export async function POST(request: NextRequest) {
  const { key, value, category } = await request.json()
  if (!key?.trim() || !value?.trim() || !category?.trim())
    return NextResponse.json({ error: 'key, value, and category are required' }, { status: 400 })
  const { data, error } = await supabase
    .from('hospital_info')
    .upsert({ key: key.trim(), value: value.trim(), category: category.trim() }, { onConflict: 'key' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
  const { id, key, value, category } = await request.json()
  if (!id || !value?.trim())
    return NextResponse.json({ error: 'id and value are required' }, { status: 400 })
  const { data, error } = await supabase
    .from('hospital_info')
    .update({ key, value: value.trim(), category })
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const { error } = await supabase.from('hospital_info').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
