'use client'

import { useEffect, useState, useCallback } from 'react'

interface DoctorProfile {
  id: string
  specialty: string
  status: string
  room_number: string | null
  department: { name: string }
  user: { name: string; email: string }
}

interface Appointment {
  id: string
  patient_name: string
  patient_phone: string | null
  symptoms: string | null
  status: string
  scheduled_at: string | null
  decline_reason: string | null
  created_at: string
  notes: string | null
}

interface QueueItem {
  id: string
  ticket_number: number
  patient_name: string
  status: string
  priority: string
  symptoms: string | null
  created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string }> = {
  AVAILABLE: { label: 'Available', dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  BUSY:      { label: 'Busy',      dot: 'bg-amber-500',  bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  ON_BREAK:  { label: 'On Break',  dot: 'bg-blue-500',   bg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  OFFLINE:   { label: 'Offline',   dot: 'bg-gray-400',   bg: 'bg-gray-50 dark:bg-[#222] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#333]' },
}

const DECLINE_REASONS = [
  'Not available at that time',
  'Outside my specialty',
  'Patient needs emergency care',
  'Fully booked for the day',
  'On scheduled break',
  'Patient referred elsewhere',
  'Administrative issue',
  'Other (see message)',
]

export default function DoctorDashboard() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)
  const [actionMode, setActionMode] = useState<'accept' | 'decline' | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [declineCustom, setDeclineCustom] = useState('')
  const [acceptTime, setAcceptTime] = useState<'now' | 'custom'>('now')
  const [acceptDateTime, setAcceptDateTime] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [docRes, apptRes, queueRes] = await Promise.all([
        fetch('/api/doctors/me'),
        fetch('/api/appointments?mine=true'),
        fetch('/api/queue?mine=true'),
      ])
      if (docRes.ok) setProfile(await docRes.json())
      if (apptRes.ok) setAppointments(await apptRes.json())
      if (queueRes.ok) setQueue(await queueRes.json())
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [loadData])

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

  const handleAction = async () => {
    if (!selectedAppt || !actionMode) return
    setActionLoading(true)
    try {
      if (actionMode === 'accept') {
        const scheduledAt = acceptTime === 'custom' && acceptDateTime
          ? new Date(acceptDateTime).toISOString()
          : new Date().toISOString()
        await fetch(`/api/appointments/${selectedAppt.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ACCEPTED', scheduledAt }),
        })
      } else {
        const reason = declineReason + (declineCustom ? ` â€” ${declineCustom}` : '')
        await fetch(`/api/appointments/${selectedAppt.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'DECLINED', declineReason: reason }),
        })
      }
      setSelectedAppt(null)
      setActionMode(null)
      setDeclineReason('')
      setDeclineCustom('')
      setAcceptTime('now')
      setAcceptDateTime('')
      loadData()
    } catch {}
    setActionLoading(false)
  }

  const updateQueue = async (id: string, status: string) => {
    await fetch(`/api/queue/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    loadData()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-[#0a4f3f] border-t-transparent animate-spin" />
    </div>
  )

  const pending = appointments.filter(a => a.status === 'PENDING')
  const accepted = appointments.filter(a => a.status === 'ACCEPTED')
  const waitingQueue = queue.filter(q => q.status === 'WAITING')
  const inProgressQueue = queue.filter(q => q.status === 'IN_PROGRESS')
  const sc = STATUS_CONFIG[profile?.status || 'AVAILABLE'] || STATUS_CONFIG.OFFLINE

  return (
    <div className="max-w-5xl space-y-5">

      {/* Doctor header card */}
      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mb-1">CLINICAL WORKSTATION</p>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">{profile?.user.name || 'Doctor'}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {profile?.specialty} Â· {profile?.department.name}
              {profile?.room_number && ` Â· Room ${profile.room_number}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {/* Current status badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${sc.bg}`}>
              <span className={`w-2 h-2 rounded-full ${sc.dot} ${profile?.status === 'AVAILABLE' ? 'animate-pulse' : ''}`} />
              {sc.label}
            </div>
            {pending.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs font-bold animate-pulse">
                ðŸ”” {pending.length} new request{pending.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Status switcher */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => updateStatus(key)}
              disabled={statusUpdating || profile?.status === key}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                profile?.status === key
                  ? cfg.bg
                  : 'bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-[#555]'
              } disabled:opacity-60`}
            >
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${cfg.dot}`} />
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Pending Requests', value: pending.length, color: 'text-rose-600 dark:text-rose-400' },
          { label: 'Accepted Today', value: accepted.length, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'In Queue', value: waitingQueue.length, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'In Progress', value: inProgressQueue.length, color: 'text-blue-600 dark:text-blue-400' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4 text-center">
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Two column */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Appointment Requests */}
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Appointment Requests</h2>
            {pending.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold animate-pulse">
                {pending.length} PENDING
              </span>
            )}
          </div>

          {appointments.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <span className="text-4xl mb-2">ðŸ“­</span>
              <p className="text-sm">No appointment requests</p>
            </div>
          ) : (
            <div className="space-y-2">
              {appointments.slice(0, 6).map(a => {
                const statusStyles: Record<string, string> = {
                  PENDING: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800',
                  ACCEPTED: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800',
                  DECLINED: 'bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333]',
                }
                return (
                  <div key={a.id} className={`flex items-start gap-3 p-3 rounded-xl border ${statusStyles[a.status] || 'bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333]'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{a.patient_name}</p>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase flex-shrink-0 ${
                          a.status === 'PENDING' ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'
                          : a.status === 'ACCEPTED' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                          : 'bg-gray-200 dark:bg-[#333] text-gray-600 dark:text-gray-400'
                        }`}>
                          {a.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">{a.symptoms || 'No symptoms provided'}</p>
                      {a.patient_phone && <p className="text-[10px] text-gray-400">ðŸ“ž {a.patient_phone}</p>}
                      {a.status === 'ACCEPTED' && a.scheduled_at && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                          ðŸ• {new Date(a.scheduled_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      {a.status === 'DECLINED' && a.decline_reason && (
                        <p className="text-[10px] text-gray-400 mt-0.5 italic">"{a.decline_reason}"</p>
                      )}
                    </div>

                    {a.status === 'PENDING' && (
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button
                          onClick={() => { setSelectedAppt(a); setActionMode('accept') }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => { setSelectedAppt(a); setActionMode('decline') }}
                          className="px-2.5 py-1 rounded-lg bg-gray-200 dark:bg-[#333] hover:bg-red-100 dark:hover:bg-red-950/40 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-[10px] font-bold transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Patient Queue */}
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Patient Queue</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold">
              {waitingQueue.length} waiting
            </span>
          </div>

          {queue.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <span className="text-4xl mb-2">ðŸŽ«</span>
              <p className="text-sm">Queue is empty</p>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.slice(0, 6).map(q => (
                <div key={q.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#222]">
                  <span className={`w-7 h-7 rounded-lg text-[10px] font-black flex items-center justify-center flex-shrink-0 ${
                    q.priority === 'EMERGENCY' ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400'
                    : q.priority === 'URGENT' ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                    : 'bg-gray-200 dark:bg-[#333] text-gray-600 dark:text-gray-400'
                  }`}>
                    #{q.ticket_number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{q.patient_name}</p>
                    {q.symptoms && <p className="text-[10px] text-gray-400 truncate">{q.symptoms}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {q.status === 'WAITING' && (
                      <button onClick={() => updateQueue(q.id, 'IN_PROGRESS')}
                        className="px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white text-[9px] font-bold transition-colors">
                        Start
                      </button>
                    )}
                    {q.status === 'IN_PROGRESS' && (
                      <button onClick={() => updateQueue(q.id, 'COMPLETED')}
                        className="px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-bold transition-colors">
                        Done
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Accept / Decline Modal */}
      {selectedAppt && actionMode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-200 dark:border-[#282828] shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">
              {actionMode === 'accept' ? 'âœ… Accept Appointment' : 'âŒ Decline Appointment'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Patient: <strong>{selectedAppt.patient_name}</strong>
              {selectedAppt.symptoms && <> Â· {selectedAppt.symptoms}</>}
            </p>

            {actionMode === 'accept' ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">When would you like to see this patient?</p>
                <div className="flex gap-2">
                  {(['now', 'custom'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setAcceptTime(t)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        acceptTime === t
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:border-emerald-400'
                      }`}
                    >
                      {t === 'now' ? 'ðŸŸ¢ Right Now' : 'ðŸ“… Custom Time'}
                    </button>
                  ))}
                </div>
                {acceptTime === 'custom' && (
                  <input
                    type="datetime-local"
                    value={acceptDateTime}
                    onChange={e => setAcceptDateTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Reason for declining</p>
                <select
                  value={declineReason}
                  onChange={e => setDeclineReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  <option value="">Select reason...</option>
                  {DECLINE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <input
                  type="text"
                  value={declineCustom}
                  onChange={e => setDeclineCustom(e.target.value)}
                  placeholder="Additional message (optional)"
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400 placeholder-gray-400"
                />
              </div>
            )}

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => { setSelectedAppt(null); setActionMode(null) }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={actionLoading || (actionMode === 'decline' && !declineReason) || (actionMode === 'accept' && acceptTime === 'custom' && !acceptDateTime)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50 ${
                  actionMode === 'accept' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin" />
                    Processing...
                  </span>
                ) : actionMode === 'accept' ? 'Confirm Accept' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
