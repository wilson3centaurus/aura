'use client'

import { useEffect, useState } from 'react'
import { MdAdd, MdSearch, MdFilterList, MdClose } from 'react-icons/md'

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

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  BUSY: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  ON_BREAK: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  OFFLINE: 'bg-gray-100 text-gray-500 dark:bg-[#222] dark:text-gray-500',
}

const SPECIALTIES = [
  'General Practice', 'Emergency Medicine', 'Obstetrics/Gynaecology', 'Paediatrics',
  'Surgery', 'Internal Medicine', 'Radiology', 'Pathology', 'Pharmacy',
  'Ophthalmology', 'ENT', 'Orthopaedics', 'Dermatology', 'Psychiatry',
]

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [form, setForm] = useState({ name: '', email: '', idNumber: '', specialty: '', departmentId: '', roomNumber: '', phone: '' })
  const [saving, setSaving] = useState(false)

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

  // Auto-generate email from name
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
    const password = form.idNumber.toLowerCase()
    try {
      await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email,
          password,
          specialty: form.specialty,
          departmentId: form.departmentId,
          roomNumber: form.roomNumber,
          phone: form.phone,
        }),
      })
      setForm({ name: '', email: '', idNumber: '', specialty: '', departmentId: '', roomNumber: '', phone: '' })
      setShowForm(false)
      loadData()
    } catch {}
    setSaving(false)
  }

  const filtered = doctors.filter(d => {
    const matchSearch = !search || d.user.name.toLowerCase().includes(search.toLowerCase()) || d.specialty.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || d.status === filterStatus
    return matchSearch && matchStatus
  })

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 rounded-full border-2 border-gray-900 dark:border-white border-t-transparent animate-spin" /></div>

  return (
    <div className="max-w-5xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Doctors</h1>
          <p className="text-xs text-gray-500">{doctors.length} registered</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all">
          {showForm ? <><MdClose size={14} /> Cancel</> : <><MdAdd size={14} /> Add Doctor</>}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={addDoctor} className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">New Doctor</p>
          <p className="text-[11px] text-gray-400 -mt-1">Email is auto-generated from name. ID number becomes the password (lowercase).</p>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Full Name (e.g. Tendai Moyo)" value={form.name}
              onChange={e => { setForm({ ...form, name: e.target.value, email: autoEmail(e.target.value) }) }}
              required className="col-span-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white" />
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">Auto-generated Email (username)</label>
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">ID Number (becomes password)</label>
              <input placeholder="e.g. 63-123456A78" value={form.idNumber}
                onChange={e => setForm({ ...form, idNumber: e.target.value })}
                required className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white" />
            </div>
            <select value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} required
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white">
              <option value="">Select Specialty</option>
              {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} required
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white">
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <input placeholder="Room Number" value={form.roomNumber} onChange={e => setForm({ ...form, roomNumber: e.target.value })}
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white" />
            <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white" />
          </div>
          <button type="submit" disabled={saving}
            className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Doctor'}
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <MdSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search doctors..."
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 dark:border-[#333] bg-white dark:bg-[#111] text-sm text-gray-900 dark:text-white" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-[#333] bg-white dark:bg-[#111] text-xs text-gray-700 dark:text-gray-300">
          <option value="">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="BUSY">Busy</option>
          <option value="ON_BREAK">On Break</option>
          <option value="OFFLINE">Offline</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-[#222]">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-500">Doctor</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-500">Specialty</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-500">Department</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-500">Room</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(doc => (
              <tr key={doc.id} className="border-b border-gray-50 dark:border-[#1a1a1a] last:border-0 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#222] flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400">
                      {doc.user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-[13px]">{doc.user.name}</p>
                      <p className="text-[11px] text-gray-400">{doc.user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-[13px]">{doc.specialty}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-[13px]">{doc.department?.name}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-[13px]">{doc.room_number || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_COLORS[doc.status] || STATUS_COLORS.OFFLINE}`}>
                    {doc.status}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-sm text-gray-400">No doctors found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
