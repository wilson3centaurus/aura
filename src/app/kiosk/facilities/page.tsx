'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import DirectionsModal from '@/components/DirectionsModal'
import { FaChevronLeft, FaLocationDot, FaMapLocationDot, FaMagnifyingGlass, FaCircleXmark } from 'react-icons/fa6'
import {
  MdLocalPharmacy, MdEmergency, MdLocalHospital, MdScience,
  MdLocalCafe, MdLocalAtm, MdLocalParking, MdExitToApp,
  MdWc, MdMedicalServices, MdLocationOn,
} from 'react-icons/md'
import { useBatchTranslation } from '@/components/useBatchTranslation'
import { useKioskLanguage } from '@/components/useKioskLanguage'

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

type PinMeta = { icon: React.ElementType; color: string; bg: string; border: string }
const CATEGORY_META: Record<string, PinMeta> = {
  emergency:  { icon: MdEmergency,       color: 'text-red-600 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-900/20',       border: 'border-red-100 dark:border-red-900/30' },
  pharmacy:   { icon: MdLocalPharmacy,   color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-900/30' },
  toilet:     { icon: MdWc,              color: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-50 dark:bg-blue-900/20',       border: 'border-blue-100 dark:border-blue-900/30' },
  lab:        { icon: MdScience,         color: 'text-purple-600 dark:text-purple-400',   bg: 'bg-purple-50 dark:bg-purple-900/20',   border: 'border-purple-100 dark:border-purple-900/30' },
  radiology:  { icon: MdScience,         color: 'text-indigo-600 dark:text-indigo-400',   bg: 'bg-indigo-50 dark:bg-indigo-900/20',   border: 'border-indigo-100 dark:border-indigo-900/30' },
  cafeteria:  { icon: MdLocalCafe,       color: 'text-orange-600 dark:text-orange-400',   bg: 'bg-orange-50 dark:bg-orange-900/20',   border: 'border-orange-100 dark:border-orange-900/30' },
  atm:        { icon: MdLocalAtm,        color: 'text-yellow-600 dark:text-yellow-400',   bg: 'bg-yellow-50 dark:bg-yellow-900/20',   border: 'border-yellow-100 dark:border-yellow-900/30' },
  parking:    { icon: MdLocalParking,    color: 'text-slate-600 dark:text-slate-400',     bg: 'bg-slate-50 dark:bg-slate-900/20',     border: 'border-slate-100 dark:border-slate-900/30' },
  exit:       { icon: MdExitToApp,       color: 'text-gray-600 dark:text-gray-400',       bg: 'bg-gray-50 dark:bg-gray-800',           border: 'border-gray-100 dark:border-gray-700' },
  ward:       { icon: MdMedicalServices, color: 'text-cyan-600 dark:text-cyan-400',       bg: 'bg-cyan-50 dark:bg-cyan-900/20',       border: 'border-cyan-100 dark:border-cyan-900/30' },
  entrance:   { icon: MdLocalHospital,   color: 'text-indigo-600 dark:text-indigo-400',   bg: 'bg-indigo-50 dark:bg-indigo-900/20',   border: 'border-indigo-100 dark:border-indigo-900/30' },
  department: { icon: MdLocalHospital,   color: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-50 dark:bg-blue-900/20',       border: 'border-blue-100 dark:border-blue-900/30' },
  facility:   { icon: MdMedicalServices, color: 'text-teal-600 dark:text-teal-400',       bg: 'bg-teal-50 dark:bg-teal-900/20',       border: 'border-teal-100 dark:border-teal-900/30' },
  outpatient: { icon: MdLocalHospital,   color: 'text-sky-600 dark:text-sky-400',         bg: 'bg-sky-50 dark:bg-sky-900/20',         border: 'border-sky-100 dark:border-sky-900/30' },
  default:    { icon: MdLocationOn,      color: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-50 dark:bg-blue-900/20',       border: 'border-blue-100 dark:border-blue-900/30' },
}

const FILTER_GROUPS = [
  { id: 'all',       label: 'All' },
  { id: 'ward',      label: 'Wards' },
  { id: 'department', label: 'Depts' },
  { id: 'facility',  label: 'Services' },
  { id: 'emergency', label: 'Emergency' },
  { id: 'pharmacy',  label: 'Pharmacy' },
  { id: 'lab',       label: 'Lab' },
  { id: 'cafeteria', label: 'Cafeteria' },
  { id: 'atm',       label: 'ATM' },
  { id: 'parking',   label: 'Parking' },
]

const FLOORS = ['All Floors', 'Ground Floor', '1st Floor', '2nd Floor']

export default function KioskFacilities() {
  const router = useRouter()
  const { language } = useKioskLanguage()
  const [pins, setPins]               = useState<LocationPin[]>([])
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState<LocationPin | null>(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [activeFloor, setActiveFloor]   = useState('All Floors')
  const [search, setSearch]             = useState('')

  const translatedLabels = useBatchTranslation([
    'Find Facilities',
    'Maps and directions',
    'Loading locations...',
    'No locations configured yet',
    'The hospital admin can add facility locations via the Admin Portal and Map Management.',
    'Tap any facility to view Google Maps directions, step-by-step instructions, and a QR code for your phone.',
  ], language)

  const [pageTitle, pageSubtitle, loadingLabel, noLocationsLabel, noLocationsHint, hintLabel] = translatedLabels
  const pinTranslationInputs = useMemo(
    () => pins.flatMap(pin => [pin.name, pin.description || '', pin.floor || '']),
    [pins],
  )
  const pinTranslations = useBatchTranslation(pinTranslationInputs, language)
  const translatedPins = useMemo(
    () => pins.map((pin, index) => ({
      ...pin,
      translatedName: pinTranslations[index * 3] || pin.name,
      translatedDescription: pin.description ? pinTranslations[index * 3 + 1] || pin.description : null,
      translatedFloor: pin.floor ? pinTranslations[index * 3 + 2] || pin.floor : pin.floor,
    })),
    [pinTranslations, pins],
  )

  useEffect(() => {
    fetch('/api/locations')
      .then(r => r.json())
      .then(data => { setPins(Array.isArray(data) ? data.filter((p: LocationPin) => p.is_active !== false) : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return translatedPins.filter(pin => {
      const matchFilter = activeFilter === 'all' || pin.category === activeFilter
      const matchFloor  = activeFloor === 'All Floors' || pin.floor === activeFloor
      const matchSearch = !search ||
        pin.translatedName.toLowerCase().includes(search.toLowerCase()) ||
        (pin.translatedDescription && pin.translatedDescription.toLowerCase().includes(search.toLowerCase()))
      return matchFilter && matchFloor && matchSearch
    })
  }, [translatedPins, activeFilter, activeFloor, search])

  const countByFilter = useMemo(() => {
    const c: Record<string, number> = { all: translatedPins.length }
    translatedPins.forEach(p => { c[p.category] = (c[p.category] || 0) + 1 })
    return c
  }, [translatedPins])

  const meta = (category: string) => CATEGORY_META[category] ?? CATEGORY_META.default

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
          <h1 className="text-white font-bold text-base leading-tight">{pageTitle}</h1>
          <p className="text-white/65 text-xs">{pageSubtitle} — Mutare Provincial Hospital</p>
        </div>
        <FaMapLocationDot className="text-white/60 text-2xl" />
      </header>

      {/* Search */}
      <div className="px-4 pt-3 pb-1">
        <div className="relative max-w-2xl mx-auto">
          <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search facilities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
          {search && (
            <button onPointerDown={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <FaCircleXmark size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Category filter pills */}
      {!loading && (
        <div className="px-4 pt-2 pb-1">
          <div className="flex gap-2 overflow-x-auto max-w-2xl mx-auto pb-1">
            {FILTER_GROUPS.filter(g => g.id === 'all' || countByFilter[g.id]).map(g => (
              <button
                key={g.id}
                onPointerDown={() => setActiveFilter(g.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeFilter === g.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {g.label}
                <span className={`text-[10px] font-medium ${activeFilter === g.id ? 'text-white/70' : 'text-gray-400'}`}>
                  {g.id === 'all' ? countByFilter.all : (countByFilter[g.id] ?? 0)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floor filter */}
      {!loading && (
        <div className="px-4 pb-2">
          <div className="flex gap-2 max-w-2xl mx-auto">
            {FLOORS.map(floor => (
              <button
                key={floor}
                onPointerDown={() => setActiveFloor(floor)}
                className={`flex-shrink-0 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  activeFloor === floor
                    ? 'bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {floor}
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
              <p className="text-sm text-gray-400 font-medium">{loadingLabel}</p>
            </div>
          </div>
        ) : pins.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <FaMapLocationDot className="text-3xl text-gray-300 dark:text-gray-600" />
            </div>
            <p className="font-semibold text-gray-500 dark:text-gray-400">{noLocationsLabel}</p>
            <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">{noLocationsHint}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FaLocationDot className="text-4xl text-gray-300 dark:text-gray-700 mb-3" />
            <p className="font-semibold text-gray-500 dark:text-gray-400">No matching facilities</p>
            <p className="text-xs text-gray-400 mt-1">Try a different filter or search term</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <p className="text-xs text-gray-400 dark:text-gray-600 mb-3 px-1">
              {filtered.length} location{filtered.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(pin => {
                const { icon: Icon, color, bg, border } = meta(pin.category)
                return (
                  <button
                    key={pin.id}
                    onPointerDown={() => setSelected(pin)}
                    className={`flex items-start gap-3 p-4 rounded-2xl border text-left active:scale-[0.97] transition-all hover:shadow-md ${bg} ${border}`}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white dark:bg-gray-900/60 flex items-center justify-center shadow-sm mt-0.5">
                      <Icon className={`text-xl ${color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-800 dark:text-gray-100 text-sm leading-snug line-clamp-2">{pin.translatedName}</p>
                      {pin.translatedDescription && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug line-clamp-2">
                          {pin.translatedDescription}
                        </p>
                      )}
                      <span className="inline-block text-[10px] font-semibold text-gray-400 dark:text-gray-600 bg-white/60 dark:bg-gray-900/40 px-1.5 py-0.5 rounded-md mt-1.5">
                        {pin.translatedFloor}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Info hint */}
        {!loading && pins.length > 0 && (
          <div className="max-w-2xl mx-auto mt-4 px-4 py-3 rounded-2xl bg-white/60 dark:bg-gray-800/40 border border-blue-100 dark:border-blue-900/20 flex items-center gap-3">
            <FaMapLocationDot className="text-blue-500 text-xl flex-shrink-0" />
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{hintLabel}</p>
          </div>
        )}
      </main>

      {selected && (
        <DirectionsModal location={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
