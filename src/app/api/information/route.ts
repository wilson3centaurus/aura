import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET() {
  const { data: info, error } = await supabase
    .from('hospital_info')
    .select('*')
    .order('category')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(info)
}
