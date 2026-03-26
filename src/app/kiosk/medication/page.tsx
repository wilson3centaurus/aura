'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FaChevronLeft, FaPills, FaCheck, FaXmark, FaFileLines, FaMagnifyingGlass } from 'react-icons/fa6'
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
  latitude: parseFloat(process.env.NEXT_PUBLIC_HOSPITAL_LAT || '-18.9718'),
  longitude: parseFloat(process.env.NEXT_PUBLIC_HOSPITAL_LNG || '32.6703'),
  writtenDirections: 'From the kiosk, walk straight ahead past the reception desk.\nTurn left at the corridor.\nThe pharmacy is the second door on your right.\nLook for the green "Pharmacy" sign above the door.',
  floor: 'Ground Floor',
  iconName: 'pharmacy',
  isActive: true,
}

export default function KioskMedication() {
  const router = useRouter()
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showDirections, setShowDirections] = useState(false)

  useEffect(() => {
    fetch('/api/medications')
      .then(res => res.json())
      .then(data => { setMedications(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = medications.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.category && m.category.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="flex flex-col min-h-screen">

      {/* Header */}
      <header className="hero-gradient px-5 py-4 flex items-center gap-3 shadow-lg">
        <button
          onClick={() => router.push('/kiosk/menu')}
          className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
        >
          <FaChevronLeft size={14} />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-base leading-tight">Medication Availability</h1>
          <p className="text-white/65 text-xs">Check pharmacy stock — Mutare Provincial Hospital</p>
        </div>
        <FaPills className="text-white/60 text-2xl" />
      </header>

      {/* Search */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative max-w-2xl mx-auto">
          <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search medication name or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-600">
              <FaPills className="text-4xl animate-pulse-soft" />
              <p className="text-sm font-medium animate-pulse-soft">Loading medications…</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {filtered.map(med => (
              <div key={med.id} className="bg-white dark:bg-gray-800/90 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${med.inStock ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                      <MdLocalPharmacy className={`text-xl ${med.inStock ? 'text-emerald-600' : 'text-red-500'}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-snug">{med.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{med.form} · {med.dosage}</p>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    med.inStock
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {med.inStock ? <FaCheck size={10} /> : <FaXmark size={10} />}
                    {med.inStock ? 'IN STOCK' : 'OUT'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50 dark:border-gray-700/50">
                  <span className="text-lg font-black text-blue-700 dark:text-blue-400">${med.price.toFixed(2)}</span>
                  <span className={`flex items-center gap-1 text-xs font-medium ${
                    med.prescriptionRequired
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    <FaFileLines size={10} />
                    {med.prescriptionRequired ? 'Prescription Required' : 'No Prescription Needed'}
                  </span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-2 flex flex-col items-center justify-center py-10 text-center">
                <FaPills className="text-4xl text-gray-300 dark:text-gray-700 mb-3" />
                <p className="font-semibold text-gray-500 dark:text-gray-400">No medications found</p>
                <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        )}

        {/* Pharmacy directions card */}
        {!loading && (
          <button
            onClick={() => setShowDirections(true)}
            className="max-w-2xl mx-auto mt-4 w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 hover:shadow-md transition-all text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <MdLocationOn className="text-white text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">Navigate to Pharmacy</p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 flex items-center gap-1.5 mt-0.5">
                <MdAccessTime size={12} />
                Main Pharmacy · Ground Floor · Mon-Fri 8AM-5PM
              </p>
            </div>
            <FaChevronLeft className="text-emerald-400 rotate-180" size={12} />
          </button>
        )}
      </main>

      {/* Directions modal */}
      {showDirections && (
        <DirectionsModal
          location={PHARMACY_LOCATION}
          onClose={() => setShowDirections(false)}
        />
      )}
    </div>
  )
}
