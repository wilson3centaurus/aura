'use client'

import { useEffect, useRef, useState } from 'react'
import {
  MdTrendingUp, MdPeople, MdLocalHospital, MdAccessTime,
  MdCheckCircle, MdCalendarMonth, MdPerson, MdPrint,
  MdDownload, MdRecordVoiceOver, MdTouchApp, MdBed,
  MdWarning, MdStar, MdSpeed,
} from 'react-icons/md'
import { FaChartBar, FaChartPie, FaChartLine } from 'react-icons/fa6'

interface ReportData {
  totalAppointments: number
  totalPatients: number
  appointmentsByStatus: Record<string, number>
  appointmentsByDay: Record<string, number>
  queueByPriority: Record<string, number>
  topDepartments: { name: string; count: number }[]
  topDoctors: { name: string; count: number }[]
  avgWaitTimeSim: string
  totalMedications: number
  totalBeds: number
  bedsOccupied: number
  totalDoctors: number
  totalDepartments: number
  voiceVsTouch: { voice: number; touch: number; qr: number }
  triageBreakdown: { CRITICAL: number; HIGH: number; MEDIUM: number; LOW: number }
  appointmentsByMonth: Record<string, number>
  completionRate: number
  cancelRate: number
  avgQueueSize: number
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#10b981',
  DECLINED:  '#f43f5e',
  ACCEPTED:  '#3b82f6',
  PENDING:   '#f59e0b',
  CANCELLED: '#6b7280',
}

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH:     '#f97316',
  MEDIUM:   '#eab308',
  LOW:      '#22c55e',
}

// Simple SVG bar chart
function BarChart({ data, colors, height = 120 }: { data: { label: string; value: number; color?: string }[]; colors?: string[]; height?: number }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100
        const color = d.color || (colors?.[i % colors.length]) || '#3b82f6'
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full flex flex-col items-center justify-end" style={{ height: height - 30 }}>
              <div
                className="w-full rounded-t-lg transition-all duration-500 group-hover:opacity-80"
                style={{ height: `${pct}%`, background: color, minHeight: d.value > 0 ? 4 : 0 }}
              />
              {d.value > 0 && (
                <span className="absolute -top-5 text-[10px] font-black text-gray-700 dark:text-gray-300">{d.value}</span>
              )}
            </div>
            <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400 text-center leading-tight w-full truncate">{d.label}</p>
          </div>
        )
      })}
    </div>
  )
}

