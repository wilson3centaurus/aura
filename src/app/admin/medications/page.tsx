'use client'

import { useEffect, useState } from 'react'
import { MdAdd, MdClose, MdSearch } from 'react-icons/md'

interface Medication {
  id: string
  name: string
  form: string
  dosage: string
  price: number
  in_stock: boolean
  quantity: number
  prescription_required: boolean
  category: string | null
}

const CATEGORIES = ['Pain Relief', 'Antibiotics', 'Antimalarial', 'Antiretroviral', 'Cardiovascular', 'Diabetes', 'Respiratory', 'Gastrointestinal', 'Vitamins & Supplements', 'Mental Health', 'Dermatology', 'Other']
const FORMS = ['Tablets', 'Capsules', 'Syrup', 'Injection', 'Cream', 'Drops', 'Inhaler', 'Suppository', 'Patch']

export default function AdminMedications() {
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [form, setForm] = useState({ name: '', form: 'Tablets', dosage: '', price: '', quantity: '', prescriptionRequired: false, category: '' })
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    const data = await fetch('/api/medications').then(r => r.json())
    setMedications(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const filtered = medications.filter(m => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterCat && m.category !== filterCat) return false
    return true
  })

  const addMedication = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch('/api/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          quantity: parseInt(form.quantity) || 0,
          in_stock: parseInt(form.quantity) > 0,
          prescription_required: form.prescriptionRequired,
        }),
      })
      setForm({ name: '', form: 'Tablets', dosage: '', price: '', quantity: '', prescriptionRequired: false, category: '' })
      setShowForm(false)
      loadData()
    } catch {}
    setSaving(false)
  }

  const toggleStock = async (med: Medication) => {
    await fetch(`/api/medications/${med.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ in_stock: !med.in_stock }),
    })
    loadData()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 rounded-full border-2 border-gray-900 dark:border-white border-t-transparent animate-spin" /></div>

  const inStock = medications.filter(m => m.in_stock).length

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Medications</h1>
          <p className="text-xs text-gray-500">{medications.length} total &middot; {inStock} in stock &middot; {medications.length - inStock} out</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all">
          {showForm ? <><MdClose size={14} /> Cancel</> : <><MdAdd size={14} /> Add Medication</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addMedication} className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Medication Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white" />
            <select value={form.form} onChange={e => setForm({ ...form, form: e.target.value })}
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white">
              {FORMS.map(f => <option key={f}>{f}</option>)}
            </select>
            <input placeholder="Dosage (e.g. 500mg)" value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} required
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white" />
            <input placeholder="Price ($)" type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white" />
            <input placeholder="Quantity" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white">
              <option value="">Select Category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <input type="checkbox" checked={form.prescriptionRequired} onChange={e => setForm({ ...form, prescriptionRequired: e.target.checked })}
              className="rounded border-gray-300 dark:border-[#333]" />
            Prescription Required
          </label>
          <button type="submit" disabled={saving}
            className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Medication'}
          </button>
        </form>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medications..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] text-sm text-gray-900 dark:text-white" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] text-xs text-gray-600 dark:text-gray-400">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-[#222]">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Medication</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Price</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Qty</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(med => (
              <tr key={med.id} className="border-b border-gray-50 dark:border-[#1a1a1a] last:border-0 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 dark:text-white text-[13px]">{med.name}</p>
                  <p className="text-[11px] text-gray-400">{med.form} &middot; {med.dosage} {med.prescription_required && <span className="text-amber-500">• Rx</span>}</p>
                </td>
                <td className="px-4 py-3 text-[13px] text-gray-600 dark:text-gray-400">{med.category || '—'}</td>
                <td className="px-4 py-3 text-[13px] font-medium text-gray-900 dark:text-white">${med.price.toFixed(2)}</td>
                <td className="px-4 py-3 text-[13px] text-gray-600 dark:text-gray-400">{med.quantity}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStock(med)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${med.in_stock
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400'}`}>
                    {med.in_stock ? 'In Stock' : 'Out of Stock'}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No medications found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
