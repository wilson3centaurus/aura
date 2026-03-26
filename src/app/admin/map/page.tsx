'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Script from 'next/script'
import {
  MdAdd, MdDelete, MdLocationOn, MdEdit, MdSave, MdClose, MdMap,
  MdMyLocation, MdPlace,
} from 'react-icons/md'
import { FaMapMarkerAlt } from 'react-icons/fa'

interface LocationPin {
  id: string
  name: string
  category: string
  description: string | null
  latitude: number
  longitude: number
  writtenDirections: string | null
  floor: string
  iconName: string
  isActive: boolean
}

interface PendingPin {
  lat: number
  lng: number
}

const HOSPITAL_LAT = parseFloat(process.env.NEXT_PUBLIC_HOSPITAL_LAT || '-18.963803')
const HOSPITAL_LNG = parseFloat(process.env.NEXT_PUBLIC_HOSPITAL_LNG || '32.663295')
const MAPS_KEY     = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

const CATEGORIES = [
  { value: 'entrance',  label: 'Main Entrance',       color: '#4f46e5' },
  { value: 'emergency', label: 'Emergency',            color: '#dc2626' },
  { value: 'pharmacy',  label: 'Pharmacy',             color: '#059669' },
  { value: 'toilet',    label: 'Toilets / Restrooms',  color: '#2563eb' },
  { value: 'lab',       label: 'Laboratory',           color: '#7c3aed' },
  { value: 'ward',      label: 'Ward / Department',    color: '#0891b2' },
  { value: 'cafeteria', label: 'Cafeteria / Canteen',  color: '#ea580c' },
  { value: 'atm',       label: 'ATM / Payment Point',  color: '#ca8a04' },
  { value: 'parking',   label: 'Parking Area',         color: '#64748b' },
  { value: 'exit',      label: 'Exit / Gate',          color: '#6b7280' },
  { value: 'kiosk',     label: 'AURA Kiosk',           color: '#1d4ed8' },
  { value: 'office',    label: 'Office / Admin',       color: '#9333ea' },
  { value: 'other',     label: 'Other',                color: '#374151' },
]

const CATEGORY_COLOR: Record<string, string> = Object.fromEntries(CATEGORIES.map(c => [c.value, c.color]))

const BLANK_FORM = { name: '', category: 'toilet', description: '', writtenDirections: '', floor: 'Ground Floor', iconName: 'location', lat: 0, lng: 0 }

