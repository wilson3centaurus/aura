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
  completed_at?: string | null
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

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtDateShort(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [historyFilter, setHistoryFilter] = useState<'accepted' | 'declined' | 'completed'>('accepted')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Accept/Decline modal
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [actionMode, setActionMode] = useState<'accept' | 'decline' | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [declineCustom, setDeclineCustom] = useState('')
  const [acceptTime, setAcceptTime] = useState<'now' | 'custom'>('now')
  const [acceptDateTime, setAcceptDateTime] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = useCallback(async () => {
    const [profileRes, allRes] = await Promise.all([
      fetch('/api/doctors/me'),
      fetch('/api/appointments'),
    ])
    if (profileRes.ok && allRes.ok) {
      const profile = await profileRes.json()
      const all: Appointment[] = await allRes.json()
      const mine = all.filter((a: any) => a.doctor_id === profile.id)
      setAppointments(mine.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 25000) // reduced interval
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
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ACCEPTED', scheduledAt }),
        })
      } else {
        const reason = declineReason + (declineCustom ? ` — ${declineCustom}` : '')
        await fetch(`/api/appointments/${selected.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'DECLINED', declineReason: reason }),
        })
      }
      closeModal()
      loadData()
    } catch {}
    setActionLoading(false)
  }

  const closeModal = () => {
    setSelected(null); setActionMode(null)
    setDeclineReason(''); setDeclineCustom('')
    setAcceptTime('now'); setAcceptDateTime('')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-[#003d73] border-t-transparent animate-spin" />
    </div>
  )

  const pending = appointments.filter(a => a.status === 'PENDING')
  const history = appointments.filter(a => {
    if (historyFilter === 'accepted') return a.status === 'ACCEPTED'
    if (historyFilter === 'declined') return a.status === 'DECLINED'
    if (historyFilter === 'completed') return a.status === 'COMPLETED'
    return false
  })

  const counts = {
    pending: pending.length,
    accepted: appointments.filter(a => a.status === 'ACCEPTED').length,
    declined: appointments.filter(a => a.status === 'DECLINED').length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
  }

  return (
    <div className="max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Appointments</h1>
          <p className="text-xs text-gray-500 mt-0.5">{appointments.length} total · {counts.pending} pending</p>
        </div>
        {counts.pending > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs font-bold animate-pulse">
            🔔 {counts.pending} pending
          </span>
        )}
      </div>

      {/* Side-by-side layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 items-start">

        {/* ── LEFT: History ── */}
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#222]">
            <h2 className="text-sm font-black text-gray-900 dark:text-white mb-3">Appointment History</h2>
            <div className="flex gap-1 p-1 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl w-fit">
              {[
                { key: 'accepted', label: `Accepted (${counts.accepted})` },
                { key: 'completed', label: `Completed (${counts.completed})` },
                { key: 'declined', label: `Declined (${counts.declined})` },
              ].map(tab => (
                <button key={tab.key} onClick={() => setHistoryFilter(tab.key as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    historyFilter === tab.key
                      ? 'bg-white dark:bg-[#222] text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-[#222] max-h-[calc(100vh-280px)] overflow-y-auto">
            {history.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <span className="text-4xl mb-3">📋</span>
                <p className="text-sm">No {historyFilter} appointments</p>
              </div>
            ) : history.map(a => (
              <div key={a.id} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-[#0f0f0f] transition-colors cursor-pointer"
                onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{a.patient_name}</p>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                        a.status === 'ACCEPTED' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                        : a.status === 'COMPLETED' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-[#222] text-gray-500'
                      }`}>
                        {a.status}
                      </span>
                    </div>

                    {a.patient_phone && <p className="text-[11px] text-gray-400 mt-0.5">📞 {a.patient_phone}</p>}
                    {a.symptoms && <p className="text-xs text-gray-500 italic mt-0.5 truncate">"{a.symptoms}"</p>}

                    <div className="flex flex-wrap gap-3 mt-1.5">
                      <span className="text-[10px] text-gray-400">Requested {fmtDateShort(a.created_at)}</span>
                      {a.scheduled_at && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          📅 {fmtDate(a.scheduled_at)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-300 dark:text-gray-600 text-xs mt-1">{expandedId === a.id ? '▲' : '▼'}</span>
                </div>

                {/* Expanded details */}
                {expandedId === a.id && (
                  <div className="mt-3 space-y-2 pt-3 border-t border-gray-100 dark:border-[#222]">
                    {a.status === 'DECLINED' && a.decline_reason && (
                      <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 px-3 py-2">
                        <p className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-0.5">Decline Reason</p>
                        <p className="text-xs text-red-700 dark:text-red-300 italic">{a.decline_reason}</p>
                      </div>
                    )}
                    {a.notes && (
                      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 px-3 py-2">
                        <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-0.5">Doctor's Notes</p>
                        <p className="text-xs text-blue-800 dark:text-blue-200 whitespace-pre-wrap">{a.notes}</p>
                      </div>
                    )}
                    {a.completed_at && (
                      <p className="text-[10px] text-gray-400">Completed: {fmtDate(a.completed_at)}</p>
                    )}
                    {a.status === 'ACCEPTED' && !a.scheduled_at && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Scheduled: Now / Walk-in</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Pending Requests ── */}
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#222] flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-900 dark:text-white">Requests</h2>
            {counts.pending > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold animate-pulse">
                {counts.pending} PENDING
              </span>
            )}
          </div>

          <div className="divide-y divide-gray-100 dark:divide-[#222] max-h-[calc(100vh-280px)] overflow-y-auto">
            {pending.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <span className="text-4xl mb-3">✅</span>
                <p className="text-sm">All caught up</p>
                <p className="text-xs mt-1">No pending requests</p>
              </div>
            ) : pending.map(a => (
              <div key={a.id}
                className="px-4 py-4 bg-rose-50/50 dark:bg-rose-950/5 hover:bg-rose-50 dark:hover:bg-rose-950/10 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{a.patient_name}</p>
                    {a.patient_phone && <p className="text-[11px] text-gray-400 mt-0.5">📞 {a.patient_phone}</p>}
                    {a.symptoms && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">"{a.symptoms}"</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1">
                      Requested {fmtDate(a.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelected(a); setActionMode('accept') }}
                    className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors">
                    ✓ Accept
                  </button>
                  <button
                    onClick={() => { setSelected(a); setActionMode('decline') }}
                    className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-900 text-xs font-bold transition-colors">
                    ✕ Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
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
