'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'

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

const HOSPITAL_LAT = parseFloat(process.env.NEXT_PUBLIC_HOSPITAL_LAT || '-18.963803')
const HOSPITAL_LNG = parseFloat(process.env.NEXT_PUBLIC_HOSPITAL_LNG || '32.663295')
const MAPS_KEY     = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

// ─── Helper: resize image to 400x400 jpeg base64 ─────────────────────────────
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const SIZE = 400
        const canvas = document.createElement('canvas')
        canvas.width = SIZE; canvas.height = SIZE
        const ctx = canvas.getContext('2d')!
        const scale = Math.max(SIZE / img.width, SIZE / img.height)
        const sw = img.width * scale, sh = img.height * scale
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

// ─── Map Pin Modal ────────────────────────────────────────────────────────────
function MapPinModal({
  initial,
  onConfirm,
  onClose,
}: {
  initial: { lat: number; lon: number } | null
  onConfirm: (lat: number, lon: number) => void
  onClose: () => void
}) {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef    = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const [pinned, setPinned] = useState<{ lat: number; lon: number } | null>(initial)
  const [mapsReady, setMapsReady] = useState(typeof window !== 'undefined' && !!(window as any).google?.maps)

  const initMap = () => {
    if (!mapDivRef.current || !(window as any).google?.maps) return
    const center = initial
      ? { lat: initial.lat, lng: initial.lon }
      : { lat: HOSPITAL_LAT, lng: HOSPITAL_LNG }

    const map = new google.maps.Map(mapDivRef.current, {
      center, zoom: 18,
      disableDefaultUI: false,
      fullscreenControl: false,
      streetViewControl: false,
      mapTypeControl: false,
    })
    mapRef.current = map

    if (initial) {
      const m = new google.maps.Marker({ position: center, map, draggable: true, title: 'Your office' })
      markerRef.current = m
      m.addListener('dragend', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return
        setPinned({ lat: parseFloat(e.latLng.lat().toFixed(6)), lon: parseFloat(e.latLng.lng().toFixed(6)) })
      })
    }

    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return
      const lat = parseFloat(e.latLng.lat().toFixed(6))
      const lon = parseFloat(e.latLng.lng().toFixed(6))
      setPinned({ lat, lon })
      if (markerRef.current) {
        markerRef.current.setPosition({ lat, lng: lon })
      } else {
        markerRef.current = new google.maps.Marker({ position: { lat, lng: lon }, map, draggable: true, title: 'Your office' })
        markerRef.current.addListener('dragend', (ev: google.maps.MapMouseEvent) => {
          if (!ev.latLng) return
          setPinned({ lat: parseFloat(ev.latLng.lat().toFixed(6)), lon: parseFloat(ev.latLng.lng().toFixed(6)) })
        })
      }
    })
  }

  useEffect(() => {
    if (mapsReady) { initMap(); return }
    const t = setInterval(() => {
      if ((window as any).google?.maps) { clearInterval(t); setMapsReady(true) }
    }, 200)
    return () => clearInterval(t)
  }, [])

  useEffect(() => { if (mapsReady) initMap() }, [mapsReady])

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#141414] rounded-2xl w-full max-w-xl shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#222] flex-shrink-0">
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white">Pin Your Office Location</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Click anywhere on the map or drag the pin to your exact office/room</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#222] transition-colors ml-3">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div ref={mapDivRef} className="flex-1" style={{ minHeight: 340 }}>
          {!mapsReady && (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-[#1a1a1a]" style={{ minHeight: 340 }}>
              <div className="w-6 h-6 rounded-full border-2 border-[#003d73] border-t-transparent animate-spin" />
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t border-gray-100 dark:border-[#222] flex-shrink-0">
          {pinned ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">Pinned Location</p>
                <p className="text-xs font-mono text-gray-700 dark:text-gray-300">{pinned.lat.toFixed(6)}, {pinned.lon.toFixed(6)}</p>
              </div>
              <button onClick={() => onConfirm(pinned.lat, pinned.lon)}
                className="px-5 py-2.5 rounded-xl bg-[#003d73] hover:bg-[#002d57] text-white text-sm font-black transition-colors flex-shrink-0">
                Use This Location
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-1">Tap anywhere on the map to drop a pin</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DoctorSetup() {
  const router = useRouter()
  const [profile, setProfile] = useState<DoctorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState<StepKey>('photo')

  const fileRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoSaving, setPhotoSaving] = useState(false)
  const [photoError, setPhotoError] = useState('')

  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [coordsManual, setCoordsManual] = useState({ lat: '', lon: '' })
  const [locCapturing, setLocCapturing] = useState(false)
  const [locError, setLocError] = useState('')
  const [locSaving, setLocSaving] = useState(false)
  const [showMapPicker, setShowMapPicker] = useState(false)

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const loadProfile = async () => {
    const res = await fetch('/api/doctors/me')
    if (!res.ok) { router.push('/doctor/login'); return }
    const data: DoctorProfile = await res.json()
    setProfile(data)
    if (data.is_activated) { router.push('/doctor/dashboard'); return }
    if (data.user.profile_image) setPhotoPreview(data.user.profile_image)
    if (data.latitude != null) {
      setCoords({ lat: data.latitude!, lon: data.longitude! })
      setCoordsManual({ lat: String(data.latitude), lon: String(data.longitude!) })
    }
    if (!data.user.profile_image) setActiveStep('photo')
    else if (data.latitude == null) setActiveStep('location')
    else setActiveStep('password')
    setLoading(false)
  }

  useEffect(() => { loadProfile() }, [])

  const stepDone: Record<StepKey, boolean> = {
    photo:    !!(profile?.user.profile_image),
    location: profile?.latitude != null,
    password: !!(profile?.user.password_changed),
  }
  const completedCount = Object.values(stepDone).filter(Boolean).length

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setPhotoError('')
    try { setPhotoPreview(await resizeImage(file)) }
    catch { setPhotoError('Could not process image. Try another file.') }
    if (fileRef.current) fileRef.current.value = ''
  }

  const savePhoto = async () => {
    if (!photoPreview) return
    setPhotoSaving(true); setPhotoError('')
    const res = await fetch('/api/doctors/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileImage: photoPreview }) })
    if (!res.ok) { setPhotoError('Failed to save. Please try again.'); setPhotoSaving(false); return }
    await loadProfile(); setPhotoSaving(false); setActiveStep('location')
  }

  const applyCoords = (lat: number, lon: number) => {
    setCoords({ lat, lon })
    setCoordsManual({ lat: String(lat), lon: String(lon) })
    setLocError('')
  }

  const captureLocation = () => {
    if (!navigator.geolocation) { setLocError('Geolocation not supported on this device.'); return }
    setLocCapturing(true); setLocError('')
    navigator.geolocation.getCurrentPosition(
      pos => { applyCoords(parseFloat(pos.coords.latitude.toFixed(6)), parseFloat(pos.coords.longitude.toFixed(6))); setLocCapturing(false) },
      err => { setLocError(err.message || 'Could not get GPS location.'); setLocCapturing(false) },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const saveLocation = async () => {
    const lat = coords?.lat ?? parseFloat(coordsManual.lat)
    const lon = coords?.lon ?? parseFloat(coordsManual.lon)
    if (isNaN(lat) || isNaN(lon)) { setLocError('Please provide valid coordinates.'); return }
    setLocSaving(true); setLocError('')
    const res = await fetch('/api/doctors/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ latitude: lat, longitude: lon }) })
    if (!res.ok) { setLocError('Failed to save. Please try again.'); setLocSaving(false); return }
    await loadProfile(); setLocSaving(false); setActiveStep('password')
  }

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setPwError('')
    if (pwForm.next.length < 8) { setPwError('New password must be at least 8 characters.'); return }
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match.'); return }
    setPwSaving(true)
    const res = await fetch('/api/doctors/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: pwForm.current, password: pwForm.next }) })
    const data = await res.json()
    if (!res.ok) { setPwError(data.error || 'Failed to update password.'); setPwSaving(false); return }
    await loadProfile(); setPwSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="w-8 h-8 rounded-full border-2 border-[#003d73] border-t-transparent animate-spin" />
    </div>
  )

  if (completedCount === 3) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] p-6">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">Account Activated!</h2>
        <p className="text-sm text-gray-500 mb-5">Redirecting to your dashboard...</p>
        <div className="w-6 h-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
      </div>
    </div>
  )

  const steps: { key: StepKey; label: string }[] = [
    { key: 'photo',    label: 'Profile Photo' },
    { key: 'location', label: 'Office Location' },
    { key: 'password', label: 'Set Password' },
  ]

  const mapPreviewSrc = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lon - 0.001},${coords.lat - 0.001},${coords.lon + 0.001},${coords.lat + 0.001}&layer=mapnik&marker=${coords.lat},${coords.lon}`
    : null

  return (
    <>
      {MAPS_KEY && <Script src={`https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`} strategy="lazyOnload" />}

      {showMapPicker && (
        <MapPinModal
          initial={coords}
          onConfirm={(lat, lon) => { applyCoords(lat, lon); setShowMapPicker(false) }}
          onClose={() => setShowMapPicker(false)}
        />
      )}

      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] overflow-y-auto">
        <div className="w-full max-w-lg mx-auto px-4 py-8">

          <div className="text-center mb-7">
            <img src="/coat-of-arms.png" alt="" className="h-12 w-12 object-contain mx-auto mb-3" />
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Account Activation</h1>
            <p className="text-sm text-gray-500 mt-1">
              Welcome, <span className="font-bold text-gray-700 dark:text-gray-300">{profile?.user.name}</span>. Complete all 3 steps to activate your account.
            </p>
          </div>

          <div className="flex items-start justify-center gap-0 mb-6">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-start">
                <button
                  onClick={() => (i === 0 || stepDone[steps[i - 1].key]) ? setActiveStep(s.key) : undefined}
                  disabled={i > 0 && !stepDone[steps[i - 1].key]}
                  className="disabled:cursor-not-allowed"
                >
                  <StepDot label={s.label} done={stepDone[s.key]} active={activeStep === s.key} idx={i} />
                </button>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 w-14 mt-4 mx-1 rounded transition-colors ${stepDone[s.key] ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-[#222]'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] shadow-xl">

            {activeStep === 'photo' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-[#003d73] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-black text-gray-900 dark:text-white">Profile Photo</h2>
                    <p className="text-xs text-gray-500">Upload or take a clear headshot photo</p>
                  </div>
                  {stepDone.photo && <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex-shrink-0">Done</span>}
                </div>
                <div className="flex justify-center mb-4">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#1a1a1a] border-2 border-dashed border-gray-300 dark:border-[#333] flex items-center justify-center">
                    {photoPreview
                      ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      : <div className="text-center px-2">
                          <svg className="w-9 h-9 text-gray-300 dark:text-gray-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          <span className="text-[10px] text-gray-400">No photo yet</span>
                        </div>
                    }
                  </div>
                </div>
                {photoError && <p className="text-xs text-red-600 dark:text-red-400 mb-3 text-center">{photoError}</p>}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-gray-200 dark:border-[#333] text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Upload Photo
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                  </label>
                  <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-gray-200 dark:border-[#333] text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Take Photo
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
                  </label>
                </div>
                <button onClick={savePhoto} disabled={!photoPreview || photoSaving}
                  className="w-full py-3 rounded-xl bg-[#003d73] hover:bg-[#002d57] disabled:opacity-40 text-white text-sm font-black transition-colors">
                  {photoSaving ? 'Saving Photo...' : stepDone.photo ? 'Update & Continue' : 'Save Photo & Continue'}
                </button>
              </div>
            )}

            {activeStep === 'location' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-black text-gray-900 dark:text-white">Office / Room Location</h2>
                    <p className="text-xs text-gray-500">Pin your consulting room — even if you are not there right now</p>
                  </div>
                  {stepDone.location && <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex-shrink-0">Done</span>}
                </div>

                <button onClick={() => setShowMapPicker(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#003d73] hover:bg-[#002d57] text-white text-sm font-bold transition-colors mb-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Pin Location on Map
                </button>

                <div className="flex items-center gap-2 mb-3">
                  <button onClick={captureLocation} disabled={locCapturing}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] disabled:opacity-50 transition-colors">
                    {locCapturing
                      ? <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                      : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2M2 12h2m16 0h2" /></svg>
                    }
                    Use My GPS Now
                  </button>
                  <span className="text-[10px] text-gray-400 font-bold">OR</span>
                  <span className="flex-1 text-[10px] text-gray-400 text-center">Enter coordinates below</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Latitude</label>
                    <input type="number" step="any" placeholder="-18.9230" value={coordsManual.lat}
                      onChange={e => { setCoordsManual(m => ({ ...m, lat: e.target.value })); const v = parseFloat(e.target.value); if (!isNaN(v)) setCoords(c => ({ lat: v, lon: c?.lon ?? 0 })) }}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Longitude</label>
                    <input type="number" step="any" placeholder="32.4740" value={coordsManual.lon}
                      onChange={e => { setCoordsManual(m => ({ ...m, lon: e.target.value })); const v = parseFloat(e.target.value); if (!isNaN(v)) setCoords(c => ({ lat: c?.lat ?? 0, lon: v })) }}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>

                {mapPreviewSrc && (
                  <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-[#333] mb-3">
                    <iframe src={mapPreviewSrc} width="100%" height="160" className="block" title="Location preview" />
                    <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/20 flex items-center gap-2">
                      <svg className="w-3 h-3 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                      <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">{coords?.lat.toFixed(6)}, {coords?.lon.toFixed(6)}</span>
                      <button onClick={() => setShowMapPicker(true)} className="ml-auto text-[10px] font-bold text-[#003d73] dark:text-blue-400 hover:underline">Adjust pin</button>
                    </div>
                  </div>
                )}

                {locError && <p className="text-xs text-red-600 dark:text-red-400 mb-3">{locError}</p>}

                <button onClick={saveLocation} disabled={!coords || locSaving}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-black transition-colors">
                  {locSaving ? 'Saving Location...' : stepDone.location ? 'Update & Continue' : 'Save Location & Continue'}
                </button>
              </div>
            )}

            {activeStep === 'password' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-black text-gray-900 dark:text-white">Set Your Password</h2>
                    <p className="text-xs text-gray-500">Replace your default ID-number password with a secure one</p>
                  </div>
                  {stepDone.password && <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex-shrink-0">Done</span>}
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4">
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    Your <strong>current password</strong> is your ID number (lowercase, no spaces) as set by the administrator.
                  </p>
                </div>
                <form onSubmit={savePassword} className="space-y-3">
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Current Password</label>
                    <input type={showPw ? 'text' : 'password'} value={pwForm.current}
                      onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                      placeholder="Your ID number (lowercase)" required
                      className="w-full px-3 py-2.5 pr-10 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-[30px] text-gray-400 hover:text-gray-600">
                      {showPw
                        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                    </button>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">New Password</label>
                    <input type={showPw ? 'text' : 'password'} value={pwForm.next}
                      onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                      placeholder="Minimum 8 characters" required minLength={8}
                      className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    {pwForm.next && (
                      <div className="flex gap-1 mt-1.5">
                        {[1,2,3,4].map(i => {
                          const s = Math.min(
                            (pwForm.next.length >= 8 ? 1 : 0)+(/[A-Z]/.test(pwForm.next) ? 1 : 0)+(/[0-9]/.test(pwForm.next) ? 1 : 0)+(/[^A-Za-z0-9]/.test(pwForm.next) ? 1 : 0), 4)
                          return <div key={i} className={`h-1 flex-1 rounded-full ${i <= s ? ['','bg-red-400','bg-amber-400','bg-emerald-400','bg-emerald-500'][s] : 'bg-gray-200 dark:bg-[#333]'}`} />
                        })}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                    <input type={showPw ? 'text' : 'password'} value={pwForm.confirm}
                      onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                      placeholder="Re-enter new password" required
                      className={`w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500
                        ${pwForm.confirm && pwForm.confirm !== pwForm.next ? 'border-red-400 dark:border-red-700' : 'border-gray-200 dark:border-[#333]'}`} />
                  </div>
                  {pwError && <p className="text-xs text-red-600 dark:text-red-400">{pwError}</p>}
                  <button type="submit" disabled={pwSaving}
                    className="w-full py-3 rounded-xl bg-[#003d73] hover:bg-[#002d57] disabled:opacity-40 text-white text-sm font-black transition-colors">
                    {pwSaving ? 'Setting Password...' : 'Set Password & Activate Account'}
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="mt-4 text-center pb-6">
            <p className="text-xs text-gray-400">{completedCount} of 3 steps completed</p>
            <div className="flex justify-center gap-1 mt-2">
              {steps.map(s => (
                <div key={s.key} className={`h-1 w-12 rounded-full transition-colors ${stepDone[s.key] ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-[#222]'}`} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
