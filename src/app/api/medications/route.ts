import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET() {
  const { data: medications, error } = await supabase
    .from('medications')
    .select('*')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(medications)
}

export async function POST(request: NextRequest) {
  const { name, form, dosage, price, quantity, prescriptionRequired, category, inStock, icon } = await request.json()

  if (!name || !form || !dosage || price === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: medication, error } = await supabase
    .from('medications')
    .insert({
      name,
      form,
      dosage,
      price,
      quantity: quantity || 0,
      in_stock: inStock !== undefined ? inStock : (quantity > 0),
      prescription_required: prescriptionRequired || false,
      category: category || null,
      icon: icon || 'pill',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(medication, { status: 201 })
}
