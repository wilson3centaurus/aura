'use client'

import { useEffect, useState } from 'react'

interface Doctor {
  id: string
  specialty: string
  status: string
  room_number: string | null
  phone: string | null
  user: { name: string; email: string; profile_image: string | null }
  department: { id: string; name: string }
  _count?: { queueEntries: number }
}

interface Department { id: string; name: string }

interface CreatedCredentials {
  name: string; email: string; password: string
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string }> = {
  AVAILABLE: { label: 'Available', dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' },
  BUSY:      { label: 'Busy',      dot: 'bg-amber-500',  bg: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
  ON_BREAK:  { label: 'On Break',  dot: 'bg-blue-500',   bg: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
  OFFLINE:   { label: 'Offline',   dot: 'bg-gray-400',   bg: 'bg-gray-100 text-gray-500 dark:bg-[#222] dark:text-gray-500' },
}

const SPECIALTIES = [
  'General Practice', 'Emergency Medicine', 'Obstetrics/Gynaecology', 'Paediatrics',
  'Surgery', 'Internal Medicine', 'Radiology', 'Pathology', 'Pharmacy',
  'Ophthalmology', 'ENT', 'Orthopaedics', 'Dermatology', 'Psychiatry',
]

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

function avatarColor(name: string) {
  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500']
  return colors[name.charCodeAt(0) % colors.length]
}

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [form, setForm] = useState({ name: '', email: '', idNumber: '', specialty: '', departmentId: '', roomNumber: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [createdCreds, setCreatedCreds] = useState<CreatedCredentials | null>(null)

  const loadData = async () => {
    const [docsRes, depsRes] = await Promise.all([
      fetch('/api/doctors').then(r => r.json()),
      fetch('/api/departments').then(r => r.json()),
    ])
    setDoctors(Array.isArray(docsRes) ? docsRes : [])
    setDepartments(Array.isArray(depsRes) ? depsRes : [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const autoEmail = (name: string) => {
    if (!name.trim()) return ''
    const parts = name.trim().split(/\s+/)
    if (parts.length < 2) return parts[0].toLowerCase() + '@mutareprovincial.co.zw'
    return (parts[0][0] + parts[parts.length - 1]).toLowerCase() + '@mutareprovincial.co.zw'
  }

  const addDoctor = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const email = form.email || autoEmail(form.name)
    const password = form.idNumber.toLowerCase().replace(/\s+/g, '')
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email, password, specialty: form.specialty, departmentId: form.departmentId, roomNumber: form.roomNumber, phone: form.phone }),
      })
      if (res.ok) {
        setCreatedCreds({ name: form.name, email, password })
        setForm({ name: '', email: '', idNumber: '', specialty: '', departmentId: '', roomNumber: '', phone: '' })
        setShowForm(false)
        loadData()
      }
    } catch {}
    setSaving(false)
  }

  const filtered = doctors.filter(d => {
    const matchSearch = !search || d.user.name.toLowerCase().includes(search.toLowerCase()) || d.specialty.toLowerCase().includes(search.toLowerCase()) || d.department?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || d.status === filterStatus
    return matchSearch && matchStatus
  })

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-[#003d73] border-t-transparent animate-spin" />
    </div>
  )

  const counts = Object.fromEntries(
    ['AVAILABLE', 'BUSY', 'ON_BREAK', 'OFFLINE'].map(s => [s, doctors.filter(d => d.status === s).length])
  )

  return (
    <div className="max-w-6xl space-y-5">
      {/* Credential display after creation */}
      {createdCreds && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">âœ…</span>
            <div className="flex-1">
              <p className="text-sm font-black text-emerald-800 dark:text-emerald-300 mb-3">Doctor account created for {createdCreds.name}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-[#0a0a0a] rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mb-1">Login Username (Email)</p>
                  <p className="text-sm font-mono font-bold text-gray-900 dark:text-white break-all">{createdCreds.email}</p>
                </div>
                <div className="bg-white dark:bg-[#0a0a0a] rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mb-1">Password (ID Number)</p>
                  <p className="text-sm font-mono font-bold text-gray-900 dark:text-white">{createdCreds.password}</p>
                </div>
              </div>
              <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/60 mt-2">
                âš ï¸ Share these credentials with the doctor securely. The password is their ID number in lowercase.
              </p>
            </div>
            <button onClick={() => setCreatedCreds(null)} className="text-emerald-500 hover:text-emerald-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Medical Staff</h1>
          <p className="text-xs text-gray-500 mt-0.5">{doctors.length} registered doctors</p>
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
          {showForm ? 'Cancel' : 'Add Doctor'}
        </button>
      </div>

      {/* Status strip */}
      <div className="grid grid-cols-4 gap-3">
        {[['AVAILABLE', 'ðŸŸ¢'], ['BUSY', 'ðŸŸ¡'], ['ON_BREAK', 'ðŸ”µ'], ['OFFLINE', 'âš«']].map(([s, emoji]) => {
          const cfg = STATUS_CONFIG[s]
          return (
            <div key={s} className={`rounded-xl border p-3 text-center ${cfg.bg.split(' ').slice(0, 2).join(' ')} border-current/20`}>
              <p className="text-lg">{emoji}</p>
              <p className={`text-xl font-black ${cfg.bg.split(' ')[1]} ${cfg.bg.split(' ')[3]}`}>{counts[s]}</p>
              <p className={`text-[10px] font-bold uppercase tracking-wider opacity-70`}>{cfg.label}</p>
            </div>
          )
        })}
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={addDoctor} className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-5 space-y-4">
          <div>
            <h2 className="text-sm font-black text-gray-900 dark:text-white">Register New Doctor</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Email is auto-generated from name. The ID number (lowercase, no spaces) becomes the login password.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Full Name *"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value, email: autoEmail(e.target.value) })}
              required
              className="col-span-2 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]"
            />
            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Login Email (auto-generated)</label>
              <input
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300 focus:outline-none focus:ring-2 focus:ring-[#003d73] font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">ID Number (becomes password)</label>
              <input
                placeholder="e.g. 63-123456A78"
                value={form.idNumber}
                onChange={e => setForm({ ...form, idNumber: e.target.value })}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]"
              />
            </div>
            <select value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} required
              className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73]">
              <option value="">Select Specialty *</option>
              {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} required
              className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73]">
              <option value="">Select Department *</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <input placeholder="Room Number" value={form.roomNumber} onChange={e => setForm({ ...form, roomNumber: e.target.value })}
              className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
            <input placeholder="Phone Number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-3 rounded-xl bg-[#003d73] hover:bg-[#002d57] text-white text-sm font-black transition-colors shadow-md shadow-blue-900/20 disabled:opacity-50">
            {saving ? 'Creating Account...' : 'Create Doctor Account'}
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, specialty or department..."
            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] text-xs text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]">
          <option value="">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="BUSY">Busy</option>
          <option value="ON_BREAK">On Break</option>
          <option value="OFFLINE">Offline</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-[#222] bg-gray-50 dark:bg-[#0a0a0a]">
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Doctor</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Specialty</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Department</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Room</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Queue</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(doc => {
              const sc = STATUS_CONFIG[doc.status] || STATUS_CONFIG.OFFLINE
              const av = avatarColor(doc.user.name)
              return (
                <tr key={doc.id} className="border-b border-gray-50 dark:border-[#1a1a1a] last:border-0 hover:bg-gray-50/50 dark:hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl ${av} flex items-center justify-center text-xs font-black text-white flex-shrink-0`}>
                        {initials(doc.user.name)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-[13px]">{doc.user.name}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{doc.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">{doc.specialty}</span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-gray-600 dark:text-gray-400">{doc.department?.name || 'â€”'}</td>
                  <td className="px-4 py-3 text-[12px] text-gray-600 dark:text-gray-400">{doc.room_number || 'â€”'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${sc.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${doc.status === 'AVAILABLE' ? 'animate-pulse' : ''}`} />
                      {sc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {(doc._count?.queueEntries ?? 0) > 0 ? (
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[11px] font-bold">
                        {doc._count?.queueEntries} in queue
                      </span>
                    ) : (
                      <span className="text-[12px] text-gray-300 dark:text-gray-600">â€”</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <p className="text-3xl mb-2">ðŸ‘¨â€âš•ï¸</p>
                  <p className="text-sm text-gray-400">No doctors found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
