'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  FaChevronLeft, FaMagnifyingGlass, FaCheck, FaClock,
  FaQrcode, FaIdCard, FaPhone, FaUser, FaArrowRight, FaBed
} from 'react-icons/fa6'
import { MdPersonSearch, MdLocalHospital, MdDirections, MdClose } from 'react-icons/md'

interface VisitorForm {
  name: string
  phone: string
  idNumber: string
}

export default function KioskVisit() {
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [results, setResults] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)

  // Modal state
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null)
  const [step, setStep] = useState<'form' | 'confirmed'>('form')
  const [form, setForm] = useState<VisitorForm>({ name: '', phone: '', idNumber: '' })
  const [formError, setFormError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [wardInfo, setWardInfo] = useState<any | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')

  // Fetch all admitted patients on mount
  useEffect(() => {
    setLoading(true)
    fetch('/api/patients')
      .then(res => res.json())
      .then(data => { setResults(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setResults([]); setLoading(false) })
  }, [])

  const searchPatient = async () => {
    if (!search.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/patients?search=${encodeURIComponent(search)}`)
      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
    } catch {
      setResults([])
    }
    setLoading(false)
  }

  const openVisitModal = (patient: any) => {
    setSelectedPatient(patient)
    setStep('form')
    setForm({ name: '', phone: '', idNumber: '' })
    setFormError('')
    setWardInfo(null)
    setShowQR(false)
    setQrDataUrl('')
  }

  const closeModal = () => setSelectedPatient(null)

  const handleConfirm = async () => {
    if (!form.name.trim()) { setFormError('Please enter your full name.'); return }
    if (!form.phone.trim()) { setFormError('Please enter your phone number.'); return }
    if (!form.idNumber.trim()) { setFormError('Please enter your ID/Passport number.'); return }
    setFormError('')
    setConfirming(true)

    // Fetch ward directions if we have a ward id
    let fetchedWard: any = null
    const wardId = selectedPatient?.ward?.id || selectedPatient?.ward_id
    if (wardId) {
      try {
        const res = await fetch(`/api/wards/${wardId}`)
        if (res.ok) fetchedWard = await res.json()
      } catch { /* ignore */ }
    }
    setWardInfo(fetchedWard)

    // Generate QR code — Google Maps directions to the ward
    const destLat = fetchedWard?.latitude ?? null
    const destLng = fetchedWard?.longitude ?? null
    const KIOSK_LAT = process.env.NEXT_PUBLIC_KIOSK_LAT || '-18.9718'
    const KIOSK_LNG = process.env.NEXT_PUBLIC_KIOSK_LNG || '32.6703'
    const mapsUrl = destLat && destLng
      ? `https://www.google.com/maps/dir/?api=1&origin=${KIOSK_LAT},${KIOSK_LNG}&destination=${destLat},${destLng}&travelmode=walking`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((fetchedWard?.name || selectedPatient?.ward?.name || 'Hospital Ward') + ' Mutare Provincial Hospital')}`
    try {
      const QRCode = await import('qrcode')
      const url = await QRCode.toDataURL(mapsUrl, {
        width: 220, margin: 2,
        color: { dark: '#1e3a8a', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      })
      setQrDataUrl(url)
    } catch { /* no qr */ }

    setConfirming(false)
    setStep('confirmed')
  }

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <header className="hero-gradient px-5 py-4 flex items-center gap-3 shadow-lg">
        <button
          onClick={() => router.push('/kiosk/menu')}
          className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
        >
          <FaChevronLeft size={14} />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-base leading-tight">Visit Someone Admitted</h1>
          <p className="text-white/65 text-xs">Search for an admitted patient</p>
        </div>
        <MdPersonSearch className="text-white/60 text-2xl" />
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Enter patient name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchPatient()}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              />
            </div>
            <button onClick={searchPatient} disabled={loading}
              className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 shadow-sm">
              {loading ? '...' : 'Search'}
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 text-sm text-amber-700 dark:text-amber-400">
            <div className="flex items-center gap-2 font-bold mb-1.5">
              <FaClock size={14} />
              Mutare Provincial Visiting Hours
            </div>
            <p>Mon-Fri: 2PM – 4PM</p>
            <p>Weekends: 10AM – 12PM &amp; 2PM – 4PM</p>
            <p className="mt-1 text-xs opacity-75">Please bring a valid ID when visiting.</p>
          </div>

          {loading && (
            <div className="text-center py-8 text-gray-400">
              <MdLocalHospital className="text-4xl mx-auto mb-2 animate-pulse" />
              <p className="text-sm">Loading patients…</p>
            </div>
          )}

          {results !== null && (
            <div className="grid grid-cols-2 gap-3">
              {results.length > 0 ? results.map((patient: any) => (
                <div key={patient.id} className="bg-white dark:bg-gray-800/90 rounded-2xl shadow-sm p-5 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <MdLocalHospital className="text-blue-600 text-xl" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{patient.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Admitted {patient.admission_date ? new Date(patient.admission_date).toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm mb-3">
                    <p className="text-gray-600 dark:text-gray-300">
                      <strong>Ward:</strong> {patient.ward?.name || '-'}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      <strong>Room:</strong> {patient.room || '-'}, Bed {patient.bed?.bed_number || '-'}
                    </p>
                  </div>
                  <button
                    onClick={() => openVisitModal(patient)}
                    className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all"
                  >
                    Visit Now <FaArrowRight size={12} />
                  </button>
                </div>
              )) : (
                <div className="text-center py-8 bg-white dark:bg-gray-800/90 rounded-2xl">
                  <MdPersonSearch className="text-4xl text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">No admitted patients found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Visit Modal — centered 60% */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-[60%] max-h-[85vh] flex flex-col shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">
                  {step === 'form' ? 'Register Your Visit' : 'Visit Confirmed!'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Patient: {selectedPatient.name}</p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <MdClose className="text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {step === 'form' ? (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Please fill in your details before visiting <strong>{selectedPatient.name}</strong>.
                  </p>

                  {/* Visitor Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                      Your Full Name
                    </label>
                    <div className="relative">
                      <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        placeholder="e.g. John Moyo"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                      Phone Number
                    </label>
                    <div className="relative">
                      <FaPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="tel"
                        placeholder="e.g. 0771 234 567"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>

                  {/* ID Number */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                      National ID / Passport Number
                    </label>
                    <div className="relative">
                      <FaIdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        placeholder="e.g. 63-123456 A00"
                        value={form.idNumber}
                        onChange={e => setForm(f => ({ ...f, idNumber: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>

                  {formError && (
                    <p className="text-red-600 text-sm font-medium">{formError}</p>
                  )}

                  <button
                    onClick={handleConfirm}
                    disabled={confirming}
                    className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {confirming ? 'Confirming…' : <>Confirm Details <FaArrowRight size={12} /></>}
                  </button>
                </>
              ) : (
                <>
                  {/* Success banner */}
                  <div className="flex flex-col items-center py-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
                      <FaCheck className="text-emerald-600 text-2xl" />
                    </div>
                    <h3 className="text-lg font-black text-gray-800 dark:text-gray-100">You&apos;re All Set!</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
                      Welcome, <strong>{form.name}</strong>. Head to the ward below.
                    </p>
                  </div>

                  {/* Directions card */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-sm mb-2">
                      <MdDirections className="text-lg" />
                      Directions to {selectedPatient.name}
                    </div>
                    <div className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                      <p className="flex items-center gap-2">
                        <MdLocalHospital className="text-blue-500 flex-shrink-0" />
                        <span><strong>Ward:</strong> {wardInfo?.name || selectedPatient.ward?.name || '-'}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <FaBed className="text-blue-500 flex-shrink-0" />
                        <span><strong>Floor:</strong> {wardInfo?.floor || '-'} &nbsp;|&nbsp; <strong>Bed:</strong> {selectedPatient.bed?.bed_number || '-'}</span>
                      </p>
                    </div>
                    {(wardInfo?.written_directions) && (
                      <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-800 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <p className="font-bold text-blue-700 dark:text-blue-400">Step-by-step:</p>
                        <p className="whitespace-pre-line leading-relaxed">{wardInfo.written_directions}</p>
                      </div>
                    )}
                  </div>

                  {/* ID reminder */}
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40">
                    <FaIdCard className="text-amber-600 text-xl flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Remember to bring your ID!</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                        You must present a valid National ID or Passport at the ward entrance.
                        Pre-registered ID: <strong>{form.idNumber}</strong>
                      </p>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setShowQR(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="flex items-center gap-2"><FaQrcode /> Show QR Code</span>
                      <FaChevronLeft className={`transition-transform ${showQR ? '-rotate-90' : 'rotate-180'}`} size={12} />
                    </button>
                    {showQR && qrDataUrl && (
                      <div className="flex flex-col items-center gap-2 py-5 bg-white dark:bg-gray-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrDataUrl} alt="Visit QR Code" width={180} height={180} className="rounded-xl" />
                        <p className="text-xs text-gray-400 text-center px-4">
                          Scan to open Google Maps directions to the ward on your phone
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={closeModal}
                    className="w-full py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Done
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