export default function AdminMapPage() {
  const mapRef         = useRef<HTMLDivElement>(null)
  const googleMap      = useRef<any>(null)
  const markers        = useRef<Map<string, any>>(new Map())
  const tempMarker     = useRef<any>(null)
  const infoWindows    = useRef<Map<string, any>>(new Map())
  const placingRef     = useRef(false)
  const repositionRef  = useRef(false)

  const [mapsLoaded, setMapsLoaded]     = useState(false)
  const [pins, setPins]                 = useState<LocationPin[]>([])
  const [placing, setPlacing]           = useState(false)
  const [pending, setPending]           = useState<PendingPin | null>(null)
  const [form, setForm]                 = useState(BLANK_FORM)
  const [showForm, setShowForm]         = useState(false)
  const [editId, setEditId]             = useState<string | null>(null)
  const [saving, setSaving]             = useState(false)

  // Keep ref in sync with state
  useEffect(() => { placingRef.current = placing }, [placing])

  // ── Load pins from API ────────────────────────────────────────────────────
  const loadPins = useCallback(async () => {
    const res = await fetch('/api/locations')
    if (res.ok) setPins(await res.json())
  }, [])

  useEffect(() => { loadPins() }, [loadPins])

  // ── Initialise Google Map ──────────────────────────────────────────────────
  const initMap = useCallback(() => {
    if (!mapRef.current || !(window as any).google) return
    const gMap = new (window as any).google.maps.Map(mapRef.current, {
      center:    { lat: HOSPITAL_LAT, lng: HOSPITAL_LNG },
      zoom:      18,
      mapTypeId: 'satellite',
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      mapTypeControlOptions: {
        mapTypeIds: ['roadmap', 'satellite', 'hybrid'],
      },
    })
    googleMap.current = gMap

    // Click handler for pin placement — uses ref to always read current state
    gMap.addListener('click', (e: any) => {
      if (!placingRef.current) return
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()

      // Remove temp marker if exists
      if (tempMarker.current) tempMarker.current.setMap(null)

      const marker = new (window as any).google.maps.Marker({
        position: { lat, lng },
        map: gMap,
        animation: (window as any).google.maps.Animation.DROP,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#1d4ed8',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      })
      if (repositionRef.current) {
        // Repositioning an existing pin — just update lat/lng and re-show form
        repositionRef.current = false
        if (tempMarker.current) { tempMarker.current.setMap(null); tempMarker.current = null }
        tempMarker.current = marker
        setForm(f => ({ ...f, lat, lng }))
        setPlacing(false)
        gMap.getDiv().style.cursor = 'default'
        return
      }

      tempMarker.current = marker
      setPending({ lat, lng })
      setForm(f => ({ ...f, lat, lng }))
      setShowForm(true)
      setPlacing(false)
      gMap.getDiv().style.cursor = 'default'
    })
  }, []) // Uses placingRef so no state deps needed

  useEffect(() => {
    if (mapsLoaded && mapRef.current) initMap()
  }, [mapsLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render saved pins as markers ─────────────────────────────────────────
  useEffect(() => {
    if (!googleMap.current || !(window as any).google) return

    // Clear existing markers
    markers.current.forEach(m => m.setMap(null))
    markers.current.clear()
    infoWindows.current.forEach(w => w.close())
    infoWindows.current.clear()

    pins.filter(p => p.isActive).forEach(pin => {
      const color = CATEGORY_COLOR[pin.category] || '#374151'
      const marker = new (window as any).google.maps.Marker({
        position: { lat: pin.latitude, lng: pin.longitude },
        map: googleMap.current,
        title: pin.name,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: color,
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2.5,
        },
        label: {
          text: pin.name.slice(0, 1).toUpperCase(),
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: '11px',
        },
      })

      const infoWindow = new (window as any).google.maps.InfoWindow({
        content: `
          <div style="font-family:Inter,sans-serif;padding:4px 2px;min-width:160px">
            <div style="font-weight:800;font-size:13px;color:#1e293b;margin-bottom:2px">${pin.name}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:4px;text-transform:capitalize">${pin.category} · ${pin.floor}</div>
            ${pin.description ? `<div style="font-size:11px;color:#475569">${pin.description}</div>` : ''}
            <div style="font-size:10px;color:#94a3b8;margin-top:4px">${pin.latitude.toFixed(5)}, ${pin.longitude.toFixed(5)}</div>
          </div>
        `,
      })

      marker.addListener('click', () => {
        infoWindows.current.forEach(w => w.close())
        infoWindow.open(googleMap.current, marker)
      })

      markers.current.set(pin.id, marker)
      infoWindows.current.set(pin.id, infoWindow)
    })
  }, [pins, mapsLoaded])

  // ── Cursor change when placing ─────────────────────────────────────────────
  useEffect(() => {
    if (!googleMap.current) return
    googleMap.current.getDiv().style.cursor = placing ? 'crosshair' : 'default'
  }, [placing])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const startPlacing = () => {
    setPlacing(true)
    setShowForm(false)
    setPending(null)
    setEditId(null)
    setForm(BLANK_FORM)
  }

  const cancelForm = () => {
    setShowForm(false)
    setPending(null)
    setEditId(null)
    setForm(BLANK_FORM)
    setPlacing(false)
    if (tempMarker.current) { tempMarker.current.setMap(null); tempMarker.current = null }
  }

  const openEdit = (pin: LocationPin) => {
    setEditId(pin.id)
    setForm({
      name: pin.name, category: pin.category, description: pin.description || '',
      writtenDirections: pin.writtenDirections || '', floor: pin.floor,
      iconName: pin.iconName, lat: pin.latitude, lng: pin.longitude,
    })
    setShowForm(true)
    setPlacing(false)
    repositionRef.current = false
    // Pan to marker
    if (googleMap.current) {
      googleMap.current.panTo({ lat: pin.latitude, lng: pin.longitude })
      googleMap.current.setZoom(20)
    }
  }

  const startReposition = () => {
    repositionRef.current = true
    setPlacing(true)
    if (googleMap.current) googleMap.current.getDiv().style.cursor = 'crosshair'
  }

  const savePin = async () => {
    if (!form.name.trim()) return alert('Please enter a name for this location.')
    if (!editId && !pending) return alert('Please click on the map to place the pin first.')
    setSaving(true)

    const body = {
      name: form.name.trim(),
      category: form.category,
      description: form.description || null,
      latitude: form.lat,
      longitude: form.lng,
      writtenDirections: form.writtenDirections || null,
      floor: form.floor,
      iconName: form.iconName,
    }

    const res = editId
      ? await fetch(`/api/locations/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await fetch('/api/locations',            { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

    setSaving(false)
    if (res.ok) {
      await loadPins()
      cancelForm()
    } else {
      alert('Failed to save pin. Please try again.')
    }
  }

  const deletePin = async (id: string) => {
    if (!confirm('Delete this location pin?')) return
    const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' })
    if (res.ok) {
      markers.current.get(id)?.setMap(null)
      markers.current.delete(id)
      infoWindows.current.delete(id)
      setPins(p => p.filter(x => x.id !== id))
    }
  }

  const focusPin = (pin: LocationPin) => {
    if (!googleMap.current) return
    googleMap.current.panTo({ lat: pin.latitude, lng: pin.longitude })
    googleMap.current.setZoom(21)
    infoWindows.current.forEach(w => w.close())
    infoWindows.current.get(pin.id)?.open(googleMap.current, markers.current.get(pin.id))
  }

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=geometry,places`}
        strategy="lazyOnload"
        onLoad={() => setMapsLoaded(true)}
      />

      <div className="max-w-full">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <MdMap className="text-blue-600" />
              Hospital Map Management
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Mutare Provincial Hospital — Place pins for departments, facilities, and landmarks
            </p>
          </div>
          <button
            onClick={startPlacing}
            disabled={placing}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all ${
              placing
                ? 'bg-amber-500 text-white cursor-not-allowed animate-pulse-soft'
                : 'bg-gradient-to-r from-blue-700 to-cyan-600 text-white hover:opacity-90 active:scale-95'
            }`}
          >
            <MdAdd size={18} />
            {placing ? 'Click on map to place pin…' : 'Add New Pin'}
          </button>
        </div>

        <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">

          {/* ── Map ── */}
          <div className="flex-1 relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-gray-800">
            {!mapsLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-gray-800 z-10">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <MdMap className="text-5xl animate-pulse-soft" />
                  <p className="text-sm font-medium">Loading Google Maps…</p>
                </div>
              </div>
            )}
            <div ref={mapRef} className="w-full h-full" />

            {/* Placement hint overlay */}
            {placing && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-10">
                <MdMyLocation className="animate-pulse-soft" />
                Click anywhere on the map to place your pin
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="w-80 flex flex-col gap-3 overflow-y-auto">

            {/* Add/Edit form */}
            {showForm && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-lg p-4 animate-slide-up">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                    <MdPlace className="text-blue-600" />
                    {editId ? 'Edit Pin' : 'New Location Pin'}
                  </h3>
                  <button onClick={cancelForm} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                    <MdClose size={16} />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Coordinates display */}
                  {(pending || editId) && (
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg gap-2">
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-600 truncate">
                        {form.lat.toFixed(6)}, {form.lng.toFixed(6)}
                      </span>
                      {editId && (
                        <button
                          onClick={startReposition}
                          disabled={placing}
                          className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0 disabled:opacity-50"
                        >
                          {placing && repositionRef.current ? 'Click map…' : 'Reposition'}
                        </button>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Location Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Main Pharmacy"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Category</label>
                    <select
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Floor</label>
                    <select
                      value={form.floor}
                      onChange={e => setForm(f => ({ ...f, floor: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {['Ground Floor', 'Outdoor / Grounds'].map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Short Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Dispensing medications & prescriptions"
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">
                      Written Directions <span className="text-slate-400 font-normal">(one step per line)</span>
                    </label>
                    <textarea
                      placeholder={`From the main entrance, turn left\nWalk past reception desk\nPharmacy is on your right`}
                      value={form.writtenDirections}
                      onChange={e => setForm(f => ({ ...f, writtenDirections: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={cancelForm}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={savePin}
                      disabled={saving}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 text-white text-sm font-bold shadow hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      <MdSave size={15} />
                      {saving ? 'Saving…' : 'Save Pin'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Saved pins list */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm flex-1 overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FaMapMarkerAlt className="text-blue-500" />
                  Location Pins ({pins.length})
                </h3>
              </div>

              <div className="overflow-y-auto flex-1 divide-y divide-slate-50 dark:divide-gray-800">
                {pins.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-400 dark:text-slate-600">
                    <MdLocationOn className="text-3xl mb-1 opacity-40" />
                    <p className="text-xs font-medium">No pins yet — click "Add New Pin"</p>
                  </div>
                ) : (
                  pins.map(pin => {
                    const color = CATEGORY_COLOR[pin.category] || '#374151'
                    const catLabel = CATEGORIES.find(c => c.value === pin.category)?.label || pin.category
                    return (
                      <div key={pin.id} className="px-3 py-2.5 flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors group">
                        <button onClick={() => focusPin(pin)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                            style={{ backgroundColor: color }}
                          >
                            {pin.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{pin.name}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-600 truncate">{catLabel} · {pin.floor}</p>
                          </div>
                        </button>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={() => openEdit(pin)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors">
                            <MdEdit size={13} />
                          </button>
                          <button onClick={() => deletePin(pin.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-colors">
                            <MdDelete size={13} />
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 mb-2">Category Legend</p>
              <div className="grid grid-cols-2 gap-1">
                {CATEGORIES.slice(0, 8).map(c => (
                  <div key={c.value} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-[10px] text-slate-500 dark:text-slate-500 truncate">{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
