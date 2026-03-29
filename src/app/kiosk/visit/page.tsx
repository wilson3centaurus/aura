'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { FaChevronLeft, FaMagnifyingGlass, FaCheck, FaXmark, FaClock, FaQrcode, FaIdCard, FaPhone, FaUser, FaLocationDot, FaTriangleExclamation } from 'react-icons/fa6'
import { MdPersonSearch, MdLocalHospital, MdBedroomChild } from 'react-icons/md'

interface Patient {
  id: string
  name: string
  admissionDate: string
  visitorsAllowed: boolean
  ward?: { name: string; id: string }
  room?: string
  bed?: { bed_number: string | number }
}

type ModalStep = 'form' | 'confirm' | 'pass'

function QRCodeSVG({ data }: { data: string }) {
  // Generate a simple QR-code-style visual using a hash-based pattern
  // We embed the data as a URL in a real QR via a data-URL approach
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    // Use the free QR API
    const encoded = encodeURIComponent(data)
    setUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`)
  }, [data])

  if (!url) return <div className="w-40 h-40 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />

  return (
    <img
      src={url}
      alt="Visitor QR Code"
      className="w-40 h-40 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md"
      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
    />
  )
}

function VisitorModal({
  patient,
  onClose,
}: {
  patient: Patient
  onClose: () => void
}) {
  const [step, setStep] = useState<ModalStep>('form')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showQR, setShowQR] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!phone.trim()) e.phone = 'Phone number is required'
    if (!idNumber.trim()) e.idNumber = 'ID number is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const qrData = `VISITOR PASS
Name: ${name}
Phone: ${phone}
ID: ${idNumber}
Patient: ${patient.name}
Ward: ${patient.ward?.name || 'N/A'}
Room: ${patient.room || 'N/A'}  Bed: ${patient.bed?.bed_number || 'N/A'}
Date: ${new Date().toLocaleDateString()}`

  const wardName = patient.ward?.name || 'Main Ward'
  const room = patient.room || '—'
  const bed = patient.bed?.bed_number || '—'

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Visiting</p>
            <h2 className="text-white font-black text-base">{patient.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <FaXmark size={14} />
          </button>
        </div>

        {/* Progress steps */}
        <div className="flex px-5 pt-4 pb-2 gap-2">
          {(['form', 'confirm', 'pass'] as ModalStep[]).map((s, i) => (
            <div key={s} className="flex-1 flex items-center gap-1">
              <div className={`h-1.5 flex-1 rounded-full transition-all ${
                step === s ? 'bg-blue-500' : i < ['form','confirm','pass'].indexOf(step) ? 'bg-blue-300' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            </div>
          ))}
        </div>

        <div className="px-5 pb-5">
          {/* Step 1: Form */}
          {step === 'form' && (
            <div className="space-y-4 mt-2">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Your Details</p>

              {/* Name */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <FaUser size={9} /> Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })) }}
                  placeholder="Your full name"
                  className={`w-full px-3 py-2.5 rounded-xl text-sm border ${errors.name ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'} bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400`}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <FaPhone size={9} /> Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setErrors(prev => ({ ...prev, phone: '' })) }}
                  placeholder="+263 7X XXX XXXX"
                  className={`w-full px-3 py-2.5 rounded-xl text-sm border ${errors.phone ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'} bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400`}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              {/* ID */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <FaIdCard size={10} /> National ID Number
                </label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={e => { setIdNumber(e.target.value); setErrors(prev => ({ ...prev, idNumber: '' })) }}
                  placeholder="e.g. 63-123456A78"
                  className={`w-full px-3 py-2.5 rounded-xl text-sm border ${errors.idNumber ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'} bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400`}
                />
                {errors.idNumber && <p className="text-xs text-red-500 mt-1">{errors.idNumber}</p>}
              </div>

              <button
                onClick={() => validate() && setStep('confirm')}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors"
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-4 mt-2">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Confirm Details</p>

              <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                {[
                  { icon: FaUser, label: 'Your Name', value: name },
                  { icon: FaPhone, label: 'Phone', value: phone },
                  { icon: FaIdCard, label: 'ID Number', value: idNumber },
                  { icon: MdLocalHospital, label: 'Visiting', value: patient.name },
                  { icon: MdBedroomChild, label: 'Location', value: `${wardName} · Room ${room} · Bed ${bed}` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 px-4 py-3">
                    <Icon className="text-blue-500 flex-shrink-0 text-base" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep('form')}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  ← Edit
                </button>
                <button
                  onClick={() => setStep('pass')}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors"
                >
                  Confirm ✓
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Visitor Pass */}
          {step === 'pass' && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <FaCheck className="text-emerald-500" size={14} />
                  Visitor Pass Ready
                </p>
                <button
                  onClick={() => setShowQR(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <FaQrcode size={12} />
                  {showQR ? 'Hide QR' : 'Show QR'}
                </button>
              </div>

              {/* QR Code */}
              {showQR && (
                <div className="flex flex-col items-center gap-2 py-2">
                  <QRCodeSVG data={qrData} />
                  <p className="text-[11px] text-gray-400 text-center">Show this QR at the ward entrance</p>
                </div>
              )}

              {/* Directions */}
              <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 space-y-2">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-sm">
                  <FaLocationDot size={14} />
                  Directions to Patient
                </div>
                <div className="space-y-1.5 text-sm text-blue-800 dark:text-blue-300">
                  <p>1. Enter through the <strong>Main Entrance</strong></p>
                  <p>2. Proceed to <strong>{wardName}</strong></p>
                  <p>3. Ask staff for <strong>Room {room}</strong></p>
                  <p>4. Find <strong>Bed {bed}</strong></p>
                </div>
              </div>

              {/* ID Reminder */}
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 flex items-center gap-3">
                <FaTriangleExclamation className="text-amber-500 flex-shrink-0" size={16} />
                <div>
                  <p className="text-xs font-black text-amber-700 dark:text-amber-400">Bring Your ID</p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-0.5">
                    Please bring your ID (<strong>{idNumber}</strong>) when visiting the room. Staff may ask to verify.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold text-sm transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function KioskVisit() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Patient[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  // Fetch all admitted patients on mount
  useEffect(() => {
    setLoading(true)
    fetch('/api/patients')
      .then(res => res.json())
      .then(data => { setResults(data); setLoading(false) })
      .catch(() => { setResults([]); setLoading(false) })
  }, [])

  const searchPatient = async () => {
    if (!search.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/patients?search=${encodeURIComponent(search)}`)
      const data = await res.json()
      setResults(data)
    } catch {
      setResults([])
    }
    setLoading(false)
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
        <div className="max-w-lg mx-auto space-y-4">
          {/* Search */}
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

          {/* Visiting Hours */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 text-sm text-amber-700 dark:text-amber-400">
            <div className="flex items-center gap-2 font-bold mb-1.5">
              <FaClock size={14} />
              Mutare Provincial Visiting Hours
            </div>
            <p>Mon–Fri: 2PM – 4PM</p>
            <p>Weekends: 10AM – 12PM, 2PM – 4PM</p>
            <p className="mt-1 text-xs opacity-75">Please bring a valid ID when visiting.</p>
          </div>

          {/* Results */}
          {results !== null && (
            <div className="space-y-3">
              {results.length > 0 ? results.map((patient) => (
                <div key={patient.id} className="bg-white dark:bg-gray-800/90 rounded-2xl shadow-sm p-5 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <MdLocalHospital className="text-blue-600 text-xl" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{patient.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Admitted {new Date(patient.admissionDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm mb-3 pl-1">
                    <p className="text-gray-600 dark:text-gray-300">
                      <strong>Ward:</strong> {patient.ward?.name || '—'}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      <strong>Room:</strong> {patient.room || '—'}, &nbsp;
                      <strong>Bed:</strong> {patient.bed?.bed_number || '—'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold ${
                      patient.visitorsAllowed
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    }`}>
                      {patient.visitorsAllowed ? <FaCheck size={12} /> : <FaXmark size={12} />}
                      {patient.visitorsAllowed ? 'Visitors Allowed' : 'No Visitors Currently'}
                    </div>

                    {patient.visitorsAllowed && (
                      <button
                        onClick={() => setSelectedPatient(patient)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-bold transition-all shadow-sm flex items-center gap-2"
                      >
                        <FaLocationDot size={12} />
                        Visit Now
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 bg-white dark:bg-gray-800/90 rounded-2xl">
                  <MdPersonSearch className="text-4xl text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">No patients found. Check the name and try again.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Visitor Modal */}
      {selectedPatient && (
        <VisitorModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </div>
  )
}
