'use client'

import { useEffect, useState } from 'react'

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

const CAT_ICONS: Record<string, string> = {
  'Pain Relief': 'ðŸ©¹',
  'Antibiotics': 'ðŸ¦ ',
  'Antimalarial': 'ðŸ¦Ÿ',
  'Antiretroviral': 'ðŸ’Š',
  'Cardiovascular': 'â¤ï¸',
  'Diabetes': 'ðŸ©¸',
  'Respiratory': 'ðŸŒ¬ï¸',
  'Gastrointestinal': 'ðŸ«€',
  'Vitamins & Supplements': 'ðŸŒ¿',
  'Mental Health': 'ðŸ§ ',
  'Dermatology': 'ðŸ©¹',
  'Other': 'ðŸ’Š',
}

const FORM_ICONS: Record<string, string> = {
  'Tablets': 'ðŸ’Š', 'Capsules': 'ðŸ’Š', 'Syrup': 'ðŸ§´', 'Injection': 'ðŸ’‰',
  'Cream': 'ðŸ§´', 'Drops': 'ðŸ’§', 'Inhaler': 'ðŸŒ¬ï¸', 'Suppository': 'ðŸ’Š', 'Patch': 'ðŸ©¹',
}

const CAT_COLORS: Record<string, string> = {
  'Pain Relief': 'bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400',
  'Antibiotics': 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  'Antimalarial': 'bg-lime-100 dark:bg-lime-900/20 text-lime-700 dark:text-lime-400',
  'Antiretroviral': 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
  'Cardiovascular': 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  'Diabetes': 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  'Respiratory': 'bg-sky-100 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400',
  'Gastrointestinal': 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
  'Vitamins & Supplements': 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
  'Mental Health': 'bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400',
  'Dermatology': 'bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400',
  'Other': 'bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400',
}

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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-[#003d73] border-t-transparent animate-spin" />
    </div>
  )

  const inStock = medications.filter(m => m.in_stock).length
  const outOfStock = medications.length - inStock

  return (
    <div className="max-w-6xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Medications</h1>
          <p className="text-xs text-gray-500 mt-0.5">{medications.length} total Â· {inStock} in stock Â· {outOfStock} out of stock</p>
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
          {showForm ? 'Cancel' : 'Add Medication'}
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-center gap-3">
          <span className="text-2xl">âœ…</span>
          <div>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">{inStock}</p>
            <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-bold uppercase tracking-wider">In Stock</p>
          </div>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-xl p-3 flex items-center gap-3">
          <span className="text-2xl">âš ï¸</span>
          <div>
            <p className="text-xl font-black text-rose-700 dark:text-rose-400">{outOfStock}</p>
            <p className="text-[10px] text-rose-600/70 dark:text-rose-400/70 font-bold uppercase tracking-wider">Out of Stock</p>
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex items-center gap-3">
          <span className="text-2xl">ðŸ’Š</span>
          <div>
            <p className="text-xl font-black text-blue-700 dark:text-blue-400">{medications.length}</p>
            <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 font-bold uppercase tracking-wider">Total Items</p>
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={addMedication} className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-5 space-y-4">
          <h2 className="text-sm font-black text-gray-900 dark:text-white">New Medication</h2>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Medication Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
              className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
            <select value={form.form} onChange={e => setForm({ ...form, form: e.target.value })}
              className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73]">
              {FORMS.map(f => <option key={f}>{f}</option>)}
            </select>
            <input placeholder="Dosage (e.g. 500mg)" value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} required
              className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
            <input placeholder="Price (USD)" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required
              className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
            <input placeholder="Quantity" type="number" min="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required
              className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73]">
              <option value="">Select Category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
            <input type="checkbox" checked={form.prescriptionRequired} onChange={e => setForm({ ...form, prescriptionRequired: e.target.checked })}
              className="rounded border-gray-300 dark:border-[#333] accent-[#003d73]" />
            Prescription Required (Rx)
          </label>
          <button type="submit" disabled={saving}
            className="w-full py-3 rounded-xl bg-[#003d73] hover:bg-[#002d57] text-white text-sm font-black transition-colors shadow-md shadow-blue-900/20 disabled:opacity-50">
            {saving ? 'Creating...' : 'Add to Inventory'}
          </button>
        </form>
      )}

      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medications..."
            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] text-xs text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-[#222] bg-gray-50 dark:bg-[#0a0a0a]">
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Medication</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Price</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Qty</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(med => {
              const catColor = CAT_COLORS[med.category || ''] || CAT_COLORS['Other']
              const formIcon = FORM_ICONS[med.form] || 'ðŸ’Š'
              const catIcon = CAT_ICONS[med.category || ''] || 'ðŸ’Š'
              return (
                <tr key={med.id} className="border-b border-gray-50 dark:border-[#1a1a1a] last:border-0 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{formIcon}</span>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-[13px]">{med.name}</p>
                        <p className="text-[11px] text-gray-400">
                          {med.form} Â· {med.dosage}
                          {med.prescription_required && <span className="ml-1.5 text-amber-500 font-bold">Rx</span>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {med.category ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold ${catColor}`}>
                        {catIcon} {med.category}
                      </span>
                    ) : <span className="text-[12px] text-gray-400">â€”</span>}
                  </td>
                  <td className="px-4 py-3 text-[13px] font-bold text-gray-900 dark:text-white font-mono">
                    ${med.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[13px] font-bold ${med.quantity < 10 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {med.quantity}
                      {med.quantity < 10 && med.quantity > 0 && <span className="ml-1 text-[10px] text-rose-500">low</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStock(med)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        med.in_stock
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30'
                      }`}
                    >
                      {med.in_stock ? 'âœ“ In Stock' : 'âœ— Out of Stock'}
                    </button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <p className="text-3xl mb-2">ðŸ’Š</p>
                  <p className="text-sm text-gray-400">No medications found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
