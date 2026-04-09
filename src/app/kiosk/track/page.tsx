'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

interface Appointment {
  id: string
  patient_name: string
  patient_phone: string | null
  symptoms: string | null
  status: string
  scheduled_at: string | null
  accepted_at: string | null
  decline_reason: string | null
  notes: string | null
  created_at: string
  doctor: {
    id: string
    specialty: string
    room_number: string | null
    phone: string | null
    latitude: number | null
    longitude: number | null
    user: { name: string }
    department: {
      name: string
      location: string | null
      floor: string | null
      latitude: number | null
      longitude: number | null
    }
  } | null
}

const STATUS_UI: Record<string, { label: string; desc: string; color: string; bg: string; icon: string }> = {
  PENDING:     { label: 'Awaiting Confirmation', desc: 'Your request has been sent to the doctor. Please wait nearby.',         color: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',    icon: '⏳' },
  ACCEPTED:    { label: 'Appointment Confirmed', desc: 'The doctor has accepted your appointment. Please proceed to the room.',  color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800', icon: '✅' },
  DECLINED:    { label: 'Appointment Declined', desc: 'The doctor was unable to see you at this time.',                         color: 'text-rose-700 dark:text-rose-400',     bg: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800',      icon: '❌' },
  IN_PROGRESS: { label: 'Consultation In Progress', desc: 'You are currently with the doctor.',                                 color: 'text-blue-700 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',      icon: '🩺' },
  COMPLETED:   { label: 'Consultation Complete', desc: 'Your appointment has been completed. Thank you!',                       color: 'text-gray-700 dark:text-gray-300',     bg: 'bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333]',         icon: '🎉' },
  CANCELLED:   { label: 'Appointment Cancelled', desc: 'This appointment has been cancelled.',                                  color: 'text-gray-500 dark:text-gray-400',     bg: 'bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333]',         icon: '🚫' },
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-ZW', { dateStyle: 'medium', timeStyle: 'short' })
}

/** Build Google Maps directions URL from current location to destination coords */
function buildMapsUrl(lat: number, lng: number) {
  // Opens navigation in Google Maps app on mobile, browser on desktop
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`
}

function TrackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const qr = searchParams.get('qr')

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  const fetchStatus = async (silent = false) => {
    if (!qr) return
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch(`/api/appointments/track?qr=${encodeURIComponent(qr)}`)
      const data = await res.json()
      if (res.ok) {
        setAppointment(data)
        setLastRefreshed(new Date())
        setError(null)
      } else {
        setError(data.error || 'Appointment not found')
      }
    } catch {
      setError('Unable to connect. Please check your connection.')
    }
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(() => fetchStatus(true), 15000)
    return () => clearInterval(interval)
  }, [qr])

  const handleCancel = async () => {
    if (!appointment || !confirm('Are you sure you want to cancel this appointment?')) return
    setCancelling(true)
    try {
      await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' })
      })
      await fetchStatus(true)
    } catch {
      alert('Failed to cancel appointment. Please try again.')
    }
    setCancelling(false)
  }

  if (!qr) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-white dark:bg-[#0a0a0a]">
        <span className="text-5xl mb-4">🔍</span>
        <h2 className="text-lg font-black text-gray-900 dark:text-white mb-2">No QR Code Provided</h2>
        <p className="text-sm text-gray-500 text-center mb-6">Please scan your QR ticket or enter the tracking code manually.</p>
        <button onClick={() => router.push('/kiosk/menu')}
          className="px-6 py-3 rounded-xl bg-[#003d73] text-white font-bold text-sm">
          Back to Menu
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-[#0a0a0a]">
        <div className="w-10 h-10 rounded-full border-2 border-[#003d73] border-t-transparent animate-spin mb-4" />
        <p className="text-sm text-gray-500">Fetching appointment details...</p>
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-white dark:bg-[#0a0a0a]">
        <span className="text-5xl mb-4">❓</span>
        <h2 className="text-lg font-black text-gray-900 dark:text-white mb-2">Appointment Not Found</h2>
        <p className="text-sm text-gray-500 text-center mb-6">{error || 'The QR code may be invalid or expired.'}</p>
        <div className="flex gap-3">
          <button onClick={() => fetchStatus()} className="px-5 py-2.5 rounded-xl bg-[#003d73] text-white font-bold text-sm">
            Retry
          </button>
          <button onClick={() => router.push('/kiosk/menu')} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-[#222] text-gray-600 dark:text-gray-400 font-bold text-sm">
            Back
          </button>
        </div>
      </div>
    )
  }

  const ui = STATUS_UI[appointment.status] || STATUS_UI.PENDING

  // Resolve doctor destination coordinates (doctor's own lat/lng first, then department's)
  const destLat = appointment.doctor?.latitude ?? appointment.doctor?.department?.latitude ?? null
  const destLng = appointment.doctor?.longitude ?? appointment.doctor?.department?.longitude ?? null
  const showDirections = (appointment.status === 'ACCEPTED' || appointment.status === 'IN_PROGRESS') && destLat != null && destLng != null
  // Fallback to hospital coordinates
  const fallbackLat = parseFloat(process.env.NEXT_PUBLIC_HOSPITAL_LAT || '-18.963694')
  const fallbackLng = parseFloat(process.env.NEXT_PUBLIC_HOSPITAL_LNG || '32.663358')
  const mapsUrl = buildMapsUrl(
    destLat ?? fallbackLat,
    destLng ?? fallbackLng
  )

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#003d73] to-[#0077cc] px-5 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.push('/kiosk/menu')}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <p className="text-white/60 text-[10px] uppercase tracking-widest">Appointment Tracker</p>
            <h1 className="text-white font-black text-base">Live Status</h1>
          </div>
          <button
            onClick={() => fetchStatus(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold transition-colors"
          >
            <svg className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Tracking code — big and unmissable */}
        <div className="flex items-center justify-between bg-white/10 rounded-2xl px-4 py-3">
          <div>
            <p className="text-white/50 text-[9px] uppercase tracking-widest font-bold">Your Tracking Code</p>
            <p className="text-white font-black text-3xl tracking-[0.25em] leading-tight">{qr?.toUpperCase()}</p>
            <p className="text-white/40 text-[9px] mt-0.5">Keep this code — you can use it to check status anytime</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center text-2xl">🎫</div>
        </div>

        {lastRefreshed && (
          <p className="text-white/40 text-[9px] mt-2">
            Updated {lastRefreshed.toLocaleTimeString()} · Auto-refreshes every 15s
          </p>
        )}
      </header>

      <main className="flex-1 p-5 space-y-4 max-w-lg mx-auto w-full overflow-y-auto">
        {/* Status Banner */}
        <div className={`rounded-2xl border p-4 flex items-start gap-3 ${ui.bg}`}>
          <span className="text-2xl mt-0.5">{ui.icon}</span>
          <div className="flex-1">
            <p className={`text-sm font-black ${ui.color}`}>{ui.label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{ui.desc}</p>
            {appointment.status === 'DECLINED' && appointment.decline_reason && (
              <div className="mt-2 p-2.5 rounded-xl bg-white/60 dark:bg-white/5">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Reason</p>
                <p className="text-xs text-gray-700 dark:text-gray-300">{appointment.decline_reason}</p>
              </div>
            )}
            {appointment.status === 'ACCEPTED' && appointment.scheduled_at && (
              <div className="mt-2 p-2.5 rounded-xl bg-white/60 dark:bg-white/5">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Your Appointment Time</p>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{fmt(appointment.scheduled_at)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Google Maps Directions — shown when appointment is confirmed */}
        {(appointment.status === 'ACCEPTED' || appointment.status === 'IN_PROGRESS') && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-900/20 hover:from-emerald-600 hover:to-teal-700 transition-all active:scale-95"
          >
            <span className="text-xl">🗺️</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-black leading-tight">Get Directions</p>
              <p className="text-[11px] text-white/70 font-normal">Open in Google Maps</p>
            </div>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        {/* Patient Info */}
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-4">
          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-3">Patient</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-base">🏥</div>
            <div>
              <p className="text-sm font-black text-gray-900 dark:text-white">{appointment.patient_name}</p>
              {appointment.patient_phone && <p className="text-xs text-gray-400">{appointment.patient_phone}</p>}
            </div>
          </div>
          {appointment.symptoms && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#222]">
              <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1">Reason for Visit</p>
              <p className="text-xs text-gray-700 dark:text-gray-300">{appointment.symptoms}</p>
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#222]">
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1">Booked At</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{fmt(appointment.created_at)}</p>
          </div>
        </div>

        {/* Doctor Info */}
        {appointment.doctor && (
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-4">
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-3">Doctor</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-base">👨‍⚕️</div>
              <div>
                <p className="text-sm font-black text-gray-900 dark:text-white">{appointment.doctor.user.name}</p>
                <p className="text-xs text-gray-500">{appointment.doctor.specialty}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-2.5">
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-0.5">Department</p>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{appointment.doctor.department.name}</p>
              </div>
              {appointment.doctor.room_number && (
                <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-2.5">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-0.5">Room</p>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Room {appointment.doctor.room_number}</p>
                </div>
              )}
              {appointment.doctor.department.floor && (
                <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-2.5">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-0.5">Floor</p>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Floor {appointment.doctor.department.floor}</p>
                </div>
              )}
              {appointment.doctor.department.location && (
                <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-2.5">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-0.5">Location</p>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{appointment.doctor.department.location}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-6">
          <div className="flex gap-3">
            {appointment.status === 'DECLINED' && (
              <button onClick={() => router.push('/kiosk/doctors')}
                className="flex-1 py-3.5 rounded-2xl bg-[#003d73] text-white font-black text-sm">
                Book Another Doctor
              </button>
            )}
            <button onClick={() => router.push('/kiosk/menu')}
              className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-[#222] text-gray-600 dark:text-gray-400 font-bold text-sm hover:bg-gray-50 dark:hover:bg-[#111] transition-colors">
              Back to Menu
            </button>
          </div>
          
          {(appointment.status === 'PENDING' || appointment.status === 'ACCEPTED') && (
            <button 
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full py-3 rounded-2xl border border-rose-200 dark:border-rose-900/30 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold text-xs transition-colors disabled:opacity-50">
              {cancelling ? 'Cancelling...' : 'Cancel Appointment'}
            </button>
          )}
        </div>

        <div className="pb-4 mt-6" />
      </main>
    </div>
  )
}

export default function KioskTrackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full bg-white dark:bg-[#0a0a0a]">
        <div className="w-10 h-10 rounded-full border-2 border-[#003d73] border-t-transparent animate-spin" />
      </div>
    }>
      <TrackContent />
    </Suspense>
  )
}
