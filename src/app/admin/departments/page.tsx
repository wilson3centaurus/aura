'use client'

import { useEffect, useRef, useState } from 'react'

interface Department {
  id: string
  name: string
  location: string
  floor: string
  description: string | null
  open_time: string
  close_time: string
  icon: string
  latitude: number | null
  longitude: number | null
  written_directions: string | null
  _count?: { doctors: number }
}

interface Doctor {
  id: string
  specialty: string
  department: { id: string; name: string } | null
  user: { name: string; email: string }
}

const FLOORS = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', 'Basement']

const DEPT_ICONS: Record<string, string> = {
  emergency: '🚨', casualty: '🚑', icu: '💉', intensive: '💉',
  maternity: '🤰', gynecology: '👶', obstetric: '🤰',
  pediatric: '🧒', children: '🧒',
  surgery: '🔪', surgical: '🔪', orthopaedic: '🦴', orthop: '🦴',
  ophthalmology: '👁️', eye: '👁️',
  ent: '👂', ear: '👂', nose: '👃',
  cardiology: '❤️', cardiac: '❤️', heart: '❤️',
  neurology: '🧠', brain: '🧠',
  oncology: '🎗️', cancer: '🎗️',
  radiology: '☢️', xray: '☢️', imaging: '🩻',
  pharmacy: '💊', medication: '💊', drug: '💊',
  laboratory: '🔬', lab: '🔬', pathology: '🔬',
  physiotherapy: '🏃', physio: '🏃', rehabilitation: '🏃',
  dental: '🦷', dentistry: '🦷',
  dermatology: '🩹', skin: '🩹',
  psychiatry: '🧘', mental: '🧘', psychology: '🧠',
  outpatient: '🏥', opd: '🏥', clinic: '🏥',
  reception: '🗃️', admin: '🗃️', administrative: '🗃️',
  ward: '🛏️', general: '🛏️',
  mortuary: '⚰️',
}

function getDeptIcon(name: string): string {
  const lower = name.toLowerCase()
  for (const [key, emoji] of Object.entries(DEPT_ICONS)) {
    if (lower.includes(key)) return emoji
  }
  return '🏥'
}

const DEPT_COLORS: string[] = [
  'from-blue-500/10 to-blue-600/5 border-blue-200 dark:border-blue-800',
  'from-emerald-500/10 to-emerald-600/5 border-emerald-200 dark:border-emerald-800',
  'from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800',
  'from-rose-500/10 to-rose-600/5 border-rose-200 dark:border-rose-800',
  'from-amber-500/10 to-amber-600/5 border-amber-200 dark:border-amber-800',
  'from-cyan-500/10 to-cyan-600/5 border-cyan-200 dark:border-cyan-800',
]