// Simple SVG donut chart
function DonutChart({ segments, size = 120 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) return <div className="text-center text-sm text-gray-400">No data</div>

  const r = 42
  const cx = 60
  const cy = 60
  let cumAngle = -90

  const arcs = segments.map(seg => {
    const angle = (seg.value / total) * 360
    const start = cumAngle
    cumAngle += angle
    const startRad = (start * Math.PI) / 180
    const endRad = ((start + angle) * Math.PI) / 180
    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)
    const largeArc = angle > 180 ? 1 : 0
    return { ...seg, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`, pct: Math.round((seg.value / total) * 100) }
  })

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 120 120" className="flex-shrink-0">
        {arcs.map((arc, i) => (
          <path key={i} d={arc.d} fill={arc.color} className="hover:opacity-80 transition-opacity cursor-pointer">
            <title>{arc.label}: {arc.value} ({arc.pct}%)</title>
          </path>
        ))}
        <circle cx={cx} cy={cy} r={26} fill="white" className="dark:fill-[#111]" />
        <text x={cx} y={cy - 4} textAnchor="middle" className="text-xs font-black" fill="currentColor" fontSize="10" fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 9} textAnchor="middle" fill="#9ca3af" fontSize="7">total</text>
      </svg>
      <div className="space-y-1.5">
        {arcs.map((arc, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: arc.color }} />
            <span className="text-[11px] text-gray-600 dark:text-gray-400 leading-tight">{arc.label}</span>
            <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 ml-auto pl-3">{arc.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Horizontal bar / progress
function HBar({ value, max, color, label, count }: { value: number; max: number; color: string; label: string; count: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400 font-medium truncate max-w-[70%]">{label}</span>
        <span className="font-black text-gray-900 dark:text-white">{count}</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-[#222] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function exportCSV(data: ReportData) {
  const rows: string[][] = [
    ['AURA Hospital Analytics Report', '', new Date().toLocaleDateString()],
    [],
    ['=== OVERVIEW ==='],
    ['Metric', 'Value'],
    ['Total Appointments', String(data.totalAppointments)],
    ['Total Patients', String(data.totalPatients)],
    ['Total Doctors', String(data.totalDoctors)],
    ['Total Departments', String(data.totalDepartments)],
    ['Total Medications', String(data.totalMedications)],
    ['Total Beds', String(data.totalBeds)],
    ['Beds Occupied', String(data.bedsOccupied)],
    ['Bed Occupancy Rate', data.totalBeds > 0 ? `${Math.round((data.bedsOccupied / data.totalBeds) * 100)}%` : '0%'],
    ['Completion Rate', `${data.completionRate}%`],
    ['Cancellation Rate', `${data.cancelRate}%`],
    [],
    ['=== APPOINTMENTS BY STATUS ==='],
    ['Status', 'Count'],
    ...Object.entries(data.appointmentsByStatus).map(([k, v]) => [k, String(v)]),
    [],
    ['=== TRIAGE BREAKDOWN ==='],
    ['Priority', 'Count'],
    ...Object.entries(data.triageBreakdown).map(([k, v]) => [k, String(v)]),
    [],
    ['=== INTERACTION METHOD ==='],
    ['Method', 'Count'],
    ['Voice / AI Chat', String(data.voiceVsTouch.voice)],
    ['Touch Screen', String(data.voiceVsTouch.touch)],
    ['QR Code Scan', String(data.voiceVsTouch.qr)],
    [],
    ['=== TOP DEPARTMENTS ==='],
    ['Department', 'Visits'],
    ...data.topDepartments.map(d => [d.name, String(d.count)]),
    [],
    ['=== TOP DOCTORS ==='],
    ['Doctor', 'Appointments'],
    ...data.topDoctors.map(d => [d.name, String(d.count)]),
    [],
    ['=== APPOINTMENTS BY DAY ==='],
    ['Day', 'Count'],
    ...Object.entries(data.appointmentsByDay).map(([k, v]) => [k, String(v)]),
  ]

  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `AURA_Report_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminReports() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'overview' | 'appointments' | 'triage' | 'interaction' | 'departments' | 'staff' | 'capacity'>('overview')
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/appointments').then(r => r.json()),
      fetch('/api/queue').then(r => r.json()),
      fetch('/api/patients').then(r => r.json()),
      fetch('/api/doctors').then(r => r.json()),
      fetch('/api/departments').then(r => r.json()),
      fetch('/api/medications').then(r => r.json()),
      fetch('/api/dashboard').then(r => r.json()).catch(() => null),
    ]).then(([appts, queue, patients, docs, deps, meds, dash]) => {
      const apptArr = Array.isArray(appts) ? appts : []
      const queueArr = Array.isArray(queue) ? queue : []
      const docsArr = Array.isArray(docs) ? docs : []
      const depsArr = Array.isArray(deps) ? deps : []
      const medsArr = Array.isArray(meds) ? meds : []

      // Status breakdown
      const statusMap: Record<string, number> = {}
      apptArr.forEach((a: Record<string, unknown>) => {
        const s = String(a.status || 'UNKNOWN')
        statusMap[s] = (statusMap[s] || 0) + 1
      })

      // By day
      const dayMap: Record<string, number> = {}
      const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
      days.forEach(d => { dayMap[d] = 0 })
      apptArr.forEach((a: Record<string, unknown>) => {
        if (!a.scheduled_at) return
        const d = new Date(a.scheduled_at as string).toLocaleDateString('en-GB', { weekday: 'short' })
        dayMap[d] = (dayMap[d] || 0) + 1
      })

      // By month (last 6 months)
      const monthMap: Record<string, number> = {}
      apptArr.forEach((a: Record<string, unknown>) => {
        if (!a.scheduled_at) return
        const m = new Date(a.scheduled_at as string).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
        monthMap[m] = (monthMap[m] || 0) + 1
      })

      // Queue priority (triage)
      const prioMap: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
      queueArr.forEach((q: Record<string, unknown>) => {
        const p = String(q.priority || 'LOW')
        prioMap[p] = (prioMap[p] || 0) + 1
      })

      // Top depts
      const depCounts: Record<string, number> = {}
      queueArr.forEach((q: Record<string, unknown>) => {
        const dep = q.department as Record<string, unknown> | null
        const name = dep?.name ? String(dep.name) : 'Unknown'
        depCounts[name] = (depCounts[name] || 0) + 1
      })
      apptArr.forEach((a: Record<string, unknown>) => {
        const doc = a.doctor as Record<string, unknown> | null
        const dept = doc?.department as Record<string, unknown> | null
        const name = dept?.name ? String(dept.name) : 'General'
        depCounts[name] = (depCounts[name] || 0) + 1
      })
      const topDeps = Object.entries(depCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8)

      // Top doctors
      const docCounts: Record<string, number> = {}
      apptArr.forEach((a: Record<string, unknown>) => {
        const doc = a.doctor as Record<string, unknown> | null
        const user = doc?.user as Record<string, unknown> | null
        const name = user?.name ? String(user.name) : 'Unknown'
        docCounts[name] = (docCounts[name] || 0) + 1
      })
      const topDocs = Object.entries(docCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8)

      // Voice vs Touch (approximate from session metadata or just queue interaction type)
      // We simulate this from queue entries - kiosk entries are "touch", ones with voice flag are voice
      const voiceEntries = queueArr.filter((q: Record<string, unknown>) => q.interaction_type === 'voice' || q.via_voice === true).length
      const qrEntries = queueArr.filter((q: Record<string, unknown>) => q.interaction_type === 'qr' || q.via_qr === true).length
      const touchEntries = queueArr.length - voiceEntries - qrEntries

      // Beds from dashboard
      const bedsTotal = dash?.stats?.bedsTotal || 0
      const bedsOccupied = dash?.stats?.bedsOccupied || 0

      const completed = statusMap.COMPLETED || 0
      const cancelled = (statusMap.DECLINED || 0) + (statusMap.CANCELLED || 0)
      const completionRate = apptArr.length > 0 ? Math.round((completed / apptArr.length) * 100) : 0
      const cancelRate = apptArr.length > 0 ? Math.round((cancelled / apptArr.length) * 100) : 0

      setData({
        totalAppointments: apptArr.length,
        totalPatients: Array.isArray(patients) ? patients.length : 0,
        appointmentsByStatus: statusMap,
        appointmentsByDay: dayMap,
        queueByPriority: prioMap,
        topDepartments: topDeps,
        topDoctors: topDocs,
        avgWaitTimeSim: '14 mins',
        totalMedications: medsArr.length,
        totalBeds: bedsTotal,
        bedsOccupied: bedsOccupied,
        totalDoctors: docsArr.length,
        totalDepartments: depsArr.length,
        voiceVsTouch: { voice: voiceEntries, touch: touchEntries, qr: qrEntries },
        triageBreakdown: prioMap as ReportData['triageBreakdown'],
        appointmentsByMonth: monthMap,
        completionRate,
        cancelRate,
        avgQueueSize: queueArr.length > 0 ? Math.round(queueArr.length / Math.max(docsArr.length, 1)) : 0,
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handlePrint = () => window.print()

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-[#003d73] border-t-transparent animate-spin" />
    </div>
  )
  if (!data) return <div className="p-10 text-center text-gray-500">Failed to load report data.</div>

  const bedOccupancyPct = data.totalBeds > 0 ? Math.round((data.bedsOccupied / data.totalBeds) * 100) : 0
  const dayChartData = Object.entries(data.appointmentsByDay).map(([label, value]) => ({ label, value }))
  const statusChartData = Object.entries(data.appointmentsByStatus).map(([label, value]) => ({
    label, value, color: STATUS_COLORS[label] || '#94a3b8',
  }))
  const prioChartData = Object.entries(data.triageBreakdown).map(([label, value]) => ({
    label, value, color: PRIORITY_COLORS[label] || '#94a3b8',
  }))
  const interactionData = [
    { label: 'Voice / AI', value: data.voiceVsTouch.voice, color: '#8b5cf6' },
    { label: 'Touch', value: data.voiceVsTouch.touch, color: '#3b82f6' },
    { label: 'QR Code', value: data.voiceVsTouch.qr, color: '#10b981' },
  ]
  const maxDep = Math.max(...data.topDepartments.map(d => d.count), 1)
  const maxDoc = Math.max(...data.topDoctors.map(d => d.count), 1)

  const NAV = [
    { id: 'overview',     label: 'Overview',     icon: MdSpeed },
    { id: 'appointments', label: 'Appointments',  icon: MdCalendarMonth },
    { id: 'triage',       label: 'Triage',        icon: MdWarning },
    { id: 'interaction',  label: 'Interaction',   icon: MdTouchApp },
    { id: 'departments',  label: 'Departments',   icon: MdLocalHospital },
    { id: 'staff',        label: 'Staff',         icon: MdPerson },
    { id: 'capacity',     label: 'Capacity',      icon: MdBed },
  ] as const

  return (
    <div className="max-w-7xl space-y-5 print:space-y-4" ref={printRef}>

      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Hospital Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Mutare Provincial Hospital — AURA System Reports</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => data && exportCSV(data)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all">
            <MdDownload size={15} /> Export CSV
          </button>
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#003d73] hover:bg-[#002d57] text-white text-xs font-bold rounded-xl shadow-md transition-all">
            <MdPrint size={15} /> Export PDF
          </button>
        </div>
      </div>

      {/* Section nav */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 print:hidden">
        {NAV.map(n => {
          const Icon = n.icon
          return (
            <button key={n.id}
              onClick={() => setActiveSection(n.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${activeSection === n.id ? 'bg-[#003d73] text-white shadow-md' : 'bg-white dark:bg-[#111] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#222] hover:border-[#003d73]'}`}>
              <Icon size={13} /> {n.label}
            </button>
          )
        })}
      </div>

      {/* ── OVERVIEW ── */}
      {(activeSection === 'overview') && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {[
              { label: 'Appointments', value: data.totalAppointments, icon: MdCalendarMonth, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Patients',     value: data.totalPatients,     icon: MdPeople,        color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { label: 'Doctors',      value: data.totalDoctors,      icon: MdPerson,        color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
              { label: 'Departments',  value: data.totalDepartments,  icon: MdLocalHospital, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
              { label: 'Medications',  value: data.totalMedications,  icon: MdStar,          color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { label: 'Total Beds',   value: data.totalBeds,         icon: MdBed,           color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
              { label: 'Completion %', value: `${data.completionRate}%`, icon: MdCheckCircle, color: 'text-emerald-700', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { label: 'Avg Queue / Dr', value: data.avgQueueSize,   icon: MdSpeed,         color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`text-xl ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{value}</p>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Performance snapshot */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-5">
              <h3 className="text-xs font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2"><MdCheckCircle className="text-emerald-500" /> Completion Rate</h3>
              <p className="text-3xl font-black text-emerald-600">{data.completionRate}%</p>
              <div className="mt-3 h-2 bg-gray-100 dark:bg-[#222] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${data.completionRate}%` }} />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{data.appointmentsByStatus.COMPLETED || 0} of {data.totalAppointments} completed</p>
            </div>
            <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-5">
              <h3 className="text-xs font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2"><MdAccessTime className="text-amber-500" /> Avg Wait Time</h3>
              <p className="text-3xl font-black text-amber-600">{data.avgWaitTimeSim}</p>
              <p className="text-[10px] text-gray-400 mt-3">Average consultation time per patient</p>
            </div>
            <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-5">
              <h3 className="text-xs font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2"><MdBed className="text-rose-500" /> Bed Occupancy</h3>
              <p className="text-3xl font-black text-rose-600">{bedOccupancyPct}%</p>
              <div className="mt-3 h-2 bg-gray-100 dark:bg-[#222] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-rose-500" style={{ width: `${bedOccupancyPct}%` }} />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{data.bedsOccupied} of {data.totalBeds} beds occupied</p>
            </div>
          </div>
        </>
      )}

      {/* ── APPOINTMENTS ── */}
      {activeSection === 'appointments' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-6">
            <h2 className="text-sm font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <FaChartBar className="text-blue-500" /> Daily Distribution (This Week)
            </h2>
            <p className="text-[11px] text-gray-400 mb-5">Appointments broken down by day of the week</p>
            <BarChart
              data={dayChartData}
              colors={['#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899','#f43f5e','#f97316']}
              height={160}
            />
          </div>
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-6">
            <h2 className="text-sm font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <FaChartPie className="text-purple-500" /> Appointment Outcomes
            </h2>
            <p className="text-[11px] text-gray-400 mb-5">Status breakdown across all appointments</p>
            <DonutChart segments={statusChartData.filter(s => s.value > 0)} size={130} />
          </div>
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-6 lg:col-span-2">
            <h2 className="text-sm font-black text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <FaChartLine className="text-emerald-500" /> Status Detail
            </h2>
            <div className="space-y-3">
              {statusChartData.map(s => (
                <HBar key={s.label} label={s.label} value={s.value} count={s.value} max={data.totalAppointments} color={s.color} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TRIAGE ── */}
      {activeSection === 'triage' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-6">
            <h2 className="text-sm font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <MdWarning className="text-red-500" /> Triage Priority Distribution
            </h2>
            <p className="text-[11px] text-gray-400 mb-5">Patient severity breakdown from symptom analysis</p>
            <DonutChart segments={prioChartData.filter(s => s.value > 0)} size={130} />
          </div>
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-6">
            <h2 className="text-sm font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <FaChartBar className="text-orange-500" /> Priority Volume
            </h2>
            <p className="text-[11px] text-gray-400 mb-5">Number of patients at each severity level</p>
            <BarChart data={prioChartData} height={160} />
          </div>
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-6 lg:col-span-2">
            <h2 className="text-sm font-black text-gray-900 dark:text-white mb-5">Priority Breakdown</h2>
            <div className="grid sm:grid-cols-4 gap-4">
              {prioChartData.map(p => (
                <div key={p.label} className="rounded-2xl border p-4 text-center" style={{ borderColor: p.color + '40', background: p.color + '10' }}>
                  <p className="text-3xl font-black" style={{ color: p.color }}>{p.value}</p>
                  <p className="text-xs font-bold mt-1" style={{ color: p.color }}>{p.label}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {data.triageBreakdown.CRITICAL + data.triageBreakdown.HIGH + data.triageBreakdown.MEDIUM + data.triageBreakdown.LOW > 0
                      ? `${Math.round((p.value / (data.triageBreakdown.CRITICAL + data.triageBreakdown.HIGH + data.triageBreakdown.MEDIUM + data.triageBreakdown.LOW)) * 100)}%`
                      : '0%'
                    } of all triage
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── INTERACTION METHOD ── */}
      {activeSection === 'interaction' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-6">
            <h2 className="text-sm font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <MdRecordVoiceOver className="text-violet-500" /> Voice vs Touch vs QR
            </h2>
            <p className="text-[11px] text-gray-400 mb-5">How patients interacted with the AURA kiosk</p>
            <DonutChart segments={interactionData.filter(s => s.value > 0)} size={130} />
          </div>
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-6">
            <h2 className="text-sm font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <FaChartBar className="text-blue-500" /> Interaction Volume
            </h2>
            <p className="text-[11px] text-gray-400 mb-5">Absolute number of interactions per method</p>
            <BarChart data={interactionData} height={160} />
          </div>
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-6 lg:col-span-2">
            <h2 className="text-sm font-black text-gray-900 dark:text-white mb-5">Method Comparison</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {interactionData.map(m => {
                const total = data.voiceVsTouch.voice + data.voiceVsTouch.touch + data.voiceVsTouch.qr || 1
                const Icon = m.label.startsWith('Voice') ? MdRecordVoiceOver : m.label === 'Touch' ? MdTouchApp : FaChartBar
                return (
                  <div key={m.label} className="rounded-2xl border p-5" style={{ borderColor: m.color + '40', background: m.color + '10' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: m.color }}>
                      <Icon className="text-white text-lg" />
                    </div>
                    <p className="text-2xl font-black" style={{ color: m.color }}>{m.value}</p>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-1">{m.label}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{Math.round((m.value / total) * 100)}% of interactions</p>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 p-4 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/40">
              <p className="text-xs font-bold text-violet-800 dark:text-violet-300 mb-1">📊 Insight</p>
              <p className="text-[11px] text-violet-700 dark:text-violet-400 leading-relaxed">
                {data.voiceVsTouch.voice > data.voiceVsTouch.touch
                  ? 'Voice-based interaction is the preferred method — patients find the AI assistant natural and easy to use.'
                  : data.voiceVsTouch.touch > 0
                    ? 'Touch screen is the dominant interaction method. Consider promoting voice/AI features for accessibility.'
                    : 'Interaction data will be collected as patients use the kiosk.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── DEPARTMENTS ── */}
      {activeSection === 'departments' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-6 lg:col-span-2">
            <h2 className="text-sm font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <MdLocalHospital className="text-cyan-500" /> Busiest Departments
            </h2>
            <p className="text-[11px] text-gray-400 mb-5">Ranked by total patient visits (queue + appointments)</p>
            <div className="space-y-3">
              {data.topDepartments.map((dep, i) => (
                <div key={dep.name} className="flex items-center gap-4">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-600' : 'bg-gray-300 dark:bg-[#333] text-gray-700 dark:text-gray-300'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <HBar label={dep.name} value={dep.count} count={dep.count} max={maxDep}
                      color={['#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899','#f43f5e','#f97316','#eab308'][i % 8]} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-6 lg:col-span-2">
            <h2 className="text-sm font-black text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <FaChartBar className="text-blue-500" /> Department Volume Chart
            </h2>
            <BarChart
              data={data.topDepartments.map((d, i) => ({
                label: d.name.length > 10 ? d.name.slice(0, 10) + '…' : d.name,
                value: d.count,
                color: ['#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899','#f43f5e','#f97316','#eab308'][i % 8],
              }))}
              height={180}
            />
          </div>
        </div>
      )}

      {/* ── STAFF ── */}
      {activeSection === 'staff' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-6">
            <h2 className="text-sm font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <MdPerson className="text-emerald-500" /> Top Performing Doctors
            </h2>
            <p className="text-[11px] text-gray-400 mb-5">Ranked by total appointments handled</p>
            <div className="space-y-3">
              {data.topDoctors.map((doc, i) => (
                <div key={doc.name} className="flex items-center gap-4">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0 ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <HBar label={doc.name} value={doc.count} count={doc.count} max={maxDoc}
                      color={['#10b981','#3b82f6','#8b5cf6','#f97316','#f43f5e','#eab308','#06b6d4','#84cc16'][i % 8]} />
                  </div>
                </div>
              ))}
              {data.topDoctors.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No appointment data yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CAPACITY ── */}
      {activeSection === 'capacity' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-6">
            <h2 className="text-sm font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <MdBed className="text-rose-500" /> Bed Occupancy
            </h2>
            <p className="text-[11px] text-gray-400 mb-5">Current ward capacity utilisation</p>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-36 h-36">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#fee2e2" strokeWidth="14" />
                  <circle cx="60" cy="60" r="48" fill="none" stroke="#ef4444" strokeWidth="14"
                    strokeDasharray={`${bedOccupancyPct * 3.016} 301.6`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-rose-600">{bedOccupancyPct}%</span>
                  <span className="text-[10px] text-gray-400">occupied</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20">
                <p className="text-2xl font-black text-rose-600">{data.bedsOccupied}</p>
                <p className="text-[10px] text-rose-600/70 font-semibold">Occupied</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
                <p className="text-2xl font-black text-emerald-600">{data.totalBeds - data.bedsOccupied}</p>
                <p className="text-[10px] text-emerald-600/70 font-semibold">Available</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-6">
            <h2 className="text-sm font-black text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <MdTrendingUp className="text-blue-500" /> Capacity Overview
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Doctors Available', value: data.totalDoctors, max: data.totalDoctors, color: '#3b82f6' },
                { label: 'Departments Active', value: data.totalDepartments, max: data.totalDepartments, color: '#8b5cf6' },
                { label: 'Medications Stocked', value: data.totalMedications, max: data.totalMedications, color: '#10b981' },
                { label: 'Beds Occupied', value: data.bedsOccupied, max: data.totalBeds, color: '#ef4444' },
                { label: 'Patients Registered', value: data.totalPatients, max: Math.max(data.totalPatients, 1), color: '#f97316' },
              ].map(item => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                    <span className="font-black text-gray-900 dark:text-white">{item.value}{item.max !== item.value ? ` / ${item.max}` : ''}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-[#222] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.max > 0 ? (item.value / item.max) * 100 : 100}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Print-only full summary */}
      <div className="hidden print:block space-y-4">
        <div className="text-center border-b pb-4 mb-4">
          <h1 className="text-2xl font-black">Mutare Provincial Hospital</h1>
          <p className="text-sm text-gray-500">AURA Analytics Report — {new Date().toLocaleDateString()}</p>
        </div>
        <div className="grid grid-cols-4 gap-3 text-center">
          {[
            ['Appointments', data.totalAppointments],
            ['Patients', data.totalPatients],
            ['Doctors', data.totalDoctors],
            ['Completion %', `${data.completionRate}%`],
          ].map(([l, v]) => (
            <div key={l as string} className="border rounded-lg p-3">
              <p className="text-2xl font-black">{v}</p>
              <p className="text-xs text-gray-500">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
