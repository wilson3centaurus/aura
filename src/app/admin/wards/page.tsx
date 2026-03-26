'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

declare global {
  interface Window {
    google: any
    initWardMap: () => void
  }
}

interface AdmittedInfo {
  id: string
  name: string
  admission_date: string
  notes: string | null
}

interface Bed {
  id: string
  bed_number: string
  is_occupied: boolean
  patient?: AdmittedInfo | null
}

interface Ward {
  id: string
  name: string
  ward_type: string
  floor: string
  nurse_in_charge: string | null
  total_beds: number
  latitude: number | null
  longitude: number | null
  beds: Bed[]
  occupied_beds: number
  available_beds: number
}

const ADMISSION_REASONS = [
  'Malaria', 'Typhoid Fever', 'Pneumonia', 'Tuberculosis (TB)', 'HIV/AIDS Complications',
  'Cholera / Diarrhoeal Disease', 'Hypertension', 'Diabetes Mellitus',
  'Maternal Complications / Delivery', 'Post-Surgical Recovery',
  'Trauma / Injury', 'Stroke / CVA', 'Severe Anaemia', 'Kidney Disease',
  'Cardiac Failure', 'Respiratory Distress', 'Sepsis / Infection',
  'Paediatric Illness', 'Mental Health Crisis', 'Other',
]

const WARD_TYPES = ['General', 'Medical', 'Maternity', 'Paediatric', 'Surgical', 'ICU', 'Intensive', 'Orthopaedic', 'Isolation', 'Psychiatric', 'Recovery']
const FLOORS = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', 'Basement']

