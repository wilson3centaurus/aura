'use client'

import { useEffect, useState } from 'react'
import { MdAdd, MdClose, MdAccessTime, MdLocationOn } from 'react-icons/md'

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
  _count?: { doctors: number }
}

const FLOORS = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', 'Basement']
const ICONS = ['hospital', 'emergency', 'outpatient', 'maternity', 'surgery', 'pediatrics', 'pharmacy', 'lab', 'radiology']

export default function AdminDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', location: '', floor: 'Ground Floor', description: '', openTime: '08:00', closeTime: '17:00', icon: 'hospital' })
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    const data = await fetch('/api/departments').then(r => r.json())
    setDepartments(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const addDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setForm({ name: '', location: '', floor: 'Ground Floor', description: '', openTime: '08:00', closeTime: '17:00', icon: 'hospital' })
      setShowForm(false)
      loadData()
    } catch {}
    setSaving(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 rounded-full border-2 border-gray-900 dark:border-white border-t-transparent animate-spin" /></div>

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Departments</h1>
          <p className="text-xs text-gray-500">{departments.length} departments</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all">
          {showForm ? <><MdClose size={14} /> Cancel</> : <><MdAdd size={14} /> Add Department</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addDepartment} className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Department Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white" />
            <input placeholder="Location (e.g. Block A)" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white" />
            <select value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} required
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white">
              {FLOORS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <select value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })}
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white">
              {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <input type="time" value={form.openTime} onChange={e => setForm({ ...form, openTime: e.target.value })}
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white" />
            <input type="time" value={form.closeTime} onChange={e => setForm({ ...form, closeTime: e.target.value })}
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white" />
            <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="col-span-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white" />
          </div>
          <button type="submit" disabled={saving}
            className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Department'}
          </button>
        </form>
      )}

      <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-[#222]">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Department</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Location</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Hours</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Doctors</th>
            </tr>
          </thead>
          <tbody>
            {departments.map(dept => (
              <tr key={dept.id} className="border-b border-gray-50 dark:border-[#1a1a1a] last:border-0 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 dark:text-white text-[13px]">{dept.name}</p>
                  {dept.description && <p className="text-[11px] text-gray-400 mt-0.5">{dept.description}</p>}
                </td>
                <td className="px-4 py-3">
                  <p className="text-[13px] text-gray-600 dark:text-gray-400">{dept.location}</p>
                  <p className="text-[11px] text-gray-400">{dept.floor}</p>
                </td>
                <td className="px-4 py-3 text-[13px] text-gray-600 dark:text-gray-400">
                  {dept.open_time} — {dept.close_time}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-[#222] text-[11px] font-medium text-gray-600 dark:text-gray-400">
                    {dept._count?.doctors || 0}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
