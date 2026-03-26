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
  const c = occupied ? '#ef4444' : '#10b981'
  return (
    <svg width={size} height={size} viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="14" width="4" height="26" rx="2" fill={c} opacity="0.8" />
      <rect x="8" y="22" width="48" height="14" rx="3" fill={c} opacity="0.25" />
      <rect x="8" y="26" width="48" height="10" rx="2" fill={c} opacity="0.55" />
      <rect x="10" y="16" width="14" height="12" rx="4" fill={c} opacity="0.5" />
      <rect x="12" y="36" width="4" height="8" rx="1" fill={c} opacity="0.5" />
      <rect x="48" y="36" width="4" height="8" rx="1" fill={c} opacity="0.5" />
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
    const updated = src.map(w => w.id === wardId ? { ...w, beds: data.beds || [] } : w)
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
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{wards.length} wards Â· {totalBeds} total beds</p>
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
          { label: 'Total Beds', value: totalBeds, icon: 'ðŸ›ï¸', color: 'text-gray-900 dark:text-white' },
          { label: 'Occupied', value: occupiedBeds, icon: 'ðŸ”´', color: 'text-red-600 dark:text-red-400' },
          { label: 'Available', value: availableBeds, icon: 'ðŸŸ¢', color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Occupancy', value: `${occupancyPct}%`, icon: 'ðŸ“Š', color: occupancyPct > 90 ? 'text-red-600 dark:text-red-400' : occupancyPct > 70 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400' },
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
        <span className="ml-2 text-gray-400">Â· Hover over a bed to see patient details</span>
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
              <button
                key={ward.id}
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
            )
          })}
        </div>

        {/* Bed grid */}
        <div className="flex-1 bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-5 relative">
          {!selectedWard ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <span className="text-5xl block mb-3">ðŸ¥</span>
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
                    {selectedWard.nurse_in_charge && <> Â· Nurse: <strong>{selectedWard.nurse_in_charge}</strong></>}
                  </p>
                  {selectedWard.latitude && (
                    <p className="text-[10px] text-blue-500 mt-0.5">
                      ðŸ“ {selectedWard.latitude.toFixed(5)}, {selectedWard.longitude?.toFixed(5)}
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
                </div>
              </div>

              {/* Bed grid */}
              {!selectedWard.beds || selectedWard.beds.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <span className="text-5xl mb-3">ðŸ›ï¸</span>
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
                        className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border-2 cursor-default transition-all ${
                          occupied
                            ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-950/30'
                            : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/30'
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
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-emerald-300 dark:text-emerald-700 text-[10px]">AVAILABLE</span>
                </div>
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
                  {form.latitude && <span className="ml-2 font-mono text-blue-600 dark:text-blue-400 font-normal normal-case">ðŸ“ {form.latitude}, {form.longitude}</span>}
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
    </div>
  )
}
