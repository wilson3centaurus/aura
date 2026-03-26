'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DirectionsModal from '@/components/DirectionsModal'
import { FaChevronLeft, FaLocationDot, FaMapLocationDot } from 'react-icons/fa6'
import {
  MdLocalPharmacy, MdEmergency, MdLocalHospital, MdScience,
  MdLocalCafe, MdLocalAtm, MdLocalParking, MdExitToApp,
  MdWc, MdMedicalServices, MdLocationOn,
} from 'react-icons/md'

interface LocationPin {
  id: string
  name: string
  category: string
  description: string | null
  latitude: number
  longitude: number
  writtenDirections: string | null
  floor: string
  iconName: string
  is_active: boolean
}

const CATEGORY_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  emergency: { icon: MdEmergency,       color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30' },
  pharmacy:  { icon: MdLocalPharmacy,   color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30' },
  toilet:    { icon: MdWc,              color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30' },
  lab:       { icon: MdScience,         color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/30' },
  cafeteria: { icon: MdLocalCafe,       color: 'text-orange-600',  bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/30' },
  atm:       { icon: MdLocalAtm,        color: 'text-yellow-600',  bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-900/30' },
  parking:   { icon: MdLocalParking,    color: 'text-slate-600',   bg: 'bg-slate-50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-900/30' },
  exit:      { icon: MdExitToApp,       color: 'text-gray-600',    bg: 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700' },
  ward:      { icon: MdMedicalServices, color: 'text-cyan-600',    bg: 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-100 dark:border-cyan-900/30' },
  entrance:  { icon: MdLocalHospital,   color: 'text-indigo-600',  bg: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30' },
  default:   { icon: MdLocationOn,      color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30' },
}

export default function KioskFacilities() {
  const router = useRouter()
  const [pins, setPins]             = useState<LocationPin[]>([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState<LocationPin | null>(null)

  useEffect(() => {
    fetch('/api/locations')
      .then(r => r.json())
      .then(data => { setPins(Array.isArray(data) ? data.filter((p: LocationPin) => p.is_active !== false) : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const meta = (category: string) => CATEGORY_META[category] ?? CATEGORY_META.default

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
          <h1 className="text-white font-bold text-base leading-tight">Find Facilities</h1>
          <p className="text-white/65 text-xs">Maps & directions — Mutare Provincial Hospital</p>
        </div>
        <FaMapLocationDot className="text-white/60 text-2xl" />
      </header>

      {/* Content */}
      <main className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-600">
              <FaLocationDot className="text-4xl animate-pulse-soft" />
              <p className="text-sm font-medium animate-pulse-soft">Loading locations…</p>
            </div>
          </div>
        ) : pins.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <FaMapLocationDot className="text-5xl text-gray-300 dark:text-gray-700 mb-3" />
            <p className="font-semibold text-gray-500 dark:text-gray-400">No locations configured yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">
              The hospital admin can add facility locations via the Admin Portal → Map Management.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
            {pins.map(pin => {
              const { icon: Icon, color, bg } = meta(pin.category)
              return (
                <button
                  key={pin.id}
                  onClick={() => setSelected(pin)}
                  className={`flex items-start gap-3 p-4 rounded-2xl border text-left active:scale-[0.97] transition-all hover:shadow-md ${bg}`}
                >
                  <div className={`mt-0.5 flex-shrink-0 w-10 h-10 rounded-xl bg-white dark:bg-gray-900/60 flex items-center justify-center shadow-sm`}>
                    <Icon className={`text-xl ${color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-snug">{pin.name}</p>
                    {pin.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug line-clamp-2">
                        {pin.description}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1 font-medium">{pin.floor}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Info hint */}
        {!loading && pins.length > 0 && (
          <div className="max-w-2xl mx-auto mt-4 px-4 py-3 rounded-2xl bg-white/60 dark:bg-gray-800/40 border border-blue-100 dark:border-blue-900/20 flex items-center gap-3">
            <FaMapLocationDot className="text-blue-500 text-xl flex-shrink-0" />
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Tap any facility to view <strong>Google Maps</strong> directions, step-by-step instructions, and a <strong>QR code</strong> to take directions on your phone.
            </p>
          </div>
        )}
      </main>

      {/* Directions modal */}
      {selected && (
        <DirectionsModal
          location={selected}
          onClose={() => setSelected(null)}
        />
      )}

    </div>
  )
}

