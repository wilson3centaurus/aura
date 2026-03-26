'use client'

import { useEffect, useRef, useState } from 'react'

interface Fee {
  id: string
  service: string
  category: string
  price: number
  description: string | null
  icon: string | null
}

const CATEGORIES = ['Consultation', 'Emergency', 'Diagnostics', 'Laboratory', 'Maternity', 'Surgery', 'Admission', 'Dental', 'Ophthalmology', 'Rehabilitation', 'Transport', 'Mortuary', 'Admin']

const CAT_ICONS: Record<string, string> = {
  'Consultation': '🩺', 'Emergency': '🚨', 'Diagnostics': '🔬',
  'Laboratory': '🧪', 'Maternity': '🤰', 'Surgery': '🔪',
  'Admission': '🛏️', 'Dental': '🦷', 'Ophthalmology': '👁️',
  'Rehabilitation': '🏃', 'Transport': '🚑', 'Mortuary': '⚰️', 'Admin': '📋',
}

const CAT_COLORS: Record<string, string> = {
  'Consultation': 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
  'Emergency':    'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300',
  'Diagnostics':  'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300',
  'Laboratory':   'bg-cyan-50 dark:bg-cyan-900/10 border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300',
  'Maternity':    'bg-pink-50 dark:bg-pink-900/10 border-pink-200 dark:border-pink-800 text-pink-800 dark:text-pink-300',
  'Surgery':      'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
  'Admission':    'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
  'Dental':       'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300',
  'Ophthalmology':'bg-sky-50 dark:bg-sky-900/10 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300',
  'Rehabilitation':'bg-lime-50 dark:bg-lime-900/10 border-lime-200 dark:border-lime-800 text-lime-800 dark:text-lime-300',
  'Transport':    'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300',
  'Mortuary':     'bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#333] text-gray-800 dark:text-gray-300',
  'Admin':        'bg-slate-50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300',
}

function InlinePrice({ fee, onSaved }: { fee: Fee; onSaved: (id: string, price: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(fee.price.toFixed(2))
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleEdit = () => {
    setValue(fee.price.toFixed(2))
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const save = async () => {
    const newPrice = parseFloat(value)
    if (isNaN(newPrice) || newPrice < 0) { setEditing(false); return }
    if (newPrice === fee.price) { setEditing(false); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/fees/${fee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: newPrice }),
      })
      if (res.ok) onSaved(fee.id, newPrice)
    } catch {}
    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-gray-500 text-sm">$</span>
        <input
          ref={inputRef}
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          onBlur={save}
          className="w-24 px-2 py-1 rounded-lg bg-white dark:bg-[#0a0a0a] border-2 border-[#003d73] text-sm font-bold text-gray-900 dark:text-white focus:outline-none text-right"
          disabled={saving}
        />
        {saving && <div className="w-3.5 h-3.5 rounded-full border-2 border-[#003d73] border-t-transparent animate-spin" />}
      </div>
    )
  }

  return (
    <button
      onClick={handleEdit}
      title="Click to edit price"
      className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
    >
      <span className="font-black text-gray-900 dark:text-white text-sm font-mono">${fee.price.toFixed(2)}</span>
      <svg className="w-3 h-3 text-gray-300 dark:text-gray-600 group-hover:text-[#003d73] dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  )
}

export default function AdminFees() {
  const [fees, setFees] = useState<Fee[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [form, setForm] = useState({ service: '', category: 'Consultation', price: '', description: '' })
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    const data = await fetch('/api/fees').then(r => r.json())
    setFees(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handlePriceSaved = (id: string, newPrice: number) => {
    setFees(prev => prev.map(f => f.id === id ? { ...f, price: newPrice } : f))
  }

  const addFee = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
      })
      setForm({ service: '', category: 'Consultation', price: '', description: '' })
      setShowForm(false)
      loadData()
    } catch {}
    setSaving(false)
  }

  const filtered = fees.filter(f => {
    if (search && !f.service.toLowerCase().includes(search.toLowerCase())) return false
    if (filterCat && f.category !== filterCat) return false
    return true
  })

  const groupedFees = filtered.reduce((acc, fee) => {
    if (!acc[fee.category]) acc[fee.category] = []
    acc[fee.category].push(fee)
    return acc
  }, {} as Record<string, Fee[]>)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-[#003d73] border-t-transparent animate-spin" />
    </div>
  )

  const totalRevenue = fees.reduce((sum, f) => sum + f.price, 0)

  return (
    <div className="max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Fees & Pricing</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {fees.length} services · {Object.keys(groupedFees).length} categories ·{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">Click any price to edit</span>
          </p>
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
          {showForm ? 'Cancel' : 'Add Service Fee'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={addFee} className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-5 space-y-4">
          <h2 className="text-sm font-black text-gray-900 dark:text-white">New Service Fee</h2>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Service Name *" value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} required
              className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required
              className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73]">
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
            </select>
            <input placeholder="Price (USD) *" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required
              className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
            <input placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-3 rounded-xl bg-[#003d73] hover:bg-[#002d57] text-white text-sm font-black transition-colors shadow-md shadow-blue-900/20 disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Service Fee'}
          </button>
        </form>
      )}

      {/* Inline edit hint */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        <span>Click any price to edit it inline. Press Enter to save, Escape to cancel.</span>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search services..."
            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] text-xs text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
        </select>
      </div>

      {/* Grouped fee tables */}
      <div className="space-y-4">
        {Object.entries(groupedFees).map(([category, items]) => {
          const colorClass = CAT_COLORS[category] || CAT_COLORS['Admin']
          const icon = CAT_ICONS[category] || '📋'
          const catTotal = items.reduce((sum, f) => sum + f.price, 0)
          return (
            <div key={category} className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] overflow-hidden">
              <div className={`px-4 py-3 border-b border-current/10 bg-gradient-to-r from-current/5 to-transparent flex items-center justify-between ${colorClass} border`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{icon}</span>
                  <h3 className="text-xs font-black uppercase tracking-widest">{category}</h3>
                  <span className="text-[10px] opacity-70">({items.length} service{items.length !== 1 ? 's' : ''})</span>
                </div>
              </div>
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {items.map(fee => (
                  <div key={fee.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#0d0d0d] border border-gray-100 dark:border-[#1e1e1e] hover:border-gray-200 dark:hover:border-[#2a2a2a] transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white text-[13px] truncate">{fee.service}</p>
                      {fee.description && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{fee.description}</p>}
                    </div>
                    <div className="flex-shrink-0">
                      <InlinePrice fee={fee} onSaved={handlePriceSaved} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {Object.keys(groupedFees).length === 0 && (
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-12 text-center">
            <p className="text-3xl mb-2">💰</p>
            <p className="text-sm text-gray-400">No service fees found</p>
          </div>
        )}
      </div>
    </div>
  )
}
