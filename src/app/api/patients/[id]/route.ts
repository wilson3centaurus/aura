import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  // If discharging, free the bed
  if (body.status === 'DISCHARGED') {
    const { data: patient } = await supabase.from('admitted_patients').select('bed_id').eq('id', id).single()
    if (patient?.bed_id) {
      await supabase.from('beds').update({ is_occupied: false, patient_id: null }).eq('id', patient.bed_id)
    }
  }

  const { data: updated, error } = await supabase
    .from('admitted_patients')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(updated)
}
