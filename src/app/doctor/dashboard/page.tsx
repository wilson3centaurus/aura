'use client'

import { useEffect, useState } from 'react'

interface DoctorProfile {
  id: string
  specialty: string
  status: string
  room_number: string | null
  department: { name: string }
  user: { name: string; email: string }
}

interface QueueItem {
  id: string
  ticket_number: number
  patient_name: string
  status: string
  priority: string
  created_at: string
}

interface Appointment {
  id: string
  patient_name: string
  date: string
  time: string
  status: string
  reason: string | null
}

export default function DoctorDashboard() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const loadData = async () => {
    try {
      const [docRes, queueRes, apptRes] = await Promise.all([
        fetch('/api/doctors/me'),
        fetch('/api/queue?mine=true'),
        fetch('/api/appointments?mine=true'),
      ])
      if (docRes.ok) setProfile(await docRes.json())
      if (queueRes.ok) setQueue(await queueRes.json())
      if (apptRes.ok) setAppointments(await apptRes.json())
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [])

  const updateStatus = async (newStatus: string) => {
    if (!profile) return
    setStatusUpdating(true)
    try {
      await fetch(`/api/doctors/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      setProfile({ ...profile, status: newStatus })
    } catch {}
    setStatusUpdating(false)
  }

  const updateQueueItem = async (id: string, status: string) => {
    try {
      await fetch(`/api/queue/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      loadData()
    } catch {}
  }

  const statuses = ['AVAILABLE', 'BUSY', 'ON_BREAK', 'OFFLINE']
  const statusColors: Record<string, string> = {
    AVAILABLE: 'bg-emerald-500',
    BUSY: 'bg-amber-500',
    ON_BREAK: 'bg-blue-500',
    OFFLINE: 'bg-gray-500',
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 rounded-full border-2 border-gray-900 dark:border-white border-t-transparent animate-spin" /></div>

  const waiting = queue.filter(q => q.status === 'WAITING').length
  const inProgress = queue.filter(q => q.status === 'IN_PROGRESS').length

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          Welcome, Dr. {profile?.user.name || 'Doctor'}
        </h1>
        <p className="text-xs text-gray-500">
          {profile?.specialty} &middot; {profile?.department.name} {profile?.room_number && `· Room ${profile.room_number}`}
        </p>
      </div>

      {/* Status Toggle */}
      <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
        <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-2">My Status</p>
        <div className="flex gap-1.5">
          {statuses.map(s => (
            <button key={s} onClick={() => updateStatus(s)} disabled={statusUpdating}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${profile?.status === s
                ? `${statusColors[s]} text-white`
                : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#222]'}`}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
          <p className="text-[11px] text-gray-500">Queue</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{waiting}</p>
          <p className="text-[11px] text-gray-400">waiting</p>
        </div>
        <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
          <p className="text-[11px] text-gray-500">In Progress</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{inProgress}</p>
          <p className="text-[11px] text-gray-400">with you now</p>
        </div>
        <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4">
          <p className="text-[11px] text-gray-500">Appointments</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{appointments.length}</p>
          <p className="text-[11px] text-gray-400">today</p>
        </div>
      </div>

      {/* Patient Queue */}
      <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-[#222]">
          <h2 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Patient Queue</h2>
        </div>
        {queue.filter(q => q.status !== 'COMPLETED').length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-[#1a1a1a]">
            {queue.filter(q => q.status !== 'COMPLETED').map(item => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="text-center min-w-[40px]">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">#{item.ticket_number}</span>
                  <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${item.priority === 'EMERGENCY' ? 'bg-red-500' : item.priority === 'URGENT' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[13px] text-gray-900 dark:text-white truncate">{item.patient_name}</p>
                  <p className="text-[11px] text-gray-400">{new Date(item.created_at).toLocaleTimeString()}</p>
                </div>
                <div className="flex gap-1">
                  {item.status === 'WAITING' && (
                    <button onClick={() => updateQueueItem(item.id, 'CALLED')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-semibold hover:bg-emerald-600 transition-all">
                      Call
                    </button>
                  )}
                  {item.status === 'CALLED' && (
                    <button onClick={() => updateQueueItem(item.id, 'IN_PROGRESS')}
                      className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-[11px] font-semibold hover:bg-blue-600 transition-all">
                      Start
                    </button>
                  )}
                  {(item.status === 'CALLED' || item.status === 'IN_PROGRESS') && (
                    <button onClick={() => updateQueueItem(item.id, 'COMPLETED')}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400 text-[11px] font-semibold hover:bg-gray-200 dark:hover:bg-[#333] transition-all">
                      Done
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-gray-400">No patients in queue</p>
        )}
      </div>

      {/* Appointments */}
      <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-[#222]">
          <h2 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Today&apos;s Appointments</h2>
        </div>
        {appointments.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-[#1a1a1a]">
            {appointments.map(appt => (
              <div key={appt.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium text-[13px] text-gray-900 dark:text-white">{appt.patient_name}</p>
                  <p className="text-[11px] text-gray-400">{appt.time} {appt.reason && `· ${appt.reason}`}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                  appt.status === 'COMPLETED' ? 'bg-gray-100 text-gray-500 dark:bg-[#222] dark:text-gray-400'
                  : appt.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                  : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                }`}>
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-gray-400">No appointments today</p>
        )}
      </div>
    </div>
  )
}
