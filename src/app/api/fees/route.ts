import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET() {
  const { data: fees, error } = await supabase
    .from('fees')
    .select('*')
    .order('category')
    .order('service')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(fees)
}

export async function POST(request: NextRequest) {
  const { service, category, price, description, icon } = await request.json()

  if (!service || !category || price === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: fee, error } = await supabase
    .from('fees')
    .insert({
      service,
      category,
      price,
      description: description || null,
      icon: icon || 'receipt',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(fee, { status: 201 })
}
