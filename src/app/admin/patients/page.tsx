'use client'

import { useEffect, useState } from 'react'
import { MdAdd, MdClose, MdSearch } from 'react-icons/md'

interface Ward {
  id: string
  name: string
  beds: { id: string; bed_number: string; is_occupied: boolean }[]
}

interface Patient {
  id: string
  name: string
  date_of_birth: string | null
  diagnosis: string | null
  ward_id: string | null
  bed_id: string | null
  ward: { name: string } | null
  bed: { bed_number: string } | null
  admission_date: string
  status: string
  visitors_allowed: boolean
  notes: string | null
}

export default function AdminPatients() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ADMITTED')
  const [form, setForm] = useState({ name: '', dateOfBirth: '', diagnosis: '', wardId: '', bedId: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    const [pData, wData] = await Promise.all([
      fetch('/api/patients').then(r => r.json()),
      fetch('/api/wards').then(r => r.json()),
    ])
    setPatients(Array.isArray(pData) ? pData : [])
    setWards(Array.isArray(wData) ? wData : [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const selectedWard = wards.find(w => w.id === form.wardId)
  const availableBeds = selectedWard?.beds?.filter(b => !b.is_occupied) || []

  const filtered = patients.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatus && p.status !== filterStatus) return false
    return true
  })

  const addPatient = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          date_of_birth: form.dateOfBirth || null,
          diagnosis: form.diagnosis || null,
          ward_id: form.wardId || null,
          bed_id: form.bedId || null,
          notes: form.notes || null,
        }),
      })
      setForm({ name: '', dateOfBirth: '', diagnosis: '', wardId: '', bedId: '', notes: '' })
      setShowForm(false)
      loadData()
    } catch {}
    setSaving(false)
  }

  const toggleVisitors = async (patient: Patient) => {
    await fetch(`/api/patients/${patient.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitors_allowed: !patient.visitors_allowed }),
    })
    loadData()
  }

  const discharge = async (id: string) => {
    await fetch(`/api/patients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'DISCHARGED' }),
    })
    loadData()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 rounded-full border-2 border-gray-900 dark:border-white border-t-transparent animate-spin" /></div>

  const admitted = patients.filter(p => p.status === 'ADMITTED').length

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Patients</h1>
          <p className="text-xs text-gray-500">{admitted} admitted &middot; {patients.length - admitted} discharged</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all">
          {showForm ? <><MdClose size={14} /> Cancel</> : <><MdAdd size={14} /> Admit Patient</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addPatient} className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Patient Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white" />
            <input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white" />
            <input placeholder="Diagnosis" value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })}
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white" />
            <select value={form.wardId} onChange={e => setForm({ ...form, wardId: e.target.value, bedId: '' })}
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white">
              <option value="">Select Ward</option>
              {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <select value={form.bedId} onChange={e => setForm({ ...form, bedId: e.target.value })} disabled={!form.wardId}
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white disabled:opacity-50">
              <option value="">Select Bed</option>
              {availableBeds.map(b => <option key={b.id} value={b.id}>{b.bed_number}</option>)}
            </select>
            <input placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white" />
          </div>
          <button type="submit" disabled={saving}
            className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50">
            {saving ? 'Admitting...' : 'Admit Patient'}
          </button>
        </form>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] text-sm text-gray-900 dark:text-white" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] text-xs text-gray-600 dark:text-gray-400">
          <option value="">All</option>
          <option value="ADMITTED">Admitted</option>
          <option value="DISCHARGED">Discharged</option>
        </select>
      </div>

      <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-[#222]">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Patient</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Ward / Bed</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Admitted</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Visitors</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(patient => (
              <tr key={patient.id} className={`border-b border-gray-50 dark:border-[#1a1a1a] last:border-0 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] ${patient.status === 'DISCHARGED' ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 dark:text-white text-[13px]">{patient.name}</p>
                  {patient.diagnosis && <p className="text-[11px] text-gray-400">{patient.diagnosis}</p>}
                </td>
                <td className="px-4 py-3">
                  <p className="text-[13px] text-gray-600 dark:text-gray-400">
                    {patient.ward?.name || '—'} {patient.bed?.bed_number ? `/ ${patient.bed.bed_number}` : ''}
                  </p>
                </td>
                <td className="px-4 py-3 text-[13px] text-gray-600 dark:text-gray-400">
                  {new Date(patient.admission_date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {patient.status === 'ADMITTED' ? (
                    <button onClick={() => toggleVisitors(patient)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${patient.visitors_allowed
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                        : 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400'}`}>
                      {patient.visitors_allowed ? 'Allowed' : 'Restricted'}
                    </button>
                  ) : <span className="text-[11px] text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  {patient.status === 'ADMITTED' ? (
                    <button onClick={() => discharge(patient.id)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#333] transition-all">
                      Discharge
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-[#222] text-gray-400">
                      Discharged
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No patients found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
