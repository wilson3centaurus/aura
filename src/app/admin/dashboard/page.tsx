'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Stats {
  doctors: number
  departments: number
  medications: number
  queueActive: number
  admittedPatients: number
  todayAppointments: number
  pendingAppointments: number
  wardsCount: number
  bedsOccupied: number
  bedsTotal: number
}

interface WardStat {
  id: string
  name: string
  ward_type: string
  total_beds: number
  occupied_beds: number
  available_beds: number
  nurse_in_charge: string | null
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    doctors: 0, departments: 0, medications: 0, queueActive: 0,
    admittedPatients: 0, todayAppointments: 0, pendingAppointments: 0,
    wardsCount: 0, bedsOccupied: 0, bedsTotal: 0,
  })
  const [wardStats, setWardStats] = useState<WardStat[]>([])
  const [recentQueue, setRecentQueue] = useState<any[]>([])
  const [pendingAppts, setPendingAppts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/doctors').then(r => r.json()),
      fetch('/api/departments').then(r => r.json()),
      fetch('/api/medications').then(r => r.json()),
      fetch('/api/queue?status=WAITING,CALLED,IN_PROGRESS').then(r => r.json()),
      fetch('/api/patients').then(r => r.json()),
      fetch('/api/appointments').then(r => r.json()),
      fetch('/api/wards').then(r => r.json()).catch(() => []),
    ]).then(([docs, deps, meds, queue, patients, appts, wards]) => {
      const wardsArr: WardStat[] = Array.isArray(wards) ? wards : []
      const apptArr = Array.isArray(appts) ? appts : []
      const queueArr = Array.isArray(queue) ? queue : []
      
      const upcoming = apptArr.filter((a: any) => {
        if (!a.scheduled_at) return false;
        if (a.status !== 'PENDING' && a.status !== 'ACCEPTED') return false;
        const apptDate = new Date(a.scheduled_at);
        const today = new Date();
        today.setHours(0,0,0,0);
        return apptDate >= today;
      }).sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

      // Unified Queue: Walk-ins (WAITING, CALLED, IN_PROGRESS) + Scheduled (ACCEPTED for today)
      const walkins = queueArr.map((q: any) => ({ ...q, type: 'walkin' }));
      const todayScheduled = apptArr.filter((a: any) => {
        if (a.status !== 'ACCEPTED' || !a.scheduled_at) return false;
        return new Date(a.scheduled_at).toDateString() === new Date().toDateString();
      }).map((a: any) => ({ ...a, type: 'scheduled' }));

      const unifiedQueue = [...walkins, ...todayScheduled].sort((a, b) => {
          const timeA = new Date(a.scheduled_at || a.created_at).getTime();
          const timeB = new Date(b.scheduled_at || b.created_at).getTime();
          return timeA - timeB;
      });

      setStats({
        doctors: Array.isArray(docs) ? docs.length : 0,
        departments: Array.isArray(deps) ? deps.length : 0,
        medications: Array.isArray(meds) ? meds.length : 0,
        queueActive: unifiedQueue.length,
        admittedPatients: Array.isArray(patients) ? patients.length : 0,
        todayAppointments: apptArr.filter((a: any) => new Date(a.scheduled_at).toDateString() === new Date().toDateString()).length,
        pendingAppointments: upcoming.length,
        wardsCount: wardsArr.length,
        bedsOccupied: wardsArr.reduce((a, w) => a + (w.occupied_beds || 0), 0),
        bedsTotal: wardsArr.reduce((a, w) => a + (w.total_beds || 0), 0),
      })
      setWardStats(wardsArr.slice(0, 4))
      setRecentQueue(unifiedQueue.slice(0, 10))
      setPendingAppts(upcoming.slice(0, 4))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-[#003d73] border-t-transparent animate-spin" />
      </div>
    )
  }

  const bedPercent = stats.bedsTotal > 0 ? Math.round((stats.bedsOccupied / stats.bedsTotal) * 100) : 0
  const bedColor = bedPercent > 90 ? '#ef4444' : bedPercent > 70 ? '#f59e0b' : '#10b981'

  const statCards = [
    { label: 'Doctors', value: stats.doctors, sub: 'on staff', href: '/admin/doctors', icon: '👨‍⚕️', color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' },
    { label: 'Departments', value: stats.departments, sub: 'active', href: '/admin/departments', icon: '🏥', color: 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400' },
    { label: 'Active Queue', value: stats.queueActive, sub: 'waiting', href: '#', icon: '🎫', color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400' },
    { label: 'Admitted', value: stats.admittedPatients, sub: 'patients', href: '/admin/patients', icon: '🛏️', color: 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400' },
    { label: 'Appointments', value: stats.todayAppointments, sub: 'today', href: '/admin/appointments', icon: '📅', color: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400' },
    { label: 'Upcoming', value: stats.pendingAppointments, sub: 'appointments', href: '/admin/appointments', icon: '⏳', color: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400' },
    { label: 'Medications', value: stats.medications, sub: 'in stock', href: '/admin/medications', icon: '💊', color: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' },
    { label: 'Wards', value: stats.wardsCount, sub: 'operational', href: '/admin/wards', icon: '🏨', color: 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400' },
  ]

  const wardTypeColors: Record<string, string> = {
    Medical: 'bg-blue-500', Maternity: 'bg-pink-500', Surgical: 'bg-purple-500',
    Paediatric: 'bg-green-500', Intensive: 'bg-red-500', ICU: 'bg-red-500',
    General: 'bg-gray-500',
  }

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Hospital Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Live</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {statCards.map(card => (
          <button
            key={card.label}
            onClick={() => card.href !== '#' && router.push(card.href)}
            className="group text-left bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-3.5 hover:border-gray-400 dark:hover:border-[#444] hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${card.color}`}>
                {card.icon}
              </span>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{card.value}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1 font-medium">{card.label}</p>
          </button>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Bed occupancy - span 1 */}
        <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Bed Occupancy</h2>
            <button onClick={() => router.push('/admin/wards')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              Manage →
            </button>
          </div>

          {/* Donut chart (CSS) */}
          <div className="flex items-center justify-center mb-5">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" className="dark:stroke-[#222]" strokeWidth="12" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={bedColor}
                  strokeWidth="12"
                  strokeDasharray={`${bedPercent * 2.513} 251.3`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-gray-900 dark:text-white">{bedPercent}%</span>
                <span className="text-[10px] text-gray-500">occupied</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30">
              <p className="text-lg font-black text-red-600 dark:text-red-400">{stats.bedsOccupied}</p>
              <p className="text-[10px] text-red-500 dark:text-red-500 font-medium">Occupied</p>
            </div>
            <div className="text-center p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{stats.bedsTotal - stats.bedsOccupied}</p>
              <p className="text-[10px] text-emerald-500 dark:text-emerald-500 font-medium">Available</p>
            </div>
          </div>

          {/* Ward breakdown */}
          <div className="mt-4 space-y-2">
            {wardStats.map(w => {
              const pct = w.total_beds > 0 ? Math.round((w.occupied_beds / w.total_beds) * 100) : 0
              const col = wardTypeColors[w.ward_type] || 'bg-gray-500'
              return (
                <div key={w.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-700 dark:text-gray-300 font-medium truncate">{w.name}</span>
                    <span className="text-gray-400 ml-2 flex-shrink-0">{w.occupied_beds}/{w.total_beds}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-[#222] rounded-full overflow-hidden">
                    <div className={`h-full ${col} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Active Queue - span 1 */}
        <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Active Queue</h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {stats.queueActive} live
            </span>
          </div>

          {recentQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <span className="text-4xl mb-2">🎫</span>
              <p className="text-sm">No patients in queue</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentQueue.map((q: any, i) => {
                const isScheduled = q.type === 'scheduled';
                return (
                  <div key={q.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-[#1a1a1a] last:border-0">
                    <span className={`w-7 h-7 rounded-lg text-[10px] font-black flex items-center justify-center flex-shrink-0 ${
                      isScheduled ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-[#222] text-gray-500 dark:text-gray-400'
                    }`}>
                      {isScheduled ? '📅' : `#${q.ticket_number}`}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{q.patient_name || q.patientName}</p>
                      <div className="flex items-center text-[10px] text-gray-400 truncate gap-1 mt-0.5">
                        <span className="truncate">{q.department?.name || (isScheduled ? 'Appointment' : '')}</span>
                        {(q.doctor?.user?.name || q.doctor?.name) && (
                           <>
                             <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                             <span className="truncate font-medium text-blue-500/80">Dr. {q.doctor?.user?.name || q.doctor?.name}</span>
                           </>
                        )}
                      </div>
                    </div>
                    {isScheduled ? (
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                        {new Date(q.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex-shrink-0 ${
                        q.priority === 'EMERGENCY' ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400'
                        : q.priority === 'URGENT' ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                        : 'bg-gray-100 dark:bg-[#222] text-gray-500'
                      }`}>
                        {q.priority}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending appointments - span 1 */}
        <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Upcoming Appointments</h2>
            {stats.pendingAppointments > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                {stats.pendingAppointments}
              </span>
            )}
          </div>

          {pendingAppts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <span className="text-4xl mb-2">📅</span>
              <p className="text-sm">All appointments handled</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingAppts.map((a: any) => (
                <div key={a.id} className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">{a.patient_name}</p>
                  <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">To: Dr. {a.doctor?.user?.name || 'Unknown'}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{a.symptoms || 'No symptoms listed'}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(a.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      a.status === 'ACCEPTED' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' :
                      'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
                    }`}>
                      {a.status === 'ACCEPTED' ? 'ACCEPTED' : 'PENDING DOCTOR'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => router.push('/admin/appointments')}
            className="w-full mt-3 py-2 rounded-lg border border-gray-200 dark:border-[#222] text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
          >
            View all appointments →
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '+ Add Doctor', href: '/admin/doctors' },
            { label: '+ Add Department', href: '/admin/departments' },
            { label: '+ Manage Medications', href: '/admin/medications' },
            { label: '+ Wards & Beds', href: '/admin/wards' },
            { label: '+ Update Fees', href: '/admin/fees' },
            { label: '+ Map Pins', href: '/admin/map' },
          ].map(a => (
            <button key={a.label} onClick={() => router.push(a.href)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-[#333] text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
