'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MdPeople, MdLocalHospital, MdMedication,
  MdHotel, MdCalendarToday, MdArrowOutward, MdBed
} from 'react-icons/md'
import { FaUserDoctor, FaHospital, FaPills, FaTicket } from 'react-icons/fa6'

interface Stats {
  doctors: number
  departments: number
  medications: number
  queueActive: number
  admittedPatients: number
  todayAppointments: number
  wardsCount: number
  bedsOccupied: number
  bedsTotal: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    doctors: 0, departments: 0, medications: 0, queueActive: 0,
    admittedPatients: 0, todayAppointments: 0, wardsCount: 0,
    bedsOccupied: 0, bedsTotal: 0,
  })
  const [recentQueue, setRecentQueue] = useState<any[]>([])
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
      const wardsArr = Array.isArray(wards) ? wards : []
      setStats({
        doctors: Array.isArray(docs) ? docs.length : 0,
        departments: Array.isArray(deps) ? deps.length : 0,
        medications: Array.isArray(meds) ? meds.length : 0,
        queueActive: Array.isArray(queue) ? queue.length : 0,
        admittedPatients: Array.isArray(patients) ? patients.length : 0,
        todayAppointments: Array.isArray(appts) ? appts.length : 0,
        wardsCount: wardsArr.length,
        bedsOccupied: wardsArr.reduce((a: number, w: any) => a + (w.occupied_beds || 0), 0),
        bedsTotal: wardsArr.reduce((a: number, w: any) => a + (w.occupied_beds || 0) + (w.available_beds || 0), 0),
      })
      setRecentQueue(Array.isArray(queue) ? queue.slice(0, 5) : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-gray-900 dark:border-white border-t-transparent animate-spin" />
      </div>
    )
  }

  const cards = [
    { label: 'Doctors', value: stats.doctors, icon: FaUserDoctor, href: '/admin/doctors', sub: 'registered' },
    { label: 'Departments', value: stats.departments, icon: FaHospital, href: '/admin/departments', sub: 'active' },
    { label: 'Queue', value: stats.queueActive, icon: FaTicket, href: '#', sub: 'waiting' },
    { label: 'Patients', value: stats.admittedPatients, icon: MdHotel, href: '/admin/patients', sub: 'admitted' },
    { label: 'Appointments', value: stats.todayAppointments, icon: MdCalendarToday, href: '/admin/appointments', sub: 'today' },
    { label: 'Medications', value: stats.medications, icon: FaPills, href: '/admin/medications', sub: 'in inventory' },
  ]

  const bedPercent = stats.bedsTotal > 0 ? Math.round((stats.bedsOccupied / stats.bedsTotal) * 100) : 0

  return (
    <div className="max-w-6xl space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(card => {
          const Icon = card.icon
          return (
            <button key={card.label}
              onClick={() => card.href !== '#' && router.push(card.href)}
              className="group text-left bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4 hover:border-gray-400 dark:hover:border-[#444] transition-all">
              <div className="flex items-center justify-between mb-3">
                <Icon className="text-gray-400 dark:text-gray-600" size={16} />
                {card.href !== '#' && <MdArrowOutward className="text-gray-300 dark:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" size={14} />}
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-0.5">{card.sub}</p>
            </button>
          )
        })}
      </div>

      {/* Two-column: Bed occupancy + Recent queue */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Bed Occupancy */}
        <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Bed Occupancy</h2>
            <button onClick={() => router.push('/admin/wards')}
              className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              View wards →
            </button>
          </div>
          <div className="flex items-end gap-4 mb-3">
            <p className="text-4xl font-bold text-gray-900 dark:text-white">{bedPercent}%</p>
            <p className="text-sm text-gray-500 pb-1">{stats.bedsOccupied}/{stats.bedsTotal} beds</p>
          </div>
          <div className="w-full h-2 bg-gray-100 dark:bg-[#222] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${bedPercent > 90 ? 'bg-red-500' : bedPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${bedPercent}%` }}
            />
          </div>
          <div className="mt-3 flex gap-4 text-xs text-gray-500">
            <span>{stats.wardsCount} wards</span>
            <span>{stats.bedsTotal - stats.bedsOccupied} available</span>
          </div>
        </div>

        {/* Recent Queue */}
        <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Active Queue</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">
              {stats.queueActive} waiting
            </span>
          </div>
          {recentQueue.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No patients in queue</p>
          ) : (
            <div className="space-y-2">
              {recentQueue.map((q: any) => (
                <div key={q.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-[#1a1a1a] last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{q.patient_name}</p>
                    <p className="text-[11px] text-gray-500">{q.department?.name || 'General'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      q.priority === 'EMERGENCY' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      : q.priority === 'URGENT' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                      : 'bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400'
                    }`}>
                      {q.priority}
                    </span>
                    <span className="text-xs font-mono text-gray-400">#{q.ticket_number}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Add Doctor', href: '/admin/doctors', icon: MdPeople },
            { label: 'Add Department', href: '/admin/departments', icon: MdLocalHospital },
            { label: 'Manage Meds', href: '/admin/medications', icon: MdMedication },
            { label: 'Wards & Beds', href: '/admin/wards', icon: MdBed },
            { label: 'Map', href: '/admin/map', icon: MdLocalHospital },
          ].map(a => {
            const Icon = a.icon
            return (
              <button key={a.label} onClick={() => router.push(a.href)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#333] text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                <Icon size={14} />
                {a.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