const TYPE_COLORS: Record<string, { dot: string; badge: string }> = {
  Medical:    { dot: 'bg-blue-500',    badge: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' },
  Maternity:  { dot: 'bg-pink-500',    badge: 'bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-400' },
  Surgical:   { dot: 'bg-purple-500',  badge: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400' },
  Paediatric: { dot: 'bg-green-500',   badge: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' },
  ICU:        { dot: 'bg-red-500',     badge: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400' },
  Intensive:  { dot: 'bg-red-500',     badge: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400' },
  General:    { dot: 'bg-gray-400',    badge: 'bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400' },
}

function BedIcon({ occupied, size = 44 }: { occupied: boolean; size?: number }) {
  return occupied ? (
    <svg width={size} height={size} viewBox="0 0 60 56" fill="none">
      {/* Person */}
      <circle cx="19" cy="9" r="6" fill="#ef4444" opacity="0.9" />
      <path d="M10 24 Q19 19 28 24" stroke="#ef4444" strokeWidth="2.5" opacity="0.65" fill="none" strokeLinecap="round" />
      {/* Bed */}
      <rect x="3" y="26" width="4" height="22" rx="2" fill="#ef4444" opacity="0.75" />
      <rect x="7" y="30" width="50" height="13" rx="3" fill="#ef4444" opacity="0.2" />
      <rect x="7" y="32" width="50" height="9" rx="2" fill="#ef4444" opacity="0.5" />
      <rect x="9" y="26" width="20" height="8" rx="4" fill="#ef4444" opacity="0.45" />
      <rect x="11" y="43" width="4" height="7" rx="1.5" fill="#ef4444" opacity="0.5" />
      <rect x="49" y="43" width="4" height="7" rx="1.5" fill="#ef4444" opacity="0.5" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 60 56" fill="none">
      {/* Empty bed */}
      <rect x="3" y="20" width="4" height="28" rx="2" fill="#10b981" opacity="0.75" />
      <rect x="7" y="28" width="50" height="14" rx="3" fill="#10b981" opacity="0.15" />
      <rect x="7" y="30" width="50" height="10" rx="2" fill="#10b981" opacity="0.4" />
      <rect x="9" y="20" width="20" height="10" rx="4" fill="#10b981" opacity="0.4" />
      <rect x="11" y="43" width="4" height="7" rx="1.5" fill="#10b981" opacity="0.5" />
      <rect x="49" y="43" width="4" height="7" rx="1.5" fill="#10b981" opacity="0.5" />
      {/* + available indicator */}
      <path d="M42 30 L42 40 M37 35 L47 35" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  )
}

const GMAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || 'AIzaSyBG5lqhexFFst2w4cc5Nw9OKdo29SAWc9g'

export default function AdminWards() {
  const [wards, setWards] = useState<Ward[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [hoveredBed, setHoveredBed] = useState<Bed | null>(null)
  const [hoveredPos, setHoveredPos] = useState({ x: 0, y: 0 })
  const [saving, setSaving] = useState(false)
  const [admitBed, setAdmitBed] = useState<Bed | null>(null)
  const [admitForm, setAdmitForm] = useState({ name: '', dateOfBirth: '', notes: '' })
  const [admitting, setAdmitting] = useState(false)
  const [dischargeBed, setDischargeBed] = useState<Bed | null>(null)
  const [discharging, setDischarging] = useState(false)
  const [editWard, setEditWard] = useState<Ward | null>(null)
  const [editWardForm, setEditWardForm] = useState({ name: '', wardType: 'General', floor: 'Ground Floor', nurseInCharge: '', totalBeds: '' })
  const [editWardSaving, setEditWardSaving] = useState(false)
  const [deleteWard, setDeleteWard] = useState<Ward | null>(null)
  const [deletingWard, setDeletingWard] = useState(false)
  const [form, setForm] = useState({
    name: '', wardType: 'General', floor: 'Ground Floor',
    nurseInCharge: '', totalBeds: '20', latitude: '', longitude: '',
  })
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [mapReady, setMapReady] = useState(false)

  const loadWards = useCallback(async () => {
    const data = await fetch('/api/wards').then(r => r.json())
    const arr: Ward[] = Array.isArray(data) ? data : []
    setWards(arr)
    if (arr.length > 0 && !selectedWard) {
      loadWardDetail(arr[0].id, arr)
    }
    setLoading(false)
  }, [selectedWard])

  const loadWardDetail = async (wardId: string, wardsArr?: Ward[]) => {
    const src = wardsArr || wards
    const data = await fetch(`/api/wards/${wardId}`).then(r => r.json())
    const beds: Bed[] = data.beds || []
    const occupied = beds.filter(b => b.is_occupied).length
    const updated = src.map(w => w.id === wardId ? {
      ...w, beds, occupied_beds: occupied, available_beds: beds.length - occupied
    } : w)
    setWards(updated)
    setSelectedWard(updated.find(w => w.id === wardId) || null)
  }

  useEffect(() => { loadWards() }, [])

  // Load Google Maps for coord picking
  useEffect(() => {
    if (!showCreateForm) return
    if (window.google?.maps) { initMap(); return }
    if (document.getElementById('gmaps-script')) { setMapReady(true); return }
    window.initWardMap = () => { setMapReady(true) }
    const s = document.createElement('script')
    s.id = 'gmaps-script'
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&callback=initWardMap`
    s.async = true
    document.head.appendChild(s)
  }, [showCreateForm])

  useEffect(() => {
    if (mapReady && showCreateForm && mapRef.current && !mapInstanceRef.current) {
      initMap()
    }
  }, [mapReady, showCreateForm])

  const initMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: -18.9707, lng: 32.6709 },
      zoom: 17,
      mapTypeId: 'satellite',
      disableDefaultUI: true,
    })
    mapInstanceRef.current = map
    map.addListener('click', (e: any) => {
      const lat = e.latLng.lat().toFixed(7)
      const lng = e.latLng.lng().toFixed(7)
      setForm(f => ({ ...f, latitude: lat, longitude: lng }))
      if (markerRef.current) markerRef.current.setMap(null)
      markerRef.current = new window.google.maps.Marker({
        position: e.latLng, map,
        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#ef4444', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
      })
    })
  }

  const addWard = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/wards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          ward_type: form.wardType,
          floor: form.floor,
          nurse_in_charge: form.nurseInCharge,
          total_beds: parseInt(form.totalBeds),
          latitude: form.latitude ? parseFloat(form.latitude) : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null,
        }),
      })
      if (res.ok) {
        setForm({ name: '', wardType: 'General', floor: 'Ground Floor', nurseInCharge: '', totalBeds: '20', latitude: '', longitude: '' })
        setShowCreateForm(false)
        mapInstanceRef.current = null
        loadWards()
      }
    } catch {}
    setSaving(false)
  }

  const admitPatient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!admitBed || !selectedWard) return
    setAdmitting(true)
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: admitForm.name,
          dateOfBirth: admitForm.dateOfBirth || null,
          notes: admitForm.notes || null,
          ward: selectedWard.name,
          room: selectedWard.name,
          bed: admitBed.bed_number,
          wardId: selectedWard.id,
          bedId: admitBed.id,
        }),
      })
      if (res.ok) {
        setAdmitBed(null)
        setAdmitForm({ name: '', dateOfBirth: '', notes: '' })
        await loadWardDetail(selectedWard.id)
      }
    } catch {}
    setAdmitting(false)
  }

  const dischargePatient = async () => {
    if (!dischargeBed?.patient || !selectedWard) return
    setDischarging(true)
    try {
      const res = await fetch(`/api/patients/${dischargeBed.patient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DISCHARGED' }),
      })
      if (res.ok) {
        setDischargeBed(null)
        await loadWardDetail(selectedWard.id)
      }
    } catch {}
    setDischarging(false)
  }

  const openEditWard = (ward: Ward) => {
    setEditWard(ward)
    setEditWardForm({
      name: ward.name,
      wardType: ward.ward_type,
      floor: ward.floor,
      nurseInCharge: ward.nurse_in_charge || '',
      totalBeds: ward.total_beds.toString(),
    })
  }

  const saveEditWard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editWard) return
    setEditWardSaving(true)
    try {
      const res = await fetch(`/api/wards/${editWard.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editWardForm.name,
          wardType: editWardForm.wardType,
          floor: editWardForm.floor,
          nurseInCharge: editWardForm.nurseInCharge,
          totalBeds: parseInt(editWardForm.totalBeds) || editWard.total_beds,
        }),
      })
      if (res.ok) { setEditWard(null); loadWards() }
    } catch {}
    setEditWardSaving(false)
  }

  const confirmDeleteWard = async () => {
    if (!deleteWard) return
    setDeletingWard(true)
    try {
      await fetch(`/api/wards/${deleteWard.id}`, { method: 'DELETE' })
      setDeleteWard(null)
      if (selectedWard?.id === deleteWard.id) setSelectedWard(null)
      loadWards()
    } catch {}
    setDeletingWard(false)
  }

  const totalBeds = wards.reduce((s, w) => s + (w.total_beds || 0), 0)
  const occupiedBeds = wards.reduce((s, w) => s + (w.occupied_beds || 0), 0)
  const availableBeds = totalBeds - occupiedBeds
  const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-[#003d73] border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="max-w-7xl space-y-5">

      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Wards & Beds</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{wards.length} wards · {totalBeds} total beds</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#003d73] hover:bg-[#002d57] text-white text-sm font-bold transition-all shadow-lg shadow-blue-900/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Ward
        </button>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Beds', value: totalBeds, icon: '🛏️', color: 'text-gray-900 dark:text-white' },
          { label: 'Occupied', value: occupiedBeds, icon: '🔴', color: 'text-red-600 dark:text-red-400' },
          { label: 'Available', value: availableBeds, icon: '✅', color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Occupancy', value: `${occupancyPct}%`, icon: '📊', color: occupancyPct > 90 ? 'text-red-600 dark:text-red-400' : occupancyPct > 70 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-4 flex items-center gap-3">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="font-semibold text-gray-700 dark:text-gray-300">Legend:</span>
        {[
          { color: 'bg-emerald-500', label: 'Available' },
          { color: 'bg-red-500', label: 'Occupied' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
            {l.label}
          </div>
        ))}
        <span className="ml-2 text-gray-400">• Hover over a bed to see patient details</span>
      </div>

      {/* Ward tabs + Bed grid */}
      <div className="flex gap-4 min-h-[500px]">

        {/* Ward sidebar */}
        <div className="w-56 flex-shrink-0 space-y-1">
          {wards.map(ward => {
            const pct = ward.total_beds > 0 ? Math.round((ward.occupied_beds / ward.total_beds) * 100) : 0
            const tc = TYPE_COLORS[ward.ward_type] || TYPE_COLORS.General
            const isActive = selectedWard?.id === ward.id
            return (
              <div key={ward.id} className="group relative">
                <button
                  onClick={() => loadWardDetail(ward.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-[#003d73] border-[#003d73] text-white'
                      : 'bg-white dark:bg-[#111] border-gray-200 dark:border-[#222] hover:border-gray-400 dark:hover:border-[#444]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-white' : tc.dot}`} />
                    <span className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {ward.name}
                    </span>
                  </div>
                  <div className={`text-[10px] mb-2 ${isActive ? 'text-white/70' : 'text-gray-500'}`}>
                    {ward.floor}
                  </div>
                  <div className={`text-[10px] font-semibold mb-1.5 ${isActive ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}`}>
                    {ward.occupied_beds}/{ward.total_beds} beds
                  </div>
                  <div className={`h-1 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-[#222]'}`}>
                    <div
                      className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-400' : isActive ? 'bg-white' : 'bg-emerald-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
                {/* Edit/Delete buttons on hover */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => { e.stopPropagation(); openEditWard(ward) }}
                    className="w-6 h-6 rounded-md bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm"
                    title="Edit ward"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteWard(ward) }}
                    className="w-6 h-6 rounded-md bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] flex items-center justify-center text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm"
                    title="Delete ward"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bed grid */}
        <div className="flex-1 bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-5 relative">
          {!selectedWard ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <span className="text-5xl block mb-3">🛏️</span>
                <p className="text-sm">Select a ward to view beds</p>
              </div>
            </div>
          ) : (
            <>
              {/* Ward info header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-base font-black text-gray-900 dark:text-white">{selectedWard.name}</h2>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(TYPE_COLORS[selectedWard.ward_type] || TYPE_COLORS.General).badge}`}>
                      {selectedWard.ward_type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {selectedWard.floor}
                    {selectedWard.nurse_in_charge && <> · Nurse: <strong>{selectedWard.nurse_in_charge}</strong></>}
                  </p>
                  {selectedWard.latitude && (
                    <p className="text-[10px] text-blue-500 mt-0.5">
                      📍 {selectedWard.latitude.toFixed(5)}, {selectedWard.longitude?.toFixed(5)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-2xl font-black text-red-600 dark:text-red-400">{selectedWard.occupied_beds}</p>
                    <p className="text-[10px] text-gray-500">Occupied</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{selectedWard.available_beds}</p>
                    <p className="text-[10px] text-gray-500">Available</p>
                  </div>
                  <div className="min-w-[80px]">
                    {(() => {
                      const pct = selectedWard.total_beds > 0 ? Math.round((selectedWard.occupied_beds / selectedWard.total_beds) * 100) : 0
                      return (
                        <>
                          <p className={`text-2xl font-black ${pct > 90 ? 'text-red-600 dark:text-red-400' : pct > 70 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{pct}%</p>
                          <div className="h-1.5 bg-gray-100 dark:bg-[#222] rounded-full mt-1 w-20">
                            <div className={`h-full rounded-full transition-all ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">Occupancy</p>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Bed grid */}
              {!selectedWard.beds || selectedWard.beds.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <span className="text-5xl mb-3">🛏️</span>
                  <p className="text-sm">No beds loaded yet</p>
                  <p className="text-xs text-gray-400 mt-1">Beds are auto-created when a ward is added</p>
                </div>
              ) : (
                <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))' }}>
                  {selectedWard.beds.map(bed => {
                    const occupied = bed.is_occupied
                    return (
                      <div
                        key={bed.id}
                        onMouseEnter={e => {
                          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                          setHoveredPos({ x: rect.right + 8, y: rect.top })
                          setHoveredBed(bed)
                        }}
                        onMouseLeave={() => setHoveredBed(null)}
                        onClick={() => {
                          setHoveredBed(null)
                          if (bed.is_occupied) setDischargeBed(bed)
                          else setAdmitBed(bed)
                        }}
                        className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                          occupied
                            ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-950/30 hover:border-red-500'
                            : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 hover:border-emerald-500'
                        }`}
                      >
                        <BedIcon occupied={occupied} size={40} />
                        <p className={`text-[10px] font-bold mt-1 ${occupied ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                          {bed.bed_number}
                        </p>
                        {occupied && bed.patient && (
                          <p className="text-[8px] text-red-600 dark:text-red-500 font-medium truncate w-full text-center leading-tight">
                            {bed.patient.name.split(' ')[0]}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* Hover tooltip */}
          {hoveredBed && (
            <div
              className="fixed z-50 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl p-3 shadow-2xl text-xs w-52 pointer-events-none"
              style={{ left: hoveredPos.x, top: hoveredPos.y }}
            >
              <p className="font-black text-sm mb-1.5">Bed {hoveredBed.bed_number}</p>
              {hoveredBed.is_occupied && hoveredBed.patient ? (
                <>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="font-bold text-red-300 dark:text-red-700 text-[10px]">OCCUPIED</span>
                  </div>
                  <p className="font-semibold">{hoveredBed.patient.name}</p>
                  <p className="text-white/60 dark:text-gray-500 mt-0.5 text-[10px]">
                    Admitted: {new Date(hoveredBed.patient.admission_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  {selectedWard?.nurse_in_charge && (
                    <p className="text-white/60 dark:text-gray-500 text-[10px]">Nurse: {selectedWard.nurse_in_charge}</p>
                  )}
                  {hoveredBed.patient.notes && (
                    <p className="text-white/50 dark:text-gray-400 text-[10px] mt-1 italic">"{hoveredBed.patient.notes}"</p>
                  )}
                  <div className="mt-2 pt-2 border-t border-white/10 dark:border-gray-200 text-[10px] text-red-300 dark:text-red-600 font-semibold">
                    Click to discharge
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-emerald-300 dark:text-emerald-700 text-[10px]">AVAILABLE</span>
                  </div>
                  <div className="text-[10px] text-emerald-300 dark:text-emerald-600 font-semibold">
                    Click to admit a patient
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Ward Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-200 dark:border-[#282828] shadow-2xl w-full max-w-2xl my-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-[#222]">
              <h3 className="text-base font-black text-gray-900 dark:text-white">Create New Ward</h3>
              <button
                onClick={() => { setShowCreateForm(false); mapInstanceRef.current = null }}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#222] text-gray-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={addWard} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Ward Name</label>
                  <input
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                    placeholder="e.g. Female Medical Ward"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Ward Type</label>
                  <select value={form.wardType} onChange={e => setForm({ ...form, wardType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {WARD_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Floor</label>
                  <select value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {FLOORS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Nurse in Charge</label>
                  <input value={form.nurseInCharge} onChange={e => setForm({ ...form, nurseInCharge: e.target.value })}
                    placeholder="Sister Moyo"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Number of Beds</label>
                  <input type="number" min="1" max="200" value={form.totalBeds} onChange={e => setForm({ ...form, totalBeds: e.target.value })} required
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Coordinate fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Latitude</label>
                  <input value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })}
                    placeholder="Click map to capture"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Longitude</label>
                  <input value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })}
                    placeholder="Click map to capture"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                </div>
              </div>

              {/* Mini Map */}
              <div>
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Click map to set ward location 
                  {form.latitude && <span className="ml-2 font-mono text-blue-600 dark:text-blue-400 font-normal normal-case">📍 {form.latitude}, {form.longitude}</span>}
                </p>
                <div ref={mapRef} className="w-full h-48 rounded-xl overflow-hidden border border-gray-200 dark:border-[#333] bg-gray-100 dark:bg-[#1a1a1a]">
                  {!mapReady && !window.google?.maps && (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading map...</div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowCreateForm(false); mapInstanceRef.current = null }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-[#003d73] hover:bg-[#002d57] text-white text-sm font-bold transition-colors disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create Ward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admit Patient Modal */}
      {admitBed && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-200 dark:border-[#282828] shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white">Admit Patient</h3>
                <p className="text-xs text-gray-500 mt-0.5">Bed {admitBed.bed_number} · {selectedWard?.name}</p>
              </div>
              <button onClick={() => setAdmitBed(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#222] text-gray-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={admitPatient} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Patient Name *</label>
                <input
                  value={admitForm.name}
                  onChange={e => setAdmitForm(f => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="Full name"
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Date of Birth</label>
                <input
                  type="date"
                  value={admitForm.dateOfBirth}
                  onChange={e => setAdmitForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Reason for Admission / Diagnosis</label>
                <select
                  value={admitForm.notes}
                  onChange={e => setAdmitForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                >
                  <option value="">Select a condition...</option>
                  {ADMISSION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <input
                  value={admitForm.notes === ADMISSION_REASONS.find(r => r === admitForm.notes) ? '' : admitForm.notes}
                  onChange={e => setAdmitForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Or type a custom diagnosis / notes..."
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setAdmitBed(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={admitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#003d73] hover:bg-[#002d57] text-white text-sm font-bold transition-colors disabled:opacity-50">
                  {admitting ? 'Admitting...' : 'Admit Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discharge Confirmation Modal */}
      {dischargeBed && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-200 dark:border-[#282828] shadow-2xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">Discharge Patient?</h3>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-0.5">{dischargeBed.patient?.name}</p>
              <p className="text-xs text-gray-500">Bed {dischargeBed.bed_number} · {selectedWard?.name}</p>
              {dischargeBed.patient?.admission_date && (
                <p className="text-xs text-gray-400 mt-1">
                  Admitted {new Date(dischargeBed.patient.admission_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-3">This will free up the bed and mark the patient as discharged.</p>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setDischargeBed(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                  Cancel
                </button>
                <button onClick={dischargePatient} disabled={discharging}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
                  {discharging ? 'Discharging...' : 'Confirm Discharge'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Ward Modal */}
      {editWard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-200 dark:border-[#282828] shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white">Edit Ward</h3>
                <p className="text-xs text-gray-500 mt-0.5">{editWard.name}</p>
              </div>
              <button onClick={() => setEditWard(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#222] text-gray-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={saveEditWard} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Ward Name</label>
                <input value={editWardForm.name} onChange={e => setEditWardForm(f => ({ ...f, name: e.target.value }))} required
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Ward Type</label>
                  <select value={editWardForm.wardType} onChange={e => setEditWardForm(f => ({ ...f, wardType: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {WARD_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Floor</label>
                  <select value={editWardForm.floor} onChange={e => setEditWardForm(f => ({ ...f, floor: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {FLOORS.map(fl => <option key={fl}>{fl}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Nurse in Charge</label>
                <input value={editWardForm.nurseInCharge} onChange={e => setEditWardForm(f => ({ ...f, nurseInCharge: e.target.value }))}
                  placeholder="Sister Moyo"
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">Total Beds</label>
                <input
                  type="number" min="1" max="300"
                  value={editWardForm.totalBeds}
                  onChange={e => setEditWardForm(f => ({ ...f, totalBeds: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {editWard && parseInt(editWardForm.totalBeds) !== editWard.total_beds && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                    {parseInt(editWardForm.totalBeds) > editWard.total_beds
                      ? `Will add ${parseInt(editWardForm.totalBeds) - editWard.total_beds} new beds`
                      : `Will remove up to ${editWard.total_beds - parseInt(editWardForm.totalBeds)} unoccupied beds`}
                  </p>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditWard(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={editWardSaving}
                  className="flex-1 py-2.5 rounded-xl bg-[#003d73] hover:bg-[#002d57] text-white text-sm font-bold transition-colors disabled:opacity-50">
                  {editWardSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Ward Confirmation */}
      {deleteWard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-200 dark:border-[#282828] shadow-2xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">Delete Ward?</h3>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{deleteWard.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{deleteWard.floor} · {deleteWard.total_beds} beds</p>
              <p className="text-xs text-red-500 mt-3">All beds in this ward will also be deleted. Admitted patients will be unlinked.</p>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setDeleteWard(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                  Cancel
                </button>
                <button onClick={confirmDeleteWard} disabled={deletingWard}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
                  {deletingWard ? 'Deleting...' : 'Delete Ward'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
