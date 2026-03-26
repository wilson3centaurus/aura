'use client'

import { useEffect, useState } from 'react'

interface Analytics {
  // Appointments
  totalAppointments: number
  pendingAppts: number
  acceptedAppts: number
  declinedAppts: number
  completedAppts: number
  inProgressAppts: number
  todayAppts: number
  // Doctors
  totalDoctors: number
  activeDoctors: number
  availableDoctors: number
  // Wards / Beds
  totalBeds: number
  occupiedBeds: number
  // Patients
  totalPatients: number
  // Queue
  queueWaiting: number
  // By doctor
  appointmentsByDoctor: { name: string; count: number; specialty: string }[]
  // Appointment status breakdown
  statusBreakdown: { label: string; count: number; color: string }[]
  // Ward occupancy
  wardStats: { name: string; occupied: number; total: number }[]
}

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div className={`bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-5`}>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function BarChart({ data, colorFn }: { data: { label: string; value: number; max: number }[]; colorFn?: (i: number) => string }) {
  const maxVal = Math.max(...data.map(d => d.value), 1)
  const colors = ['bg-[#003d73]', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-purple-500', 'bg-rose-500', 'bg-teal-500', 'bg-orange-500']
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={d.label}>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-gray-600 dark:text-gray-400 truncate max-w-[60%]">{d.label}</span>
            <span className="font-black text-gray-900 dark:text-white">{d.value}</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-[#222] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${colorFn ? colorFn(i) : colors[i % colors.length]}`}
              style={{ width: `${(d.value / maxVal) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ segments }: { segments: { label: string; count: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.count, 0) || 1
  let offset = 0
  const r = 40, circ = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-6">
      <svg width="100" height="100" viewBox="0 0 100 100" className="flex-shrink-0">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" className="text-gray-100 dark:text-[#222]" strokeWidth="16" />
        {segments.map((seg, i) => {
          const pct = seg.count / total
          const dash = pct * circ
          const el = (
            <circle key={i} cx="50" cy="50" r={r} fill="none" stroke={seg.color} strokeWidth="16"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
          )
          offset += dash
          return el
        })}
        <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="900" fill="currentColor" className="text-gray-900 dark:text-white" style={{ fill: 'currentColor' }}>
          {total}
        </text>
      </svg>
      <div className="flex-1 space-y-1.5">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-[11px] text-gray-600 dark:text-gray-400 flex-1">{seg.label}</span>
            <span className="text-[11px] font-black text-gray-900 dark:text-white">{seg.count}</span>
            <span className="text-[10px] text-gray-400">({total > 0 ? Math.round((seg.count / total) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminReportsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [appts, doctors, wards, patients, queue] = await Promise.all([
        fetch('/api/appointments').then(r => r.json()).catch(() => []),
        fetch('/api/doctors').then(r => r.json()).catch(() => []),
        fetch('/api/wards').then(r => r.json()).catch(() => []),
        fetch('/api/patients').then(r => r.json()).catch(() => []),
        fetch('/api/queue').then(r => r.json()).catch(() => []),
      ])

      const apptArr: any[] = Array.isArray(appts) ? appts : []
      const docArr: any[] = Array.isArray(doctors) ? doctors : []
      const wardArr: any[] = Array.isArray(wards) ? wards : []
      const patientArr: any[] = Array.isArray(patients) ? patients : []
      const queueArr: any[] = Array.isArray(queue) ? queue : []

      const todayStr = new Date().toDateString()
      const todayAppts = apptArr.filter(a => a.scheduled_at && new Date(a.scheduled_at).toDateString() === todayStr).length
      const pendingAppts = apptArr.filter(a => a.status === 'PENDING').length
      const acceptedAppts = apptArr.filter(a => a.status === 'ACCEPTED').length
      const declinedAppts = apptArr.filter(a => a.status === 'DECLINED').length
      const completedAppts = apptArr.filter(a => a.status === 'COMPLETED').length
      const inProgressAppts = apptArr.filter(a => a.status === 'IN_PROGRESS').length

      const totalBeds = wardArr.reduce((s: number, w: any) => s + (w.total_beds || 0), 0)
      const occupiedBeds = wardArr.reduce((s: number, w: any) => s + (w.occupied_beds || 0), 0)

      // Appointments per doctor
      const docMap: Record<string, { name: string; count: number; specialty: string }> = {}
      apptArr.forEach(a => {
        if (!a.doctor) return
        const id = a.doctor.id
        if (!docMap[id]) docMap[id] = { name: a.doctor.user?.name || 'Unknown', count: 0, specialty: a.doctor.specialty || '' }
        docMap[id].count++
      })
      const appointmentsByDoctor = Object.values(docMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)

      const statusBreakdown = [
        { label: 'Pending', count: pendingAppts, color: '#f59e0b' },
        { label: 'Accepted', count: acceptedAppts, color: '#10b981' },
        { label: 'In Progress', count: inProgressAppts, color: '#3b82f6' },
        { label: 'Completed', count: completedAppts, color: '#6b7280' },
        { label: 'Declined', count: declinedAppts, color: '#ef4444' },
      ].filter(s => s.count > 0)

      const wardStats = wardArr.map((w: any) => ({
        name: w.name,
        occupied: w.occupied_beds || 0,
        total: w.total_beds || 0,
      })).filter((w: any) => w.total > 0)

      setData({
        totalAppointments: apptArr.length,
        pendingAppts, acceptedAppts, declinedAppts, completedAppts, inProgressAppts, todayAppts,
        totalDoctors: docArr.length,
        activeDoctors: docArr.filter((d: any) => d.is_activated).length,
        availableDoctors: docArr.filter((d: any) => d.status === 'AVAILABLE').length,
        totalBeds, occupiedBeds,
        totalPatients: patientArr.length,
        queueWaiting: queueArr.filter((q: any) => q.status === 'WAITING' || q.status === 'CALLED').length,
        appointmentsByDoctor,
        statusBreakdown,
        wardStats,
      })
      setLastRefreshed(new Date())
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-[#003d73] border-t-transparent animate-spin" />
    </div>
  )

  if (!data) return null

  const occupancyPct = data.totalBeds > 0 ? Math.round((data.occupiedBeds / data.totalBeds) * 100) : 0
  const acceptRate = data.totalAppointments > 0 ? Math.round(((data.acceptedAppts + data.completedAppts) / data.totalAppointments) * 100) : 0

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Live hospital performance metrics
            {lastRefreshed && <> · Updated {lastRefreshed.toLocaleTimeString()}</>}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#222] hover:bg-gray-200 dark:hover:bg-[#333] text-gray-700 dark:text-gray-300 text-xs font-bold transition-colors">
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Appointments" value={data.totalAppointments} sub={`${data.todayAppts} today`} color="text-[#003d73] dark:text-blue-400" />
        <StatCard label="Active Doctors" value={`${data.availableDoctors}/${data.totalDoctors}`} sub={`${data.activeDoctors} accounts activated`} color="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Bed Occupancy" value={`${occupancyPct}%`} sub={`${data.occupiedBeds} / ${data.totalBeds} beds filled`} color="text-amber-600 dark:text-amber-400" />
        <StatCard label="Patients Registered" value={data.totalPatients} sub={`${data.queueWaiting} in queue now`} color="text-purple-600 dark:text-purple-400" />
      </div>

      {/* Acceptance rate + queue */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Acceptance Rate</p>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400">{acceptRate}%</span>
          </div>
          <div className="h-3 bg-gray-100 dark:bg-[#222] rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${acceptRate}%` }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-2">Accepted + Completed vs total</p>
        </div>

        <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Pending Review</p>
          <p className="text-4xl font-black text-amber-600 dark:text-amber-400">{data.pendingAppts}</p>
          <p className="text-[11px] text-gray-400 mt-1">Appointments awaiting doctor response</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-2 text-center">
              <p className="text-xs font-black text-amber-700 dark:text-amber-400">{data.inProgressAppts}</p>
              <p className="text-[9px] text-gray-400 uppercase tracking-wider">In Progress</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-2 text-center">
              <p className="text-xs font-black text-red-600 dark:text-red-400">{data.declinedAppts}</p>
              <p className="text-[9px] text-gray-400 uppercase tracking-wider">Declined</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Queue Status</p>
          <p className="text-4xl font-black text-blue-600 dark:text-blue-400">{data.queueWaiting}</p>
          <p className="text-[11px] text-gray-400 mt-1">Patients currently waiting or called</p>
          <div className="mt-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl p-2.5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400">Live queue data</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Appointment status donut */}
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Appointment Status Breakdown</p>
          {data.statusBreakdown.length > 0
            ? <DonutChart segments={data.statusBreakdown} />
            : <p className="text-sm text-gray-400 text-center py-4">No appointments yet</p>
          }
        </div>

        {/* Doctor workload */}
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Appointments per Doctor</p>
          {data.appointmentsByDoctor.length > 0
            ? <BarChart data={data.appointmentsByDoctor.map(d => ({ label: d.name, value: d.count, max: data.totalAppointments }))} />
            : <p className="text-sm text-gray-400 text-center py-4">No appointment data</p>
          }
        </div>
      </div>

      {/* Ward occupancy */}
      {data.wardStats.length > 0 && (
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ward Bed Occupancy</p>
            <span className="text-xs font-black text-gray-700 dark:text-gray-300">{data.occupiedBeds}/{data.totalBeds} beds filled</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.wardStats.map(ward => {
              const pct = ward.total > 0 ? Math.round((ward.occupied / ward.total) * 100) : 0
              const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
              return (
                <div key={ward.name}>
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{ward.name}</span>
                    <span className="font-black text-gray-900 dark:text-white ml-2">{ward.occupied}/{ward.total} <span className={`${pct >= 90 ? 'text-red-500' : pct >= 70 ? 'text-amber-500' : 'text-emerald-500'}`}>({pct}%)</span></span>
                  </div>
                  <div className="h-3 bg-gray-100 dark:bg-[#222] rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Doctor availability */}
      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Doctor Availability Summary</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: data.totalDoctors, color: 'text-gray-900 dark:text-white', bg: 'bg-gray-50 dark:bg-[#1a1a1a]' },
            { label: 'Available', value: data.availableDoctors, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
            { label: 'Activated', value: data.activeDoctors, color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/20' },
            { label: 'Not Activated', value: data.totalDoctors - data.activeDoctors, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20' },
          ].map(item => (
            <div key={item.label} className={`${item.bg} rounded-xl p-3 text-center`}>
              <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[10px] text-gray-300 dark:text-gray-600 pb-2">
        AURA Hospital Management System · Data updates in real time
      </p>
    </div>
  )
}
