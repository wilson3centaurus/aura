import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

const SETTINGS_CATEGORY = 'settings'

export async function GET() {
  const { data, error } = await supabase
    .from('hospital_info')
    .select('*')
    .eq('category', SETTINGS_CATEGORY)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Convert to key-value object for easy use
  const settings: Record<string, string> = {}
  for (const row of data ?? []) {
    settings[row.key] = row.value
  }
  return NextResponse.json(settings)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  // body is expected to be { key: value, ... }
  const entries = Object.entries(body)
  for (const [key, value] of entries) {
    await supabase
      .from('hospital_info')
      .upsert(
        { key, value: String(value), category: SETTINGS_CATEGORY },
        { onConflict: 'key' }
      )
  }

  return NextResponse.json({ success: true })
}
