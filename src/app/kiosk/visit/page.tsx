'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FaChevronLeft, FaMagnifyingGlass, FaCheck, FaXmark, FaClock } from 'react-icons/fa6'
import { MdPersonSearch, MdLocalHospital } from 'react-icons/md'

export default function KioskVisit() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)

  const searchPatient = async () => {
    if (!search.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/patients?search=${encodeURIComponent(search)}`)
      const data = await res.json()
      setResults(data)
    } catch {
      setResults([])
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <header className="hero-gradient px-5 py-4 flex items-center gap-3 shadow-lg">
        <button
          onClick={() => router.push('/kiosk/menu')}
          className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
        >
          <FaChevronLeft size={14} />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-base leading-tight">Visit Someone Admitted</h1>
          <p className="text-white/65 text-xs">Search for an admitted patient</p>
        </div>
        <MdPersonSearch className="text-white/60 text-2xl" />
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Enter patient name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchPatient()}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              />
            </div>
            <button onClick={searchPatient} disabled={loading}
              className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 shadow-sm">
              {loading ? '...' : 'Search'}
            </button>
          </div>

          {results !== null && (
            <div className="space-y-3">
              {results.length > 0 ? results.map((patient: any) => (
                <div key={patient.id} className="bg-white dark:bg-gray-800/90 rounded-2xl shadow-sm p-5 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <MdLocalHospital className="text-blue-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{patient.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Admitted {new Date(patient.admissionDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm ml-13">
                    <p className="text-gray-600 dark:text-gray-300">
                      <strong>Ward:</strong> {patient.ward}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">
                      <strong>Room:</strong> {patient.room}, Bed {patient.bed}
                    </p>
                  </div>
                  <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold ${
                    patient.visitorsAllowed
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  }`}>
                    {patient.visitorsAllowed ? <FaCheck size={12} /> : <FaXmark size={12} />}
                    {patient.visitorsAllowed ? 'Visitors Allowed' : 'No Visitors Currently'}
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 bg-white dark:bg-gray-800/90 rounded-2xl">
                  <MdPersonSearch className="text-4xl text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">No patients found. Check the name and try again.</p>
                </div>
              )}
            </div>
          )}

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 text-sm text-amber-700 dark:text-amber-400">
            <div className="flex items-center gap-2 font-bold mb-1.5">
              <FaClock size={14} />
              Mutare Provincial Visiting Hours
            </div>
            <p>Mon-Fri: 2PM - 4PM</p>
            <p>Weekends: 10AM - 12PM, 2PM - 4PM</p>
            <p className="mt-1 text-xs opacity-75">Please bring a valid ID when visiting.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
