'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Doctor {
  id: string
  specialty: string
  status: string
  room_number: string | null
  departmentId: string
  user: { name: string; profile_image: string | null }
  department: { name: string }
  _count?: { queueEntries: number }
}

interface BookingResult {
  appointmentId: string
  qrCode: string
  patientName: string
  doctorName: string
  scheduledAt: string | null
  status: string
}

function QRCodeDisplay({ value, size = 160 }: { value: string; size?: number }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    import('qrcode').then(QRCode => {
      QRCode.toDataURL(value, { width: size, margin: 2, color: { dark: '#003d73', light: '#ffffff' } })
        .then(url => setQrDataUrl(url))
        .catch(() => {})
    }).catch(() => {})
  }, [value, size])

  if (!qrDataUrl) {
    return (
      <div className="flex items-center justify-center bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl" style={{ width: size, height: size }}>
        <div className="w-8 h-8 rounded-full border-2 border-[#003d73] border-t-transparent animate-spin" />
      </div>
    )
  }
  return <img src={qrDataUrl} alt="QR Code" className="rounded-2xl shadow-lg" style={{ width: size, height: size }} />
}

export default function KioskDoctors() {
  const router = useRouter()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')

  // Booking flow
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null)
  const [bookingStep, setBookingStep] = useState<'form' | 'qr'>('form')
  const [bookingForm, setBookingForm] = useState({ name: '', phone: '', symptoms: '' })
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [booking, setBooking] = useState(false)
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null)

  const SYMPTOM_CHIPS = [
    'Fever', 'Headache', 'Cough', 'Chest Pain', 'Abdominal Pain',
    'Nausea / Vomiting', 'Diarrhoea', 'Shortness of Breath', 'Sore Throat',
    'Back Pain', 'Body Aches', 'Dizziness', 'Skin Rash', 'Eye Problem', 'Ear Pain',
    'Joint Pain', 'Fatigue', 'High Blood Pressure',
  ]

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const buildSymptomsText = () => {
    const chips = selectedSymptoms.join(', ')
    const extra = bookingForm.symptoms.trim()
    return [chips, extra].filter(Boolean).join('. ')
  }

  useEffect(() => {
    fetch('/api/doctors?activated=true')
      .then(res => res.json())
      .then(data => { setDoctors(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const submitBooking = async () => {
    if (!bookingDoctor || !bookingForm.name.trim()) return
    const symptoms = buildSymptomsText()
    if (!symptoms) return
    setBooking(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: bookingForm.name,
          patientPhone: bookingForm.phone || null,
          symptoms,
          doctorId: bookingDoctor.id,
          scheduledAt: new Date().toISOString(),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setBookingResult({
          appointmentId: data.id,
          qrCode: data.qr_code,
          patientName: bookingForm.name,
          doctorName: bookingDoctor.user.name,
          scheduledAt: data.scheduled_at,
          status: data.status,
        })
        setBookingStep('qr')
      }
    } catch {}
    setBooking(false)
  }

  const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
    AVAILABLE: { label: 'Available', dot: 'bg-emerald-500', badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
    BUSY:      { label: 'Busy',      dot: 'bg-amber-500',  badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
    ON_BREAK:  { label: 'On Break',  dot: 'bg-blue-500',   badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
    OFFLINE:   { label: 'Offline',   dot: 'bg-gray-400',   badge: 'bg-gray-100 dark:bg-[#222] text-gray-500 dark:text-gray-400' },
  }

  const filtered = doctors.filter(d => {
    const q = search.toLowerCase()
    const matchSearch = !q || d.user.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q) || d.department.name.toLowerCase().includes(q)
    const matchStatus = !filterStatus || d.status === filterStatus
    return matchSearch && matchStatus
  })

  const available = doctors.filter(d => d.status === 'AVAILABLE')

  // QR result screen
  if (bookingResult && bookingStep === 'qr') {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '')
    const trackUrl = `${baseUrl}/kiosk/track?qr=${bookingResult.qrCode}`
    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-[#0a0a0a]">
        <header className="bg-gradient-to-r from-[#003d73] to-[#0077cc] px-5 py-4 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-white/60 text-[10px] uppercase tracking-widest">Appointment Booked</p>
            <h1 className="text-white font-black text-base">Your QR Ticket</h1>
          </div>
          <button onClick={() => router.push('/kiosk/menu')}
            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors">
            Done
          </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className="bg-white dark:bg-[#111] rounded-3xl border border-gray-200 dark:border-[#222] p-6 w-full max-w-sm text-center shadow-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-bold mb-4">
              ⏳ Awaiting doctor confirmation
            </div>

            <div className="flex justify-center mb-4">
              <QRCodeDisplay value={trackUrl} size={160} />
            </div>

            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">{bookingResult.patientName}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Dr. {bookingResult.doctorName}</p>

            <div className="space-y-2 text-left bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">Pending</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Doctor</span>
                <span className="font-semibold text-gray-900 dark:text-white">{bookingResult.doctorName}</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 leading-relaxed">
              Scan this QR code at any kiosk or visit <strong className="font-mono text-blue-600">/kiosk/track</strong> to check your appointment status. The doctor will confirm shortly.
            </p>
          </div>

          <button
            onClick={() => router.push(`/kiosk/track?qr=${bookingResult.qrCode}`)}
            className="w-full max-w-sm py-3.5 rounded-2xl bg-[#003d73] text-white font-black text-sm shadow-lg shadow-blue-900/20 hover:bg-[#002d57] transition-colors"
          >
            Track Appointment Status →
          </button>
          <button
            onClick={() => router.push('/kiosk/menu')}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            Return to Main Menu
          </button>
        </main>
      </div>
    )
  }

  // Booking form modal
  if (bookingDoctor) {
    const sc = STATUS_CONFIG[bookingDoctor.status] || STATUS_CONFIG.OFFLINE
    return (
      <div className="flex flex-col min-h-screen bg-white dark:bg-[#0a0a0a]">
        <header className="bg-gradient-to-r from-[#003d73] to-[#0077cc] px-5 py-4 flex items-center gap-3">
          <button onClick={() => setBookingDoctor(null)} className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1">
            <p className="text-white/60 text-[10px] uppercase tracking-widest">Book Appointment</p>
            <h1 className="text-white font-black text-base">{bookingDoctor.user.name}</h1>
          </div>
        </header>

        <main className="flex-1 p-5 overflow-y-auto">
          <div className="max-w-lg mx-auto">
            {/* Doctor info */}
            <div className="bg-gray-50 dark:bg-[#111] rounded-2xl p-4 mb-5 border border-gray-100 dark:border-[#222] flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#003d73]/10 flex items-center justify-center text-xl overflow-hidden">
                {bookingDoctor.user.profile_image
                  ? <img src={bookingDoctor.user.profile_image} alt={bookingDoctor.user.name} className="w-full h-full object-cover" />
                  : '👨‍⚕️'}
              </div>
              <div>
                <p className="font-black text-gray-900 dark:text-white text-sm">{bookingDoctor.user.name}</p>
                <p className="text-xs text-gray-500">{bookingDoctor.specialty} · {bookingDoctor.department.name}</p>
                {bookingDoctor.room_number && <p className="text-xs text-gray-400">Room {bookingDoctor.room_number}</p>}
              </div>
              <span className={`ml-auto text-[10px] font-bold px-2 py-1 rounded-full ${sc.badge}`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${sc.dot}`} />
                {sc.label}
              </span>
            </div>

            <h2 className="text-base font-black text-gray-900 dark:text-white mb-4">Your Details</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Full Name *</label>
                <input
                  type="text"
                  value={bookingForm.name}
                  onChange={e => setBookingForm({ ...bookingForm, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Phone Number <span className="font-normal normal-case text-gray-400">(optional)</span></label>
                <input
                  type="tel"
                  value={bookingForm.phone}
                  onChange={e => setBookingForm({ ...bookingForm, phone: e.target.value })}
                  placeholder="+263 7XX XXX XXX"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Symptoms / Reason for Visit *</label>
              {/* Symptom chips */}
              <div className="flex flex-wrap gap-2 mb-3">
                {SYMPTOM_CHIPS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSymptom(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      selectedSymptoms.includes(s)
                        ? 'bg-[#003d73] border-[#003d73] text-white shadow-sm'
                        : 'bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:border-[#003d73] dark:hover:border-blue-500'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <textarea
                value={bookingForm.symptoms}
                onChange={e => setBookingForm({ ...bookingForm, symptoms: e.target.value })}
                placeholder="Add more details (optional)..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73] resize-none"
              /></div>
            </div>

            <div className="mt-5 space-y-2.5">
              <button
                onClick={submitBooking}
                disabled={booking || !bookingForm.name.trim() || (!selectedSymptoms.length && !bookingForm.symptoms.trim())}
                className="w-full py-4 rounded-2xl bg-[#003d73] hover:bg-[#002d57] text-white font-black text-base transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20"
              >
                {booking ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Booking...
                  </span>
                ) : 'Book Appointment & Get QR Ticket'}
              </button>
              <button
                onClick={() => setBookingDoctor(null)}
                className="w-full py-3 rounded-2xl border border-gray-200 dark:border-[#222] text-gray-600 dark:text-gray-400 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-[#111] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0a0a0a]">
      <header className="bg-gradient-to-r from-[#003d73] to-[#0077cc] px-5 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.push('/kiosk/menu')}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1">
            <p className="text-white/60 text-[10px] uppercase tracking-widest">Select a Doctor</p>
            <h1 className="text-white font-black text-base">Book an Appointment</h1>
          </div>
          <span className="text-[10px] px-2.5 py-1.5 rounded-xl bg-emerald-500 text-white font-bold">
            {available.length} available
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, specialty or department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/15 text-white text-sm placeholder-white/40 focus:outline-none focus:bg-white/20 transition-colors border border-white/20"
          />
        </div>
      </header>

      {/* Status filter pills */}
      <div className="px-5 py-3 flex gap-2 overflow-x-auto border-b border-gray-100 dark:border-[#1a1a1a]">
        {[['', 'All'], ['AVAILABLE', 'Available'], ['BUSY', 'Busy'], ['ON_BREAK', 'On Break'], ['OFFLINE', 'Offline']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilterStatus(val)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              filterStatus === val
                ? 'bg-[#003d73] text-white'
                : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#222]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <main className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[#003d73] border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-5xl mb-3">👨‍⚕️</span>
            <p className="text-base font-semibold">No doctors found</p>
            <p className="text-sm mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl mx-auto">
            {filtered.map(doctor => {
              const sc = STATUS_CONFIG[doctor.status] || STATUS_CONFIG.OFFLINE
              const canBook = doctor.status === 'AVAILABLE'
              return (
                <div key={doctor.id} className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#003d73]/10 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/10 flex items-center justify-center text-xl flex-shrink-0 overflow-hidden">
                    {doctor.user.profile_image
                      ? <img src={doctor.user.profile_image} alt={doctor.user.name} className="w-full h-full object-cover" />
                      : '👨‍⚕️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-black text-gray-900 dark:text-white">{doctor.user.name}</p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${sc.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${doctor.status === 'AVAILABLE' ? 'animate-pulse' : ''}`} />
                        {sc.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{doctor.specialty}</p>
                    <p className="text-[10px] text-gray-400">{doctor.department.name} {doctor.room_number && `· Room ${doctor.room_number}`}</p>
                  </div>
                  <button
                    onClick={() => setBookingDoctor(doctor)}
                    className="flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-black transition-all bg-[#003d73] hover:bg-[#002d57] text-white shadow-md shadow-blue-900/20 active:scale-95"
                  >
                    {doctor.status === 'AVAILABLE' ? 'Book' : 'Request'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
