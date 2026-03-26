'use client'

import { useEffect, useState } from 'react'
import { MdAdd, MdClose, MdHotel, MdExpandMore, MdExpandLess } from 'react-icons/md'

interface Bed {
  id: string
  bed_number: string
  is_occupied: boolean
  patient?: { id: string; name: string; diagnosis: string | null } | null
}

interface Ward {
  id: string
  name: string
  ward_type: string
  floor: string
  total_beds: number
  beds: Bed[]
  occupied_beds?: number
  available_beds?: number
}

const WARD_TYPES = ['General', 'Maternity', 'Pediatric', 'ICU', 'Surgical', 'Orthopedic', 'Isolation', 'Psychiatric', 'Recovery']
const FLOORS = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', 'Basement']

export default function AdminWards() {
  const [wards, setWards] = useState<Ward[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedWard, setExpandedWard] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', wardType: 'General', floor: 'Ground Floor', totalBeds: '20' })
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    const data = await fetch('/api/wards').then(r => r.json())
    setWards(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const loadWardDetail = async (wardId: string) => {
    if (expandedWard === wardId) { setExpandedWard(null); return }
    const data = await fetch(`/api/wards/${wardId}`).then(r => r.json())
    setWards(prev => prev.map(w => w.id === wardId ? { ...w, beds: data.beds || [] } : w))
    setExpandedWard(wardId)
  }

  const addWard = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch('/api/wards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          ward_type: form.wardType,
          floor: form.floor,
          total_beds: parseInt(form.totalBeds),
        }),
      })
      setForm({ name: '', wardType: 'General', floor: 'Ground Floor', totalBeds: '20' })
      setShowForm(false)
      loadData()
    } catch {}
    setSaving(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 rounded-full border-2 border-gray-900 dark:border-white border-t-transparent animate-spin" /></div>

  const totalBeds = wards.reduce((s, w) => s + (w.total_beds || 0), 0)
  const occupiedBeds = wards.reduce((s, w) => s + (w.occupied_beds || 0), 0)

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Wards & Beds</h1>
          <p className="text-xs text-gray-500">{wards.length} wards &middot; {occupiedBeds}/{totalBeds} beds occupied</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all">
          {showForm ? <><MdClose size={14} /> Cancel</> : <><MdAdd size={14} /> Add Ward</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addWard} className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Ward Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white" />
            <select value={form.wardType} onChange={e => setForm({ ...form, wardType: e.target.value })}
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white">
              {WARD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })}
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white">
              {FLOORS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <input placeholder="Number of Beds" type="number" min="1" max="100" value={form.totalBeds}
              onChange={e => setForm({ ...form, totalBeds: e.target.value })} required
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white" />
          </div>
          <button type="submit" disabled={saving}
            className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Ward'}
          </button>
        </form>
      )}

      {/* Ward Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {wards.map(ward => {
          const occ = ward.occupied_beds || 0
          const total = ward.total_beds || 1
          const pct = Math.round((occ / total) * 100)
          const color = pct > 90 ? 'red' : pct > 70 ? 'amber' : 'emerald'
          const isExpanded = expandedWard === ward.id

          return (
            <div key={ward.id} className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[13px] font-semibold text-gray-900 dark:text-white">{ward.name}</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">{ward.ward_type} &middot; {ward.floor}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    color === 'red' ? 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400' :
                    color === 'amber' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                    'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                  }`}>
                    {pct}%
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                    <span>{occ} occupied</span>
                    <span>{ward.available_beds || (total - occ)} available</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-[#222] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      color === 'red' ? 'bg-red-500' : color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <button onClick={() => loadWardDetail(ward.id)}
                  className="mt-3 flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <MdHotel size={14} />
                  {isExpanded ? 'Hide' : 'View'} Beds
                  {isExpanded ? <MdExpandLess size={14} /> : <MdExpandMore size={14} />}
                </button>
              </div>

              {isExpanded && ward.beds && (
                <div className="border-t border-gray-100 dark:border-[#222] p-3">
                  <div className="grid grid-cols-6 gap-1.5">
                    {ward.beds.map(bed => (
                      <div key={bed.id} title={bed.is_occupied ? `${bed.bed_number} — ${bed.patient?.name || 'Occupied'}` : `${bed.bed_number} — Available`}
                        className={`aspect-square rounded-lg flex items-center justify-center text-[9px] font-medium cursor-default transition-all ${
                          bed.is_occupied
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30'
                            : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30'
                        }`}>
                        {bed.bed_number.replace(/^[A-Z]+-/, '')}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" /> Available</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500" /> Occupied</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {wards.length === 0 && (
        <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-8 text-center text-sm text-gray-400">
          No wards created yet
        </div>
      )}
    </div>
  )
}
