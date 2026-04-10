'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

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

interface Medication {
  id: string
  name: string
  form: string
  dosage: string
  category: string | null
  in_stock: boolean
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

const NOTE_CATEGORIES = [
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'prescription', label: 'Prescription / Medication' },
  { key: 'advice', label: 'Patient Advice' },
  { key: 'referral', label: 'Referral Notes' },
  { key: 'followup', label: 'Follow-up Instructions' },
]

/** Is this appointment in the future queue */
function isFutureAppointment(a: Appointment) {
  if (!a.scheduled_at) return false
  const diff = new Date(a.scheduled_at).getTime() - Date.now()
  return diff > 0
}

function isImminentAppointment(a: Appointment) {
  if (!a.scheduled_at) return false
  const diff = new Date(a.scheduled_at).getTime() - Date.now()
  return diff > 0 && diff <= 5 * 60 * 1000
}

/** Format ms countdown to "Xh Xm" or "X min" */
function formatCountdown(ms: number) {
  if (ms <= 0) return 'Now'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

/* ────────────────────────────────────────────────────────────────────
   Toast notification
──────────────────────────────────────────────────────────────────── */
function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 8000)
    return () => clearTimeout(t)
  }, [onDismiss])
  return (
    <div className="fixed top-4 right-4 z-[200] max-w-sm animate-in slide-in-from-top-2">
      <div className="bg-amber-500 text-white rounded-2xl shadow-2xl px-5 py-4 flex items-start gap-3">
        <span className="text-2xl">⏰</span>
        <div className="flex-1">
          <p className="font-black text-sm">{message}</p>
        </div>
        <button onClick={onDismiss} className="text-white/70 hover:text-white text-lg leading-none">×</button>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────
   Countdown cell (re-renders every second)
──────────────────────────────────────────────────────────────────── */
function CountdownBadge({ scheduledAt, onFiveMin, onZero }: {
  scheduledAt: string
  onFiveMin: () => void
  onZero: () => void
}) {
  const [ms, setMs] = useState(() => new Date(scheduledAt).getTime() - Date.now())
  const fiveFired = useRef(false)
  const zeroFired = useRef(false)

  useEffect(() => {
    const id = setInterval(() => {
      const remaining = new Date(scheduledAt).getTime() - Date.now()
      setMs(remaining)
      if (!fiveFired.current && remaining <= 5 * 60 * 1000 && remaining > 0) {
        fiveFired.current = true
        onFiveMin()
      }
      if (!zeroFired.current && remaining <= 0) {
        zeroFired.current = true
        onZero()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [scheduledAt, onFiveMin, onZero])

  const urgent = ms <= 5 * 60 * 1000 && ms > 0
  const overdue = ms <= 0

  return (
    <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg tabular-nums ${
      overdue ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 animate-pulse'
      : urgent ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 animate-pulse'
      : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'
    }`}>
      {overdue ? 'DUE NOW' : formatCountdown(ms)}
    </span>
  )
}

/* ────────────────────────────────────────────────────────────────────
   Active Appointment Panel (left column)
──────────────────────────────────────────────────────────────────── */
function ActiveAppointmentPanel({
  appointment,
  medications,
  onEnd,
}: {
  appointment: Appointment
  medications: Medication[]
  onEnd: (notes: Record<string, string>) => void
}) {
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [activeNote, setActiveNote] = useState('diagnosis')
  const [saving, setSaving] = useState(false)
  const [selectedMeds, setSelectedMeds] = useState<Record<string, { quantity: string }>>({})
  const [medSearch, setMedSearch] = useState('')
  const [customMedName, setCustomMedName] = useState('')
  const [customMedQty, setCustomMedQty] = useState('')
  const [customMeds, setCustomMeds] = useState<Array<{ name: string; quantity: string }>>([])

  useEffect(() => {
    setNotes({})
    setActiveNote('diagnosis')
    setSelectedMeds({})
    setMedSearch('')
    setCustomMedName('')
    setCustomMedQty('')
    setCustomMeds([])
  }, [appointment.id])

  const filteredMeds = medications
    .filter(m => m.in_stock)
    .filter(m => {
      const q = medSearch.trim().toLowerCase()
      if (!q) return true
      return [m.name, m.form, m.dosage, m.category || ''].join(' ').toLowerCase().includes(q)
    })
    .slice(0, 18)

  const toggleMedication = (med: Medication) => {
    setSelectedMeds(prev => {
      if (prev[med.id]) {
        const next = { ...prev }
        delete next[med.id]
        return next
      }
      return { ...prev, [med.id]: { quantity: '1' } }
    })
  }

  const handleEnd = async () => {
    setSaving(true)
    const prescriptionLines = [
      ...medications
        .filter(med => selectedMeds[med.id])
        .map(med => `- ${med.name} ${med.dosage} (${med.form}) x ${selectedMeds[med.id].quantity || '1'}`),
      ...customMeds.map(med => `- ${med.name}${med.quantity ? ` x ${med.quantity}` : ''}`),
    ]

    const prescriptionText = [
      notes.prescription?.trim(),
      prescriptionLines.length ? prescriptionLines.join('\n') : '',
    ].filter(Boolean).join('\n')

    const mergedNotes = { ...notes, prescription: prescriptionText }
    const combined = NOTE_CATEGORIES
      .filter(c => mergedNotes[c.key]?.trim())
      .map(c => `[${c.label}]\n${mergedNotes[c.key].trim()}`)
      .join('\n\n')
    await onEnd({ ...mergedNotes, combined })
    setSaving(false)
  }

  return (
    <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#003d73] to-[#005a9e] px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Active Appointment</p>
          <p className="text-white font-black text-base truncate">{appointment.patient_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/70 text-xs font-semibold">In Session</span>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {/* Patient info */}
        <div className="grid grid-cols-2 gap-2">
          {appointment.patient_phone && (
            <div className="rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#222] px-3 py-2">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Phone</p>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{appointment.patient_phone}</p>
            </div>
          )}
          {appointment.scheduled_at && (
            <div className="rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#222] px-3 py-2">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Scheduled</p>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                {new Date(appointment.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>

        {appointment.symptoms && (
          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 px-3 py-2">
            <p className="text-[9px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider mb-0.5">Chief Complaint / Symptoms</p>
            <p className="text-xs text-rose-800 dark:text-rose-200 italic">{appointment.symptoms}</p>
          </div>
        )}

        {/* Notes editor */}
        <div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Doctor's Notes</p>
          {/* Category tabs */}
          <div className="flex gap-1 mb-2 flex-wrap">
            {NOTE_CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveNote(cat.key)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  activeNote === cat.key
                    ? 'bg-[#003d73] text-white'
                    : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#222]'
                }`}
              >
                {notes[cat.key] ? '✓ ' : ''}{cat.label}
              </button>
            ))}
          </div>
          <textarea
            value={notes[activeNote] || ''}
            onChange={e => setNotes(prev => ({ ...prev, [activeNote]: e.target.value }))}
            placeholder={`Enter ${NOTE_CATEGORIES.find(c => c.key === activeNote)?.label.toLowerCase()} notes...`}
            rows={5}
            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73] resize-none"
          />
          {activeNote === 'prescription' && (
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">Medication Picker</p>
                <input
                  value={medSearch}
                  onChange={e => setMedSearch(e.target.value)}
                  placeholder="Search medications..."
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-xs text-gray-800 dark:text-gray-200"
                />
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-1">
                {filteredMeds.map(med => (
                  <label key={med.id} className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#1a1a1a] px-3 py-2">
                    <input
                      type="checkbox"
                      checked={!!selectedMeds[med.id]}
                      onChange={() => toggleMedication(med)}
                      className="rounded border-gray-300 text-[#003d73] focus:ring-[#003d73]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{med.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{med.dosage} · {med.form}{med.category ? ` · ${med.category}` : ''}</p>
                    </div>
                    {selectedMeds[med.id] && (
                      <input
                        value={selectedMeds[med.id].quantity}
                        onChange={e => setSelectedMeds(prev => ({ ...prev, [med.id]: { quantity: e.target.value } }))}
                        placeholder="Qty"
                        className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-[#333] bg-white dark:bg-[#111] text-[10px] text-center"
                      />
                    )}
                  </label>
                ))}
              </div>
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-[#333] p-3 space-y-2">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Add Another Medication</p>
                <div className="grid grid-cols-[1fr_90px_auto] gap-2">
                  <input
                    value={customMedName}
                    onChange={e => setCustomMedName(e.target.value)}
                    placeholder="Medication name"
                    className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-xs"
                  />
                  <input
                    value={customMedQty}
                    onChange={e => setCustomMedQty(e.target.value)}
                    placeholder="Qty"
                    className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-xs"
                  />
                  <button
                    onClick={() => {
                      if (!customMedName.trim()) return
                      setCustomMeds(prev => [...prev, { name: customMedName.trim(), quantity: customMedQty.trim() }])
                      setCustomMedName('')
                      setCustomMedQty('')
                    }}
                    className="px-3 py-2 rounded-xl bg-[#003d73] text-white text-xs font-bold"
                  >Add</button>
                </div>
                {customMeds.length > 0 && (
                  <div className="space-y-1">
                    {customMeds.map((med, index) => (
                      <div key={`${med.name}-${index}`} className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-[#111] rounded-lg px-3 py-2 border border-gray-200 dark:border-[#333]">
                        <span>{med.name}{med.quantity ? ` x ${med.quantity}` : ''}</span>
                        <button onClick={() => setCustomMeds(prev => prev.filter((_, i) => i !== index))} className="text-red-500 font-bold">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* End button */}
      <div className="px-4 pb-4">
        <button
          onClick={handleEnd}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-black text-sm transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Ending...</>
          ) : (
            <>✓ End Appointment</>
          )}
        </button>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────
   Main Dashboard
──────────────────────────────────────────────────────────────────── */
export default function DoctorDashboard() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [statusUpdating, setStatusUpdating] = useState(false)

  // Accept/decline modal
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)
  const [actionMode, setActionMode] = useState<'accept' | 'decline' | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [declineCustom, setDeclineCustom] = useState('')
  const [acceptTime, setAcceptTime] = useState<'now' | 'custom'>('now')
  const [acceptDateTime, setAcceptDateTime] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Reschedule modal
  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null)
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [rescheduleLoading, setRescheduleLoading] = useState(false)

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const toastFiredFor = useRef<Set<string>>(new Set())

  // Settings
  const [settings, setSettings] = useState<Record<string, string>>({})

  // Conflict modal (appointment due while busy)
  const [conflictAppt, setConflictAppt] = useState<Appointment | null>(null)
  const conflictFiredFor = useRef<Set<string>>(new Set())
  const [postponeTime, setPostponeTime] = useState('')
  const [conflictMode, setConflictMode] = useState<'prompt' | 'postpone'>('prompt')

  const loadData = useCallback(async () => {
    try {
      const [docRes, apptRes, queueRes, setRes, medsRes] = await Promise.all([
        fetch('/api/doctors/me'),
        fetch('/api/appointments?mine=true'),
        fetch('/api/queue?mine=true'),
        fetch('/api/settings'),
        fetch('/api/medications'),
      ])
      if (docRes.ok) setProfile(await docRes.json())
      if (apptRes.ok) setAppointments(await apptRes.json())
      if (queueRes.ok) setQueue(await queueRes.json())
      if (setRes.ok) setSettings(await setRes.json())
      if (medsRes.ok) setMedications(await medsRes.json())
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [loadData])

  const updateStatus = async (newStatus: string) => {
    if (!profile) return
    setStatusUpdating(true)
    try {
      await fetch(`/api/doctors/${profile.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      setProfile({ ...profile, status: newStatus })
    } catch {}
    setStatusUpdating(false)
  }

  const handleAction = async () => {
    if (!selectedAppt || !actionMode) return

    // Schedule validation for custom time
    if (actionMode === 'accept' && acceptTime === 'custom' && acceptDateTime) {
      const dt = new Date(acceptDateTime)
      const hr = dt.getHours()
      const min = dt.getMinutes()
      const t = hr + min / 60

      const [wStartStr, wEndStr] = (settings.doc_hours || '08:00-17:00').split('-')
      const [lStartStr, lEndStr] = (settings.doc_lunch || '13:00-14:00').split('-')
      
      const p = (s: string) => parseInt(s.split(':')[0]) + parseInt(s.split(':')[1]) / 60
      const wS = p(wStartStr), wE = p(wEndStr)
      const lS = p(lStartStr), lE = p(lEndStr)

      if (t < wS || t >= wE) {
        setToastMsg(`Cannot explicitly schedule outside work hours (${wStartStr} - ${wEndStr})`)
        return
      }
      if (t >= lS && t < lE) {
        setToastMsg(`Cannot explicitly schedule during lunch hours (${lStartStr} - ${lEndStr})`)
        return
      }
    }

    setActionLoading(true)
    try {
      if (actionMode === 'accept') {
        const scheduledAt = acceptTime === 'custom' && acceptDateTime
          ? new Date(acceptDateTime).toISOString()
          : new Date().toISOString()
        await fetch(`/api/appointments/${selectedAppt.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: acceptTime === 'now' ? 'IN_PROGRESS' : 'ACCEPTED', scheduledAt }),
        })
      } else {
        const reason = declineReason + (declineCustom ? ` — ${declineCustom}` : '')
        await fetch(`/api/appointments/${selectedAppt.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'DECLINED', declineReason: reason }),
        })
      }
      setSelectedAppt(null); setActionMode(null)
      setDeclineReason(''); setDeclineCustom('')
      setAcceptTime('now'); setAcceptDateTime('')
      loadData()
    } catch {}
    setActionLoading(false)
  }

  const handleEndAppointment = async (notes: Record<string, string>) => {
    const active = appointments.find(a => a.status === 'IN_PROGRESS')
    if (!active) return
    await fetch(`/api/appointments/${active.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED', notes: notes.combined || '' }),
    })
    loadData()
  }

  const handleQuickEndCurrent = async () => {
    const active = appointments.find(a => a.status === 'IN_PROGRESS')
    if (!active) return
    await fetch(`/api/appointments/${active.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED' }),
    })
    loadData()
  }

  const handleStartUpcoming = async (appt: Appointment) => {
    await fetch(`/api/appointments/${appt.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'IN_PROGRESS', scheduledAt: new Date().toISOString() }),
    })
    loadData()
  }

  const handleAttendConflict = async () => {
    if (!conflictAppt) return
    // End active and start this
    const currentActive = appointments.find(a => a.status === 'IN_PROGRESS')
    if (currentActive) {
      await fetch(`/api/appointments/${currentActive.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })
    }
    await fetch(`/api/appointments/${conflictAppt.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'IN_PROGRESS', scheduledAt: new Date().toISOString() }),
    })
    setConflictAppt(null)
    loadData()
  }

  const handlePostponeConflict = async () => {
    if (!conflictAppt || !postponeTime) return
    await fetch(`/api/appointments/${conflictAppt.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledAt: new Date(postponeTime).toISOString() }),
    })
    setConflictAppt(null); setPostponeTime(''); setConflictMode('prompt')
    loadData()
  }

  const updateQueue = async (id: string, status: string) => {
    await fetch(`/api/queue/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    loadData()
  }

  const pending = appointments.filter(a => a.status === 'PENDING')
  const activeAppt = appointments.find(a => a.status === 'IN_PROGRESS') || null
  const queuedAppts = appointments.filter(a => a.status === 'ACCEPTED' && isFutureAppointment(a))
  const imminentAppt = [...queuedAppts]
    .filter(isImminentAppointment)
    .sort((a, b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime())[0] || null
  const waitingQueue = queue.filter(q => q.status === 'WAITING')
  const hasLiveSession = !!activeAppt || queue.some(q => q.status === 'IN_PROGRESS')
  const effectiveStatus = hasLiveSession ? 'BUSY' : (profile?.status || 'AVAILABLE')
  const sc = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.OFFLINE

  useEffect(() => {
    if (!profile) return
    const targetStatus = hasLiveSession ? 'BUSY' : (profile.status === 'BUSY' ? 'AVAILABLE' : null)
    if (!targetStatus || targetStatus === profile.status) return

    fetch(`/api/doctors/${profile.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: targetStatus }),
    }).then(() => {
      setProfile(prev => prev ? { ...prev, status: targetStatus } : prev)
    }).catch(() => {})
  }, [hasLiveSession, profile])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-[#003d73] border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="space-y-4 h-full">
      {/* Toast */}
      {toastMsg && <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />}

      {/* Conflict modal */}
      {conflictAppt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-200 dark:border-[#282828] shadow-2xl w-full max-w-sm p-6">
            <div className="text-3xl mb-3 text-center">🔔</div>
            <h3 className="text-base font-black text-gray-900 dark:text-white mb-1 text-center">Appointment Time Reached</h3>
            <p className="text-xs text-gray-500 text-center mb-5">
              <strong>{conflictAppt.patient_name}</strong>'s appointment is due but you appear to be busy.
            </p>
            {conflictMode === 'prompt' ? (
              <div className="flex flex-col gap-2">
                <button onClick={handleAttendConflict}
                  className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-colors">
                  ✓ Attend Now (end current)
                </button>
                <button onClick={() => setConflictMode('postpone')}
                  className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors">
                  ⏱ Postpone
                </button>
                <button onClick={() => setConflictAppt(null)}
                  className="py-2.5 rounded-xl border border-gray-200 dark:border-[#333] text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                  Dismiss
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Reschedule to:</p>
                <input type="datetime-local" value={postponeTime}
                  onChange={e => setPostponeTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
                <div className="flex gap-2">
                  <button onClick={() => setConflictMode('prompt')}
                    className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-[#333] text-xs font-bold text-gray-500">← Back</button>
                  <button onClick={handlePostponeConflict} disabled={!postponeTime}
                    className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold">
                    Confirm Postpone
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Doctor header card */}
      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mb-0.5">Clinical Workstation</p>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">{profile?.user.name}</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {profile?.specialty} · {profile?.department.name}
              {profile?.room_number && ` · Room ${profile.room_number}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${sc.bg}`}>
              <span className={`w-2 h-2 rounded-full ${sc.dot} ${effectiveStatus === 'AVAILABLE' ? 'animate-pulse' : ''}`} />
              {sc.label}
            </div>
            {pending.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs font-bold animate-pulse">
                🔔 {pending.length} new request{pending.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Status switcher */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button key={key} onClick={() => updateStatus(key)}
              disabled={statusUpdating || effectiveStatus === key}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                effectiveStatus === key ? cfg.bg
                : 'bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-[#555]'
              } disabled:opacity-60`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${cfg.dot}`} />
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {imminentAppt && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Upcoming Appointment</p>
              <p className="text-sm font-black text-gray-900 dark:text-white">{imminentAppt.patient_name}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                {imminentAppt.symptoms || 'No symptoms provided'}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-1">
                Scheduled for {new Date(imminentAppt.scheduled_at!).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeAppt && (
                <button onClick={handleQuickEndCurrent}
                  className="px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors">
                  End Current
                </button>
              )}
              <button onClick={() => setRescheduleAppt(imminentAppt)}
                className="px-3 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-colors">
                Reschedule
              </button>
              <button onClick={() => handleStartUpcoming(imminentAppt)}
                className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors">
                Accept / Start
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start">

        {/* ── LEFT: Active / Current Appointment ── */}
        <div>
          {activeAppt ? (
            <ActiveAppointmentPanel appointment={activeAppt} medications={medications} onEnd={handleEndAppointment} />
          ) : (
            <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Current Activity</p>
              <div className="flex flex-col items-center py-10 text-gray-400 gap-3">
                <span className="text-5xl">🩺</span>
                <p className="text-sm font-semibold">No active appointment</p>
                <p className="text-xs text-gray-400 text-center">
                  Accept an appointment request and choose "Right Now" to start a session here.
                </p>
              </div>
              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: 'Pending', value: pending.length, color: 'text-rose-600 dark:text-rose-400' },
                  { label: 'Queued', value: queuedAppts.length, color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Walk-ins', value: waitingQueue.length, color: 'text-amber-600 dark:text-amber-400' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-[#222] p-3 text-center">
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT column ── */}
        <div className="flex flex-col gap-4">

          {/* Appointment Requests (PENDING only) */}
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-gray-900 dark:text-white">Appointment Requests</h2>
              {pending.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold animate-pulse">
                  {pending.length} PENDING
                </span>
              )}
            </div>

            {pending.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-gray-400">
                <span className="text-3xl mb-1">📅</span>
                <p className="text-xs">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pending.map(a => (
                  <div key={a.id} className="p-3 rounded-xl border bg-rose-50 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/30">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{a.patient_name}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5 truncate">{a.symptoms || 'No symptoms provided'}</p>
                        {a.patient_phone && <p className="text-[10px] text-gray-400">📞 {a.patient_phone}</p>}
                        <p className="text-[9px] text-gray-400 mt-0.5">
                          {new Date(a.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button onClick={() => { setSelectedAppt(a); setActionMode('accept') }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold transition-colors">
                          Accept
                        </button>
                        <button onClick={() => { setSelectedAppt(a); setActionMode('decline') }}
                          className="px-2.5 py-1 rounded-lg bg-gray-200 dark:bg-[#333] hover:bg-red-100 dark:hover:bg-red-950/40 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-[10px] font-bold transition-colors">
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Patient Queue (accepted future appointments + walk-ins) */}
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-gray-900 dark:text-white">Upcoming Queue</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold">
                {queuedAppts.length + waitingQueue.length} total
              </span>
            </div>

            <div className="space-y-2">
              {/* Scheduled appointments with countdowns */}
              {queuedAppts.map(a => (
                <div key={a.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{a.patient_name}</p>
                    {a.symptoms && <p className="text-[10px] text-gray-400 truncate">{a.symptoms}</p>}
                    <p className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                      📅 {new Date(a.scheduled_at!).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {a.scheduled_at && (
                    <CountdownBadge
                      scheduledAt={a.scheduled_at}
                      onFiveMin={() => {
                        if (!toastFiredFor.current.has(a.id)) {
                          toastFiredFor.current.add(a.id)
                          setToastMsg(`Appointment with ${a.patient_name} is in 5 minutes — prepare!`)
                        }
                      }}
                      onZero={() => {
                        if (!conflictFiredFor.current.has(a.id)) {
                          conflictFiredFor.current.add(a.id)
                          // Show conflict only if currently busy/active
                          if (activeAppt) setConflictAppt(a)
                        }
                      }}
                    />
                  )}
                  <button onClick={() => { setRescheduleAppt(a); setRescheduleTime(''); setRescheduleLoading(false) }}
                    className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors flex-shrink-0"
                    title="Reschedule">
                    🗓️
                  </button>
                </div>
              ))}

              {/* Walk-in queue */}
              {waitingQueue.map(q => (
                <div key={q.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#222]">
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
                  <button onClick={() => updateQueue(q.id, 'IN_PROGRESS')}
                    className="px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white text-[9px] font-bold transition-colors flex-shrink-0">
                    Start
                  </button>
                </div>
              ))}

              {queuedAppts.length === 0 && waitingQueue.length === 0 && (
                <div className="flex flex-col items-center py-6 text-gray-400">
                  <span className="text-3xl mb-1">🎫</span>
                  <p className="text-xs">Queue is empty</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduleAppt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-200 dark:border-[#282828] shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">
              🗓️ Reschedule Appointment
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Patient: <strong>{rescheduleAppt.patient_name}</strong>
            </p>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Select new time:</p>
              <input type="datetime-local" value={rescheduleTime}
                onChange={e => setRescheduleTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setRescheduleAppt(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!rescheduleTime) return
                  const dt = new Date(rescheduleTime)
                  const t = dt.getHours() + dt.getMinutes() / 60
                  const [wS, wE] = (settings.doc_hours || '08:00-17:00').split('-').map(s => parseInt(s.split(':')[0]) + parseInt(s.split(':')[1]) / 60)
                  const [lS, lE] = (settings.doc_lunch || '13:00-14:00').split('-').map(s => parseInt(s.split(':')[0]) + parseInt(s.split(':')[1]) / 60)
                  if (t < wS || t >= wE) return setToastMsg('Cannot reschedule outside work hours')
                  if (t >= lS && t < lE) return setToastMsg('Cannot reschedule during lunch hours')

                  setRescheduleLoading(true)
                  try {
                    await fetch(`/api/appointments/${rescheduleAppt.id}`, {
                      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ scheduledAt: new Date(rescheduleTime).toISOString() }),
                    })
                    setRescheduleAppt(null)
                    loadData()
                  } catch {}
                  setRescheduleLoading(false)
                }}
                disabled={rescheduleLoading || !rescheduleTime}
                className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-colors disabled:opacity-50">
                {rescheduleLoading ? 'Saving...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accept / Decline Modal */}
      {selectedAppt && actionMode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-200 dark:border-[#282828] shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-black text-gray-900 dark:text-white mb-1">
              {actionMode === 'accept' ? '✅ Accept Appointment' : '❌ Decline Appointment'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Patient: <strong>{selectedAppt.patient_name}</strong>
              {selectedAppt.symptoms && <> · {selectedAppt.symptoms}</>}
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
              <button onClick={() => { setSelectedAppt(null); setActionMode(null) }}
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
