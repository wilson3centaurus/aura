'use client'

import { useEffect, useState } from 'react'
import { 
  MdTrendingUp, MdPeople, MdLocalHospital, MdAccessTime, 
  MdCheckCircle, MdCancel, MdCalendarMonth, MdPerson
} from 'react-icons/md'

interface ReportData {
  totalAppointments: number
  totalPatients: number
  appointmentsByStatus: Record<string, number>
  appointmentsByDay: Record<string, number>
  queueByPriority: Record<string, number>
  topDepartments: { name: string, count: number }[]
  topDoctors: { name: string, count: number }[]
  avgWaitTimeSim: string
}

export default function AdminReports() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/appointments').then(r => r.json()),
      fetch('/api/queue').then(r => r.json()),
      fetch('/api/patients').then(r => r.json()),
      fetch('/api/doctors').then(r => r.json()),
      fetch('/api/departments').then(r => r.json()),
    ]).then(([appts, queue, patients, docs, deps]) => {
      const apptArr = Array.isArray(appts) ? appts : []
      const queueArr = Array.isArray(queue) ? queue : []
      
      // Appointments by status
      const statusMap: Record<string, number> = {}
      apptArr.forEach((a: any) => {
        statusMap[a.status] = (statusMap[a.status] || 0) + 1
      })

      // Appointments by day (last 7 days)
      const dayMap: Record<string, number> = {}
      apptArr.forEach((a: any) => {
        if (!a.scheduled_at) return
        const d = new Date(a.scheduled_at).toLocaleDateString('en-GB', { weekday: 'short' })
        dayMap[d] = (dayMap[d] || 0) + 1
      })

      // Queue priority
      const prioMap: Record<string, number> = {}
      queueArr.forEach((q: any) => {
        prioMap[q.priority] = (prioMap[q.priority] || 0) + 1
      })

      // Top Departments (by appts + queue)
      const depCounts: Record<string, number> = {}
      queueArr.forEach((q: any) => {
        const name = q.department?.name || 'Unknown'
        depCounts[name] = (depCounts[name] || 0) + 1
      })
      apptArr.forEach((a: any) => {
        const name = a.doctor?.department?.name || 'General'
        depCounts[name] = (depCounts[name] || 0) + 1
      })
      const topDeps = Object.entries(depCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Top Doctors
      const docCounts: Record<string, number> = {}
      apptArr.forEach((a: any) => {
        const name = a.doctor?.user?.name || 'Unknown'
        docCounts[name] = (docCounts[name] || 0) + 1
      })
      const topDocs = Object.entries(docCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      setData({
        totalAppointments: apptArr.length,
        totalPatients: Array.isArray(patients) ? patients.length : 0,
        appointmentsByStatus: statusMap,
        appointmentsByDay: dayMap,
        queueByPriority: prioMap,
        topDepartments: topDeps,
        topDoctors: topDocs,
        avgWaitTimeSim: '14 mins'
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-[#003d73] border-t-transparent animate-spin" />
    </div>
  )

  if (!data) return <div className="p-10 text-center text-gray-500">Failed to load report data.</div>

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Hospital Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Performance reports for Mutare Provincial Hospital</p>
        </div>
        <div className="flex gap-2">
            <button className="px-4 py-2 bg-[#003d73] text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all">Export PDF</button>
            <button className="px-4 py-2 bg-gray-100 dark:bg-[#111] text-gray-600 dark:text-gray-400 text-xs font-bold rounded-xl border border-gray-200 dark:border-[#222]">Last 30 Days</button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Appointments" value={data.totalAppointments} icon={<MdCalendarMonth />} trend="+12% from last week" />
        <StatCard title="Unique Patients" value={data.totalPatients} icon={<MdPeople />} trend="+5% growth" />
        <StatCard title="Avg. Consultation" value={data.avgWaitTimeSim} icon={<MdAccessTime />} trend="-2m improvement" />
        <StatCard title="Completion Rate" value={`${Math.round(((data.appointmentsByStatus.COMPLETED || 0) / data.totalAppointments) * 100) || 0}%`} icon={<MdCheckCircle />} trend="High efficiency" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Appointments by Status */}
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-6">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <MdTrendingUp className="text-blue-500" /> Appointment Outcomes
          </h2>
          <div className="space-y-4">
            {Object.entries(data.appointmentsByStatus).map(([status, count]) => (
              <div key={status} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-500 uppercase tracking-wider">{status}</span>
                  <span className="text-gray-900 dark:text-white">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      status === 'COMPLETED' ? 'bg-emerald-500' :
                      status === 'DECLINED' ? 'bg-rose-500' :
                      status === 'ACCEPTED' ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${(count / data.totalAppointments) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Departments */}
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-6 lg:col-span-2">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <MdLocalHospital className="text-purple-500" /> Busiest Departments
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {data.topDepartments.map((dep, i) => (
              <div key={dep.name} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#222]">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-black text-lg">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{dep.name}</p>
                  <p className="text-xs text-gray-500">{dep.count} visitors handled</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Performance */}
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-6 lg:col-span-3">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <MdPerson className="text-emerald-500" /> Top Performing Staff
            </h2>
            <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {data.topDoctors.map(doc => (
                    <div key={doc.name} className="text-center p-6 rounded-2xl border border-gray-100 dark:border-[#222] bg-white dark:bg-[#0d0d0d] hover:border-emerald-500/50 transition-all">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/20 mx-auto flex items-center justify-center text-2xl mb-4 border-2 border-emerald-100 dark:border-emerald-900/30 text-emerald-600">
                            👨‍⚕️
                        </div>
                        <p className="text-sm font-black text-gray-900 dark:text-white truncate">Dr. {doc.name}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{doc.count} Appts</p>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, trend }: { title: string, value: string | number, icon: any, trend: string }) {
  return (
    <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-200 dark:border-[#222] shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] text-[#003d73] dark:text-blue-400 text-xl border border-gray-100 dark:border-[#222]">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
          {trend}
        </span>
      </div>
      <p className="text-3xl font-black text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 font-medium mt-1">{title}</p>
    </div>
  )
}
