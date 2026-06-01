'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  FaChevronLeft, FaPills, FaFileLines,
  FaMagnifyingGlass, FaCircleXmark,
} from 'react-icons/fa6'
import { MdLocalPharmacy, MdLocationOn, MdAccessTime } from 'react-icons/md'
import DirectionsModal from '@/components/DirectionsModal'

interface Medication {
  id: string
  name: string
  form: string
  dosage: string
  price: number
  inStock: boolean
  quantity: number
  prescriptionRequired: boolean
  category: string | null
}

const PHARMACY_LOCATION = {
  id: 'pharmacy-main',
  name: 'Main Pharmacy',
  category: 'pharmacy',
  description: 'Mutare Provincial Hospital Main Pharmacy',
  latitude: parseFloat(process.env.NEXT_PUBLIC_HOSPITAL_LAT || '-18.9638'),
  longitude: parseFloat(process.env.NEXT_PUBLIC_HOSPITAL_LNG || '32.6633'),
  writtenDirections: 'From the kiosk, walk straight ahead past the reception desk.\nTurn left at the corridor.\nThe pharmacy is the second door on your right.\nLook for the green "Pharmacy" sign above the door.',
  floor: 'Ground Floor',
  iconName: 'pharmacy',
  isActive: true,
}

function stockLevel(qty: number, inStock: boolean) {
  if (!inStock || qty === 0) return { label: 'Out of Stock', color: 'text-red-600 dark:text-red-400',       bg: 'bg-red-100 dark:bg-red-900/30',       dot: 'bg-red-500' }
  if (qty < 20)              return { label: 'Low Stock',    color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', dot: 'bg-orange-500' }
  if (qty < 100)             return { label: 'In Stock',     color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-100 dark:bg-amber-900/30',   dot: 'bg-amber-500' }
  return                          { label: 'Well Stocked',  color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', dot: 'bg-emerald-500' }
}

const CATEGORY_COLORS: Record<string, string> = {
  'Antibiotics':     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Pain Relief':     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Antimalarials':   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Cardiovascular':  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  'Antifungals':     'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Diabetes':        'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'Respiratory':     'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  'Antihistamines':  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Steroids':        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Antiparasitic':   'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'Neurological':    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'Psychiatric':     'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
  'Supplements':     'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
  'Antiseptics':     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'IV Fluids':       'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
  'Obstetrics':      'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'Electrolytes':    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Anticoagulants':  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}
const DEFAULT_CAT_COLOR = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'

export default function KioskMedication() {
  const router = useRouter()
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [showDirections, setShowDirections] = useState(false)

  useEffect(() => {
    fetch('/api/medications')
      .then(res => res.json())
      .then(data => { setMedications(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(medications.map(m => m.category).filter(Boolean) as string[])).sort()],
    [medications],
  )

  const bySearch = useMemo(
    () => medications.filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.category && m.category.toLowerCase().includes(search.toLowerCase()))
    ),
    [medications, search],
  )

  const filtered = useMemo(
    () => activeCategory === 'All' ? bySearch : bySearch.filter(m => m.category === activeCategory),
    [bySearch, activeCategory],
  )

  const grouped = useMemo(() => {
    const g: Record<string, Medication[]> = {}
    filtered.forEach(med => {
      const cat = med.category || 'General'
      if (!g[cat]) g[cat] = []
      g[cat].push(med)
    })
    return g
  }, [filtered])

  const inStockCount = filtered.filter(m => m.inStock).length

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <header className="hero-gradient px-5 py-4 flex items-center gap-3 shadow-lg">
        <button
          onPointerDown={() => router.push('/kiosk/menu')}
          className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
        >
          <FaChevronLeft size={14} />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-base leading-tight">Medication Availability</h1>
          <p className="text-white/65 text-xs">Pharmacy stock — Mutare Provincial Hospital</p>
        </div>
        <FaPills className="text-white/60 text-2xl" />
      </header>

      {/* Search + summary */}
      <div className="px-4 pt-4 pb-2 space-y-2">
        <div className="relative max-w-2xl mx-auto">
          <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search by medication name or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
          {search && (
            <button onPointerDown={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <FaCircleXmark size={15} />
            </button>
          )}
        </div>
        {!loading && (
          <p className="max-w-2xl mx-auto text-xs text-gray-500 dark:text-gray-400 px-1">
            <span className="font-semibold text-gray-700 dark:text-gray-200">{filtered.length}</span> items &middot;{' '}
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{inStockCount} in stock</span>
            {filtered.length - inStockCount > 0 && (
              <> &middot; <span className="text-red-500 font-semibold">{filtered.length - inStockCount} unavailable</span></>
            )}
          </p>
        )}
      </div>

      {/* Category filter pills */}
      {!loading && (
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto max-w-2xl mx-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onPointerDown={() => setActiveCategory(cat)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {cat}
                {cat !== 'All' && (
                  <span className={`text-[10px] ${activeCategory === cat ? 'text-white/70' : 'text-gray-400'}`}>
                    {medications.filter(m => m.category === cat).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 px-4 pb-4 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
              <p className="text-sm text-gray-400 font-medium">Loading medications…</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <FaPills className="text-3xl text-gray-300 dark:text-gray-600" />
            </div>
            <p className="font-semibold text-gray-500 dark:text-gray-400">No medications found</p>
            <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Try a different search term or category</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-5">
            {Object.entries(grouped).map(([category, meds]) => {
              const catColor = CATEGORY_COLORS[category] ?? DEFAULT_CAT_COLOR
              return (
                <div key={category}>
                  {activeCategory === 'All' && (
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${catColor}`}>{category}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-600">{meds.length} item{meds.length !== 1 ? 's' : ''}</span>
                      <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {meds.map(med => {
                      const { color, bg, dot } = stockLevel(med.quantity, med.inStock)
                      return (
                        <div key={med.id} className="bg-white dark:bg-gray-800/90 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                                <MdLocalPharmacy className={`text-xl ${color}`} />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-snug">{med.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{med.form} · {med.dosage}</p>
                              </div>
                            </div>
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold flex-shrink-0 ${bg} ${color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                              {med.inStock ? (med.quantity < 20 ? 'Low' : 'In Stock') : 'Out'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-2.5 border-t border-gray-50 dark:border-gray-700/50">
                            <div>
                              <span className="text-xl font-black text-blue-700 dark:text-blue-400">${med.price.toFixed(2)}</span>
                              {med.inStock && (
                                <span className="text-[10px] text-gray-400 ml-1">qty: {med.quantity}</span>
                              )}
                            </div>
                            <span className={`flex items-center gap-1 text-xs font-semibold ${
                              med.prescriptionRequired ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'
                            }`}>
                              <FaFileLines size={10} />
                              {med.prescriptionRequired ? 'Rx Required' : 'OTC'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pharmacy navigate card */}
        {!loading && (
          <button
            onPointerDown={() => setShowDirections(true)}
            className="max-w-2xl mx-auto mt-5 w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 hover:shadow-md transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <MdLocationOn className="text-white text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">Navigate to Pharmacy</p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 flex items-center gap-1.5 mt-0.5">
                <MdAccessTime size={12} />
                Main Pharmacy · Ground Floor · Mon–Fri 8AM–5PM
              </p>
            </div>
            <FaChevronLeft className="text-emerald-400 rotate-180 flex-shrink-0" size={12} />
          </button>
        )}
      </main>

      {showDirections && (
        <DirectionsModal location={PHARMACY_LOCATION} onClose={() => setShowDirections(false)} />
      )}
    </div>
  )
}
