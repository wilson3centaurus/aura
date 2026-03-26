'use client'

import { useEffect, useState, useCallback } from 'react'

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
  doctor?: { user: { name: string } } | null
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

const STATUS_STYLES: Record<string, string> = {
  PENDING:  'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  ACCEPTED: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  DECLINED: 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-500 border-gray-200 dark:border-[#333]',
}

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [actionMode, setActionMode] = useState<'accept' | 'decline' | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [declineCustom, setDeclineCustom] = useState('')
  const [acceptTime, setAcceptTime] = useState<'now' | 'custom'>('now')
  const [acceptDateTime, setAcceptDateTime] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = useCallback(async () => {
    // Fetch mine=true gives today only; fetch all and filter by doctor id
    const [profileRes, allRes] = await Promise.all([
      fetch('/api/doctors/me'),
      fetch('/api/appointments'),
    ])
    if (profileRes.ok && allRes.ok) {
      const profile = await profileRes.json()
      const all: Appointment[] = await allRes.json()
      const mine = all.filter((a: any) => a.doctor_id === profile.id)
      setAppointments(mine.sort((a: Appointment, b: Appointment) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 15000)
    return () => clearInterval(interval)
  }, [loadData])

  const handleAction = async () => {
    if (!selected || !actionMode) return
    setActionLoading(true)
    try {
      if (actionMode === 'accept') {
        const scheduledAt = acceptTime === 'custom' && acceptDateTime
          ? new Date(acceptDateTime).toISOString()
          : new Date().toISOString()
        await fetch(`/api/appointments/${selected.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ACCEPTED', scheduledAt }),
        })
      } else {
        const reason = declineReason + (declineCustom ? `  ${declineCustom}` : '')
        await fetch(`/api/appointments/${selected.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'DECLINED', declineReason: reason }),
        })
      }
      closeModal()
      loadData()
    } catch {}
    setActionLoading(false)
  }

  const closeModal = () => {
    setSelected(null)
    setActionMode(null)
    setDeclineReason('')
    setDeclineCustom('')
    setAcceptTime('now')
    setAcceptDateTime('')
  }

  const filtered = appointments.filter(a => {
    if (filter === 'pending') return a.status === 'PENDING'
    if (filter === 'accepted') return a.status === 'ACCEPTED'
    if (filter === 'declined') return a.status === 'DECLINED'
    return true
  })

  const counts = {
    all: appointments.length,
    pending: appointments.filter(a => a.status === 'PENDING').length,
    accepted: appointments.filter(a => a.status === 'ACCEPTED').length,
    declined: appointments.filter(a => a.status === 'DECLINED').length,
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-[#0a4f3f] border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">My Appointments</h1>
          <p className="text-xs text-gray-500 mt-0.5">All patient appointment requests</p>
        </div>
        {counts.pending > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs font-bold animate-pulse">
            🔔 {counts.pending} pending
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-[#111] rounded-xl w-fit flex-wrap">
        {[
          { key: 'all', label: `All (${counts.all})` },
          { key: 'pending', label: `Pending (${counts.pending})` },
          { key: 'accepted', label: `Accepted (${counts.accepted})` },
          { key: 'declined', label: `Declined (${counts.declined})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === tab.key
                ? 'bg-white dark:bg-[#222] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <span className="text-4xl mb-3">📅</span>
            <p className="text-sm">No appointments {filter !== 'all' ? `with status "${filter}"` : 'yet'}</p>
          </div>
        ) : (
          filtered.map(a => (
            <div key={a.id}
              className={`p-4 rounded-2xl border transition-all ${
                a.status === 'PENDING' ? 'bg-rose-50 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/30'
                : a.status === 'ACCEPTED' ? 'bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/30'
                : 'bg-white dark:bg-[#111] border-gray-200 dark:border-[#222]'
              }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{a.patient_name}</p>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${STATUS_STYLES[a.status] || STATUS_STYLES.DECLINED}`}>
                      {a.status}
                    </span>
                  </div>

                  {a.patient_phone && (
                    <p className="text-[11px] text-gray-500 mt-1">📞 {a.patient_phone}</p>
                  )}
                  {a.symptoms && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">"{a.symptoms}"</p>
                  )}

                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-[10px] text-gray-400">
                      Requested {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {a.status === 'ACCEPTED' && a.scheduled_at && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        📅 {new Date(a.scheduled_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {a.status === 'DECLINED' && a.decline_reason && (
                      <span className="text-[11px] text-gray-400 italic">Reason: {a.decline_reason}</span>
                    )}
                  </div>
                </div>

                {a.status === 'PENDING' && (
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setSelected(a); setActionMode('accept') }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold transition-colors">
                      Accept
                    </button>
                    <button
                      onClick={() => { setSelected(a); setActionMode('decline') }}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-900 text-[11px] font-bold transition-colors">
                      Decline
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Accept/Decline Modal */}
      {selected && actionMode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-200 dark:border-[#282828] shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">
              {actionMode === 'accept' ? '✅ Accept Appointment' : '❌ Decline Appointment'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Patient: <strong>{selected.patient_name}</strong>
              {selected.symptoms && <> · {selected.symptoms}</>}
            </p>

            {actionMode === 'accept' ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">When would you like to see this patient?</p>
                <div className="flex gap-2">
                  {(['now', 'custom'] as const).map(t => (
                    <button key={t} onClick={() => setAcceptTime(t)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        acceptTime === t
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:border-emerald-400'
                      }`}>
                      {t === 'now' ? '⚡ Right Now' : '📅 Custom Time'}
                    </button>
                  ))}
                </div>
                {acceptTime === 'custom' && (
                  <input type="datetime-local" value={acceptDateTime}
                    onChange={e => setAcceptDateTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Reason for declining</p>
                <select value={declineReason} onChange={e => setDeclineReason(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400">
                  <option value="">Select reason...</option>
                  {DECLINE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <input type="text" value={declineCustom} onChange={e => setDeclineCustom(e.target.value)}
                  placeholder="Additional message (optional)"
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400 placeholder-gray-400" />
              </div>
            )}

            <div className="flex gap-2 mt-5">
              <button onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                Cancel
              </button>
              <button onClick={handleAction}
                disabled={actionLoading || (actionMode === 'decline' && !declineReason) || (actionMode === 'accept' && acceptTime === 'custom' && !acceptDateTime)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50 ${
                  actionMode === 'accept' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
                }`}>
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
