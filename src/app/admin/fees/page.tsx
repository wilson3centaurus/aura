'use client'

import { useEffect, useState } from 'react'
import { MdAdd, MdClose, MdSearch } from 'react-icons/md'

interface Fee {
  id: string
  service: string
  category: string
  price: number
  description: string | null
  icon: string | null
}

const CATEGORIES = ['Consultation', 'Emergency', 'Diagnostics', 'Laboratory', 'Maternity', 'Surgery', 'Admission', 'Dental', 'Ophthalmology', 'Rehabilitation', 'Transport', 'Mortuary', 'Admin']

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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 rounded-full border-2 border-gray-900 dark:border-white border-t-transparent animate-spin" /></div>

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Fees & Pricing</h1>
          <p className="text-xs text-gray-500">{fees.length} services &middot; {Object.keys(groupedFees).length} categories</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all">
          {showForm ? <><MdClose size={14} /> Cancel</> : <><MdAdd size={14} /> Add Fee</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addFee} className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Service Name" value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} required
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Price ($)" type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white" />
            <input placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white" />
          </div>
          <button type="submit" disabled={saving}
            className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Fee'}
          </button>
        </form>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search services..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] text-sm text-gray-900 dark:text-white" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] text-xs text-gray-600 dark:text-gray-400">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {Object.entries(groupedFees).map(([category, items]) => (
          <div key={category} className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-[#222]">
              <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wide">{category}</h3>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {items.map(fee => (
                  <tr key={fee.id} className="border-b border-gray-50 dark:border-[#1a1a1a] last:border-0 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-gray-900 dark:text-white text-[13px]">{fee.service}</p>
                      {fee.description && <p className="text-[11px] text-gray-400">{fee.description}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="font-semibold text-[13px] text-gray-900 dark:text-white">${fee.price.toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {Object.keys(groupedFees).length === 0 && (
          <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-8 text-center text-sm text-gray-400">
            No fees found
          </div>
        )}
      </div>
    </div>
  )
}
