'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────
interface DoctorProfile {
  id: string
  latitude: number | null
  longitude: number | null
  is_activated: boolean
  user: {
    name: string
    email: string
    profile_image: string | null
    password_changed: boolean
  }
}

type StepKey = 'photo' | 'location' | 'password'

// ─── Helper: resize image to 400×400 jpeg base64 ─────────────────────────────
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const SIZE = 400
        const canvas = document.createElement('canvas')
        canvas.width = SIZE
        canvas.height = SIZE
        const ctx = canvas.getContext('2d')!
        const scale = Math.max(SIZE / img.width, SIZE / img.height)
        const sw = img.width * scale
        const sh = img.height * scale
        ctx.drawImage(img, (SIZE - sw) / 2, (SIZE - sh) / 2, sw, sh)
        resolve(canvas.toDataURL('image/jpeg', 0.75))
      }
      img.onerror = reject
      img.src = ev.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepDot({ label, done, active, idx }: { label: string; done: boolean; active: boolean; idx: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[60px]">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-all
        ${done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
          active ? 'bg-[#003d73] text-white shadow-lg shadow-blue-900/30' :
          'bg-gray-100 dark:bg-[#222] text-gray-400 dark:text-gray-600'}`}>
        {done
          ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          : idx + 1}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-wider text-center
        ${done ? 'text-emerald-600 dark:text-emerald-400' : active ? 'text-[#003d73] dark:text-blue-400' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DoctorSetup() {
  const router = useRouter()
  const [profile, setProfile] = useState<DoctorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState<StepKey>('photo')

  // Photo step
  const fileRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoSaving, setPhotoSaving] = useState(false)
  const [photoError, setPhotoError] = useState('')

  // Location step
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [coordsManual, setCoordsManual] = useState({ lat: '', lon: '' })
  const [locCapturing, setLocCapturing] = useState(false)
  const [locError, setLocError] = useState('')
  const [locSaving, setLocSaving] = useState(false)

  // Password step
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [showPw, setShowPw] = useState(false)

  // Load profile
  const loadProfile = async () => {
    const res = await fetch('/api/doctors/me')
    if (!res.ok) { router.push('/doctor/login'); return }
    const data: DoctorProfile = await res.json()
    setProfile(data)
    if (data.is_activated) { router.push('/doctor/dashboard'); return }
    // Pre-fill if data already exists
    if (data.user.profile_image) setPhotoPreview(data.user.profile_image)
    if (data.latitude != null) setCoords({ lat: data.latitude!, lon: data.longitude! })
    // Jump to first incomplete step
    if (!data.user.profile_image) setActiveStep('photo')
    else if (data.latitude == null) setActiveStep('location')
    else setActiveStep('password')
    setLoading(false)
  }

  useEffect(() => { loadProfile() }, [])

  // ── Step checks ──
  const stepDone: Record<StepKey, boolean> = {
    photo: !!(profile?.user.profile_image),
    location: profile?.latitude != null,
    password: !!(profile?.user.password_changed),
  }

  const completedCount = Object.values(stepDone).filter(Boolean).length

  // ── Photo handlers ──
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError('')
    try {
      const b64 = await resizeImage(file)
      setPhotoPreview(b64)
    } catch { setPhotoError('Could not process image. Try another file.') }
    if (fileRef.current) fileRef.current.value = ''
  }

  const savePhoto = async () => {
    if (!photoPreview) return
    setPhotoSaving(true)
    setPhotoError('')
    const res = await fetch('/api/doctors/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileImage: photoPreview }),
    })
    if (!res.ok) { setPhotoError('Failed to save. Please try again.'); setPhotoSaving(false); return }
    await loadProfile()
    setPhotoSaving(false)
    setActiveStep('location')
  }

  // ── Location handlers ──
  const captureLocation = () => {
    if (!navigator.geolocation) { setLocError('Geolocation is not supported by this browser.'); return }
    setLocCapturing(true)
    setLocError('')
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6))
        const lon = parseFloat(pos.coords.longitude.toFixed(6))
        setCoords({ lat, lon })
        setCoordsManual({ lat: String(lat), lon: String(lon) })
        setLocCapturing(false)
      },
      err => {
        setLocError(err.message || 'Could not get GPS location. Enter coordinates manually.')
        setLocCapturing(false)
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const saveLocation = async () => {
    const lat = coords?.lat ?? parseFloat(coordsManual.lat)
    const lon = coords?.lon ?? parseFloat(coordsManual.lon)
    if (isNaN(lat) || isNaN(lon)) { setLocError('Please enter valid coordinates.'); return }
    setLocSaving(true)
    setLocError('')
    const res = await fetch('/api/doctors/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: lat, longitude: lon }),
    })
    if (!res.ok) { setLocError('Failed to save. Please try again.'); setLocSaving(false); return }
    await loadProfile()
    setLocSaving(false)
    setActiveStep('password')
  }

  // ── Password handler ──
  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    if (pwForm.next.length < 8) { setPwError('New password must be at least 8 characters.'); return }
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match.'); return }
    setPwSaving(true)
    const res = await fetch('/api/doctors/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: pwForm.current, password: pwForm.next }),
    })
    const data = await res.json()
    if (!res.ok) { setPwError(data.error || 'Failed to update password.'); setPwSaving(false); return }
    await loadProfile()
    setPwSaving(false)
  }

  // ─── Loading ───
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="w-8 h-8 rounded-full border-2 border-[#003d73] border-t-transparent animate-spin" />
      </div>
    )
  }

  // ─── Active steps complete ───
  if (completedCount === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] p-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">Account Activated!</h2>
          <p className="text-sm text-gray-500 mb-5">Redirecting to your dashboard…</p>
          <div className="w-6 h-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  const steps: { key: StepKey; label: string }[] = [
    { key: 'photo', label: 'Profile Photo' },
    { key: 'location', label: 'Office Location' },
    { key: 'password', label: 'Set Password' },
  ]

  const mapSrc = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lon - 0.002},${coords.lat - 0.002},${coords.lon + 0.002},${coords.lat + 0.002}&layer=mapnik&marker=${coords.lat},${coords.lon}`
    : null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/coat-of-arms.png" alt="" className="h-12 w-12 object-contain mx-auto mb-3" />
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Account Activation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome, <span className="font-bold text-gray-700 dark:text-gray-300">{profile?.user.name}</span>.
            Complete the steps below to activate your account.
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex items-start justify-center gap-0 mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-start">
              <button
                onClick={() => stepDone[steps[Math.max(0, i - 1)]?.key] || i === 0 ? setActiveStep(s.key) : undefined}
                disabled={i > 0 && !stepDone[steps[i - 1].key]}
                className="disabled:cursor-not-allowed"
              >
                <StepDot label={s.label} done={stepDone[s.key]} active={activeStep === s.key} idx={i} />
              </button>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-16 mt-4 mx-1 rounded transition-colors ${stepDone[s.key] ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-[#222]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step cards */}
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] shadow-xl overflow-hidden">

          {/* ── STEP 1: Photo ── */}
          {activeStep === 'photo' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#003d73] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-black text-gray-900 dark:text-white">Profile Photo</h2>
                  <p className="text-xs text-gray-500">Take a clear photo or upload from your device</p>
                </div>
                {stepDone.photo && <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">✓ Done</span>}
              </div>

              {/* Preview */}
              <div className="flex justify-center mb-5">
                <div className="relative w-36 h-36 rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#1a1a1a] border-2 border-dashed border-gray-300 dark:border-[#333] flex items-center justify-center">
                  {photoPreview
                    ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    : (
                      <div className="text-center">
                        <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-[10px] text-gray-400">No photo yet</span>
                      </div>
                    )
                  }
                </div>
              </div>

              {photoError && <p className="text-xs text-red-600 dark:text-red-400 mb-3 text-center">{photoError}</p>}

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-gray-200 dark:border-[#333] text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Photo
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                </label>
                <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-gray-200 dark:border-[#333] text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Take Photo
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
                </label>
              </div>

              <button
                onClick={savePhoto}
                disabled={!photoPreview || photoSaving}
                className="w-full py-3 rounded-xl bg-[#003d73] hover:bg-[#002d57] disabled:opacity-40 text-white text-sm font-black transition-colors"
              >
                {photoSaving ? 'Saving Photo…' : stepDone.photo ? 'Update & Continue →' : 'Save Photo & Continue →'}
              </button>
            </div>
          )}

          {/* ── STEP 2: Location ── */}
          {activeStep === 'location' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-black text-gray-900 dark:text-white">Office Location</h2>
                  <p className="text-xs text-gray-500">Pin the exact GPS location of your consulting room/office</p>
                </div>
                {stepDone.location && <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">✓ Done</span>}
              </div>

              {/* GPS capture button */}
              <button
                onClick={captureLocation}
                disabled={locCapturing}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold transition-colors mb-4"
              >
                {locCapturing ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                    Detecting your location…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    📍 Capture My Current Location (GPS)
                  </>
                )}
              </button>

              {/* Manual entry */}
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Or enter manually</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">Latitude</label>
                  <input
                    type="number" step="any" placeholder="-18.9230"
                    value={coordsManual.lat}
                    onChange={e => {
                      setCoordsManual(m => ({ ...m, lat: e.target.value }))
                      const v = parseFloat(e.target.value)
                      if (!isNaN(v)) setCoords(c => c ? { ...c, lat: v } : { lat: v, lon: 0 })
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1">Longitude</label>
                  <input
                    type="number" step="any" placeholder="32.4740"
                    value={coordsManual.lon}
                    onChange={e => {
                      setCoordsManual(m => ({ ...m, lon: e.target.value }))
                      const v = parseFloat(e.target.value)
                      if (!isNaN(v)) setCoords(c => c ? { ...c, lon: v } : { lat: 0, lon: v })
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Map preview */}
              {mapSrc && (
                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-[#333] mb-4">
                  <iframe src={mapSrc} width="100%" height="200" className="block" title="Office location map" />
                  <div className="px-3 py-2 bg-gray-50 dark:bg-[#1a1a1a] flex items-center gap-2">
                    <svg className="w-3 h-3 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[11px] font-mono text-gray-500">{coords?.lat.toFixed(6)}, {coords?.lon.toFixed(6)}</span>
                  </div>
                </div>
              )}

              {locError && <p className="text-xs text-red-600 dark:text-red-400 mb-3">{locError}</p>}

              <button
                onClick={saveLocation}
                disabled={!coords || locSaving}
                className="w-full py-3 rounded-xl bg-[#003d73] hover:bg-[#002d57] disabled:opacity-40 text-white text-sm font-black transition-colors"
              >
                {locSaving ? 'Saving Location…' : stepDone.location ? 'Update & Continue →' : 'Save Location & Continue →'}
              </button>
            </div>
          )}

          {/* ── STEP 3: Password ── */}
          {activeStep === 'password' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-black text-gray-900 dark:text-white">Set Your Password</h2>
                  <p className="text-xs text-gray-500">Replace your default ID-number password with a secure one</p>
                </div>
                {stepDone.password && <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">✓ Done</span>}
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-5">
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  <strong>Current password</strong> is your ID number (lowercase, no spaces) as set by your administrator.
                </p>
              </div>

              <form onSubmit={savePassword} className="space-y-3">
                <div className="relative">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Current Password (your ID number)</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={pwForm.current}
                    onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                    placeholder="Enter current password"
                    required
                    className="w-full px-3 py-2.5 pr-10 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-[32px] text-gray-400 hover:text-gray-600">
                    {showPw
                      ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">New Password</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={pwForm.next}
                    onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                    placeholder="Minimum 8 characters"
                    required minLength={8}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {/* Password strength */}
                  {pwForm.next && (
                    <div className="flex gap-1 mt-1.5">
                      {[1, 2, 3, 4].map(i => {
                        const strength = Math.min(
                          (pwForm.next.length >= 8 ? 1 : 0) +
                          (/[A-Z]/.test(pwForm.next) ? 1 : 0) +
                          (/[0-9]/.test(pwForm.next) ? 1 : 0) +
                          (/[^A-Za-z0-9]/.test(pwForm.next) ? 1 : 0),
                          4
                        )
                        return <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-500'][strength] : 'bg-gray-200 dark:bg-[#333]'}`} />
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={pwForm.confirm}
                    onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                    placeholder="Re-enter new password"
                    required
                    className={`w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors
                      ${pwForm.confirm && pwForm.confirm !== pwForm.next ? 'border-red-400 dark:border-red-700' : 'border-gray-200 dark:border-[#333]'}`}
                  />
                </div>

                {pwError && <p className="text-xs text-red-600 dark:text-red-400">{pwError}</p>}

                <button
                  type="submit"
                  disabled={pwSaving}
                  className="w-full py-3 rounded-xl bg-[#003d73] hover:bg-[#002d57] disabled:opacity-40 text-white text-sm font-black transition-colors mt-1"
                >
                  {pwSaving ? 'Setting Password…' : 'Set Password & Activate Account →'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Progress footer */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">{completedCount} of 3 steps completed</p>
          {completedCount > 0 && (
            <div className="flex justify-center gap-1 mt-2">
              {steps.map(s => (
                <div key={s.key} className={`h-1 w-12 rounded-full transition-colors ${stepDone[s.key] ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-[#222]'}`} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