export default function AdminDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editDept, setEditDept] = useState<Department | null>(null)
  const [editForm, setEditForm] = useState({ name: '', location: '', floor: 'Ground Floor', description: '', openTime: '08:00', closeTime: '17:00', writtenDirections: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [assigningDoctor, setAssigningDoctor] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', location: '', floor: 'Ground Floor',
    description: '', openTime: '08:00', closeTime: '17:00',
    icon: 'hospital', writtenDirections: '',
    latitude: '', longitude: '',
  })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)

  const loadData = async () => {
    const [data, docsData] = await Promise.all([
      fetch('/api/departments').then(r => r.json()),
      fetch('/api/doctors').then(r => r.json()),
    ])
    setDepartments(Array.isArray(data) ? data : [])
    setDoctors(Array.isArray(docsData) ? docsData : [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const openEdit = (dept: Department) => {
    setEditDept(dept)
    setEditForm({
      name: dept.name,
      location: dept.location,
      floor: dept.floor,
      description: dept.description || '',
      openTime: dept.open_time,
      closeTime: dept.close_time,
      writtenDirections: dept.written_directions || '',
    })
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editDept) return
    setSavingEdit(true)
    try {
      await fetch(`/api/departments/${editDept.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      setEditDept(null)
      loadData()
    } catch {}
    setSavingEdit(false)
  }

  const assignDoctor = async (doctorId: string, departmentId: string | null) => {
    setAssigningDoctor(doctorId)
    try {
      await fetch(`/api/doctors/${doctorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentId: departmentId || '' }),
      })
      await loadData()
      // Refresh editDept with updated doctor count
      if (editDept) {
        const updated = await fetch('/api/departments').then(r => r.json())
        const found = (Array.isArray(updated) ? updated : []).find((d: Department) => d.id === editDept.id)
        if (found) setEditDept(found)
      }
    } catch {}
    setAssigningDoctor(null)
  }

  // Load Google Maps when form opens
  useEffect(() => {
    if (!showForm) return
    const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || 'AIzaSyBG5lqhexFFst2w4cc5Nw9OKdo29SAWc9g'
    if (window.google?.maps) { initMap(); return }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`
    script.async = true
    script.onload = () => initMap()
    document.head.appendChild(script)
  }, [showForm])

  function initMap() {
    if (!mapRef.current) return
    const center = { lat: -19.0, lng: 32.65 }
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 16, center,
      mapTypeId: 'satellite',
      disableDefaultUI: true,
      zoomControl: true,
    })
    mapInstanceRef.current = map
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      const lat = e.latLng?.lat() ?? 0
      const lng = e.latLng?.lng() ?? 0
      setForm(f => ({ ...f, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }))
      if (markerRef.current) markerRef.current.setMap(null)
      markerRef.current = new window.google.maps.Marker({
        position: { lat, lng }, map,
        title: 'Department Location',
        icon: { url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' },
      })
    })
    setMapReady(true)
  }

  const addDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form }),
      })
      setForm({ name: '', location: '', floor: 'Ground Floor', description: '', openTime: '08:00', closeTime: '17:00', icon: 'hospital', writtenDirections: '', latitude: '', longitude: '' })
      setShowForm(false)
      loadData()
    } catch {}
    setSaving(false)
  }

  const filtered = departments.filter(d => {
    const q = search.toLowerCase()
    return !q || d.name.toLowerCase().includes(q) || d.location.toLowerCase().includes(q) || d.floor.toLowerCase().includes(q)
  })

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-[#003d73] border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="max-w-6xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Departments</h1>
          <p className="text-xs text-gray-500 mt-0.5">{departments.length} departments across the hospital</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#003d73] hover:bg-[#002d57] text-white text-xs font-bold transition-colors shadow-md shadow-blue-900/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {showForm
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />}
          </svg>
          {showForm ? 'Cancel' : 'Add Department'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={addDepartment} className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-5 space-y-4">
          <h2 className="text-sm font-black text-gray-900 dark:text-white">New Department</h2>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Department Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
              className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
            <input placeholder="Location (e.g. Block A, North Wing)" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required
              className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
            <select value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })}
              className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73]">
              {FLOORS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-gray-400 uppercase font-bold">Opens</label>
                <input type="time" value={form.openTime} onChange={e => setForm({ ...form, openTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-gray-400 uppercase font-bold">Closes</label>
                <input type="time" value={form.closeTime} onChange={e => setForm({ ...form, closeTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
              </div>
            </div>
            <textarea placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
              className="col-span-2 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73] resize-none" />
            <textarea placeholder="Written directions (e.g. From main entrance, turn left...)" value={form.writtenDirections} onChange={e => setForm({ ...form, writtenDirections: e.target.value })} rows={2}
              className="col-span-2 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73] resize-none" />
          </div>

          {/* Map coordinate capture */}
          <div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
              Map Location <span className="font-normal text-gray-400">— click on the map to capture department coordinates</span>
            </p>
            <div ref={mapRef} className="w-full h-48 rounded-xl overflow-hidden border border-gray-200 dark:border-[#333] bg-gray-100 dark:bg-[#1a1a1a]" />
            {form.latitude && form.longitude && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1.5 font-mono">
                ✓ Captured: {form.latitude}, {form.longitude}
              </p>
            )}
            {!mapReady && <p className="text-[10px] text-gray-400 mt-1">Loading map...</p>}
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-3 rounded-xl bg-[#003d73] hover:bg-[#002d57] text-white text-sm font-black transition-colors shadow-md shadow-blue-900/20 disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Department'}
          </button>
        </form>
      )}

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search departments..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]"
        />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((dept, idx) => {
          const colorClass = DEPT_COLORS[idx % DEPT_COLORS.length]
          const icon = getDeptIcon(dept.name)
          const hasCoords = dept.latitude !== null && dept.longitude !== null
          return (
            <div key={dept.id} className={`bg-gradient-to-br ${colorClass} border rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md dark:hover:shadow-none transition-shadow`}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#111] shadow-sm flex items-center justify-center text-2xl flex-shrink-0">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white leading-tight">{dept.name}</h3>
                  {dept.description && <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{dept.description}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{dept.location} · {dept.floor}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{dept.open_time} — {dept.close_time}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-current/10">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{dept._count?.doctors || 0}</span>
                  <span className="text-[11px] text-gray-400">doctor{(dept._count?.doctors || 0) !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  {hasCoords ? (
                    <span className="text-[10px] px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold">
                      📍 Mapped
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-1 rounded-lg bg-gray-100 dark:bg-[#222] text-gray-400 font-medium">
                      No map pin
                    </span>
                  )}
                  <button
                    onClick={() => openEdit(dept)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-[#003d73]/10 hover:bg-[#003d73]/20 text-[#003d73] dark:text-blue-400 font-bold transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <span className="text-4xl mb-3">🏥</span>
          <p className="text-sm font-semibold">No departments found</p>
        </div>
      )}

      {/* Edit Department Modal */}
      {editDept && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141414] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-[#222] sticky top-0 bg-white dark:bg-[#141414] z-10">
              <div>
                <h2 className="text-sm font-black text-gray-900 dark:text-white">Edit Department</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">{editDept.name}</p>
              </div>
              <button type="button" onClick={() => setEditDept(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#222] transition-colors">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={saveEdit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Department Name *" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required
                  className="col-span-2 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
                <input placeholder="Location (e.g. Block A)" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} required
                  className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
                <select value={editForm.floor} onChange={e => setEditForm({ ...editForm, floor: e.target.value })}
                  className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73]">
                  {FLOORS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 uppercase font-bold">Opens</label>
                    <input type="time" value={editForm.openTime} onChange={e => setEditForm({ ...editForm, openTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-400 uppercase font-bold">Closes</label>
                    <input type="time" value={editForm.closeTime} onChange={e => setEditForm({ ...editForm, closeTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
                  </div>
                </div>
                <textarea placeholder="Description (optional)" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={2}
                  className="col-span-2 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73] resize-none" />
                <textarea placeholder="Written directions (optional)" value={editForm.writtenDirections} onChange={e => setEditForm({ ...editForm, writtenDirections: e.target.value })} rows={2}
                  className="col-span-2 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73] resize-none" />
              </div>

              <button type="submit" disabled={savingEdit}
                className="w-full py-3 rounded-xl bg-[#003d73] hover:bg-[#002d57] text-white text-sm font-black transition-colors shadow-md shadow-blue-900/20 disabled:opacity-50">
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </form>

            {/* Assign Doctors Section */}
            <div className="px-5 pb-5 space-y-3">
              <div className="border-t border-gray-100 dark:border-[#222] pt-4">
                <h3 className="text-xs font-black text-gray-900 dark:text-white mb-3">Assign Doctors to {editDept.name}</h3>
                <div className="space-y-2">
                  {doctors.map(doc => {
                    const inThisDept = doc.department?.id === editDept.id
                    const inOtherDept = doc.department && doc.department.id !== editDept.id
                    const isAssigning = assigningDoctor === doc.id
                    return (
                      <div key={doc.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1e1e1e]">
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">{doc.user.name}</p>
                          <p className="text-[10px] text-gray-400">{doc.specialty}{inOtherDept ? ` · ${doc.department?.name}` : ''}</p>
                        </div>
                        {inThisDept ? (
                          <button
                            onClick={() => assignDoctor(doc.id, null)}
                            disabled={isAssigning}
                            className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            {isAssigning ? '...' : '✓ Assigned'}
                          </button>
                        ) : (
                          <button
                            onClick={() => assignDoctor(doc.id, editDept.id)}
                            disabled={isAssigning}
                            className="text-[10px] px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#222] text-gray-500 dark:text-gray-400 font-bold hover:bg-[#003d73]/10 hover:text-[#003d73] dark:hover:text-blue-400 transition-colors disabled:opacity-50"
                          >
                            {isAssigning ? '...' : 'Assign'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {doctors.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">No doctors registered yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
