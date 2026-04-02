import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()
  const todayStr = today.toDateString()

  // Run all queries in parallel — single round-trip to the server instead of 7
  const [doctorsRes, depsRes, medsRes, admittedRes, wardsRes, queueRes, apptsRes] =
    await Promise.all([
      supabase.from('doctors').select('*', { count: 'exact', head: true }),
      supabase.from('departments').select('*', { count: 'exact', head: true }),
      supabase.from('medications').select('*', { count: 'exact', head: true }),
      supabase.from('admitted_patients').select('*', { count: 'exact', head: true }),
      supabase
        .from('wards')
        .select('id, name, ward_type, total_beds, beds(is_occupied)')
        .order('name'),
      supabase
        .from('queue_entries')
        .select(
          `id, ticket_number, patient_name, priority, status, created_at,
           doctor:doctors!queue_entries_doctor_id_fkey(id, user:users!doctors_user_id_fkey(name)),
           department:departments!queue_entries_department_id_fkey(name)`
        )
        .in('status', ['WAITING', 'CALLED', 'IN_PROGRESS'])
        .order('priority')
        .order('created_at'),
      supabase
        .from('appointments')
        .select(
          `id, patient_name, symptoms, status, scheduled_at, created_at,
           doctor:doctors!appointments_doctor_id_fkey(id, user:users!doctors_user_id_fkey(name))`
        )
        .in('status', ['PENDING', 'ACCEPTED'])
        .gte('scheduled_at', todayISO)
        .order('scheduled_at')
        .limit(50),
    ])

  const wardsArr = (wardsRes.data || []) as any[]
  const queueArr = (queueRes.data || []) as any[]
  const apptsArr = (apptsRes.data || []) as any[]

  const wardStats = wardsArr.map((w: any) => ({
    id: w.id,
    name: w.name,
    ward_type: w.ward_type,
    total_beds: w.total_beds,
    occupied_beds: (w.beds as any[])?.filter((b: any) => b.is_occupied).length ?? 0,
    available_beds: (w.beds as any[])?.filter((b: any) => !b.is_occupied).length ?? 0,
  }))

  // Unified queue: walk-ins + today's accepted appointments
  const walkins = queueArr.map((q: any) => ({ ...q, type: 'walkin' }))
  const todayScheduled = apptsArr
    .filter((a: any) => a.status === 'ACCEPTED' && new Date(a.scheduled_at).toDateString() === todayStr)
    .map((a: any) => ({ ...a, type: 'scheduled' }))

  const unifiedQueue = [...walkins, ...todayScheduled].sort(
    (a: any, b: any) =>
      new Date(a.scheduled_at || a.created_at).getTime() -
      new Date(b.scheduled_at || b.created_at).getTime()
  )

  return NextResponse.json({
    stats: {
      doctors: doctorsRes.count ?? 0,
      departments: depsRes.count ?? 0,
      medications: medsRes.count ?? 0,
      admittedPatients: admittedRes.count ?? 0,
      queueActive: unifiedQueue.length,
      todayAppointments: apptsArr.filter(
        (a: any) => new Date(a.scheduled_at).toDateString() === todayStr
      ).length,
      pendingAppointments: apptsArr.length,
      wardsCount: wardsArr.length,
      bedsOccupied: wardStats.reduce((s: number, w: any) => s + w.occupied_beds, 0),
      bedsTotal: wardStats.reduce((s: number, w: any) => s + w.total_beds, 0),
    },
    wardStats: wardStats.slice(0, 4),
    recentQueue: unifiedQueue.slice(0, 10),
    upcomingAppts: apptsArr.slice(0, 4),
  })
}
