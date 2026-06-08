'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { FaChevronLeft, FaCreditCard, FaBed, FaBuilding, FaUserDoctor } from 'react-icons/fa6'
import {
  MdInfo, MdAttachMoney, MdAccessTime, MdPhone,
  MdEmail, MdLocationOn, MdLocalHospital, MdEmergency,
  MdGroups, MdMedicalServices, MdStar, MdApartment, MdBarChart,
} from 'react-icons/md'
import { useBatchTranslation } from '@/components/useBatchTranslation'
import { useKioskLanguage } from '@/components/useKioskLanguage'

interface Fee {
  id: string
  service: string
  category: string
  price: number
  description: string | null
}

interface InfoItem {
  id: string
  key: string
  value: string
  category: string
}

interface DashStats {
  doctors: number
  departments: number
  bedsTotal: number
  wardsCount: number
}

const FEE_CAT: Record<string, { dot: string; text: string; bg: string; border: string }> = {
  Consultation:     { dot: 'bg-blue-500',   text: 'text-blue-700 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-950/40',     border: 'border-blue-200 dark:border-blue-900/40' },
  OPD:              { dot: 'bg-blue-400',   text: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-950/40',     border: 'border-blue-200 dark:border-blue-900/40' },
  Emergency:        { dot: 'bg-red-500',    text: 'text-red-700 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-950/40',       border: 'border-red-200 dark:border-red-900/40' },
  Laboratory:       { dot: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-200 dark:border-purple-900/40' },
  Imaging:          { dot: 'bg-indigo-500', text: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40', border: 'border-indigo-200 dark:border-indigo-900/40' },
  Radiology:        { dot: 'bg-indigo-400', text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40', border: 'border-indigo-200 dark:border-indigo-900/40' },
  Ward:             { dot: 'bg-cyan-500',   text: 'text-cyan-700 dark:text-cyan-400',     bg: 'bg-cyan-50 dark:bg-cyan-950/40',     border: 'border-cyan-200 dark:border-cyan-900/40' },
  Maternity:        { dot: 'bg-pink-500',   text: 'text-pink-700 dark:text-pink-400',     bg: 'bg-pink-50 dark:bg-pink-950/40',     border: 'border-pink-200 dark:border-pink-900/40' },
  Surgery:          { dot: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40', border: 'border-orange-200 dark:border-orange-900/40' },
  Procedures:       { dot: 'bg-amber-500',  text: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/40',   border: 'border-amber-200 dark:border-amber-900/40' },
  Diagnostics:      { dot: 'bg-violet-500', text: 'text-violet-700 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40', border: 'border-violet-200 dark:border-violet-900/40' },
  Dental:           { dot: 'bg-teal-500',   text: 'text-teal-700 dark:text-teal-400',     bg: 'bg-teal-50 dark:bg-teal-950/40',     border: 'border-teal-200 dark:border-teal-900/40' },
  'Intensive Care': { dot: 'bg-rose-600',   text: 'text-rose-700 dark:text-rose-400',     bg: 'bg-rose-50 dark:bg-rose-950/40',     border: 'border-rose-200 dark:border-rose-900/40' },
  Ophthalmology:    { dot: 'bg-sky-500',    text: 'text-sky-700 dark:text-sky-400',       bg: 'bg-sky-50 dark:bg-sky-950/40',       border: 'border-sky-200 dark:border-sky-900/40' },
  Physiotherapy:    { dot: 'bg-green-500',  text: 'text-green-700 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-950/40',   border: 'border-green-200 dark:border-green-900/40' },
  Psychiatry:       { dot: 'bg-violet-600', text: 'text-violet-700 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40', border: 'border-violet-200 dark:border-violet-900/40' },
  Nutrition:        { dot: 'bg-lime-500',   text: 'text-lime-700 dark:text-lime-400',     bg: 'bg-lime-50 dark:bg-lime-950/40',     border: 'border-lime-200 dark:border-lime-900/40' },
  Administrative:   { dot: 'bg-slate-500',  text: 'text-slate-700 dark:text-slate-400',   bg: 'bg-slate-50 dark:bg-slate-950/40',   border: 'border-slate-200 dark:border-slate-900/40' },
}
const DEFAULT_FEE = { dot: 'bg-gray-400', text: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800/50', border: 'border-gray-200 dark:border-gray-700' }
function catStyle(cat: string) { return FEE_CAT[cat] ?? DEFAULT_FEE }

function getInfoIconConfig(key: string) {
  const k = key.toLowerCase()
  if (k.includes('phone') || k.includes('tel') || k.includes('hotline')) return { Icon: MdPhone,          bg: 'bg-blue-500' }
  if (k.includes('email') || k.includes('mail'))                          return { Icon: MdEmail,          bg: 'bg-violet-500' }
  if (k.includes('address') || k.includes('location') || k.includes('situated') || k.includes('plot'))
                                                                           return { Icon: MdLocationOn,     bg: 'bg-rose-500' }
  if (k.includes('emergency'))                                             return { Icon: MdEmergency,      bg: 'bg-red-600' }
  if (k.includes('hour') || k.includes('time') || k.includes('open') || k.includes('schedule'))
                                                                           return { Icon: MdAccessTime,     bg: 'bg-amber-500' }
  if (k.includes('service') || k.includes('department'))                  return { Icon: MdLocalHospital,  bg: 'bg-cyan-500' }
  if (k.includes('staff') || k.includes('worker') || k.includes('employee'))
                                                                           return { Icon: MdGroups,         bg: 'bg-indigo-500' }
  if (k.includes('specialist') || k.includes('doctor') || k.includes('consultant'))
                                                                           return { Icon: MdMedicalServices, bg: 'bg-teal-500' }
  if (k.includes('accredit') || k.includes('certif') || k.includes('award') || k.includes('license'))
                                                                           return { Icon: MdStar,           bg: 'bg-yellow-500' }
  return { Icon: MdInfo, bg: 'bg-gray-400' }
}

function isPhoneNumber(val: string) { return /^\+?[\d\s\-().]{7,20}$/.test(val.trim()) }
function isEmailAddr(val: string)   { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()) }

function InformationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language } = useKioskLanguage()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general')
  const [fees, setFees] = useState<Fee[]>([])
  const [info, setInfo] = useState<InfoItem[]>([])
  const [stats, setStats] = useState<DashStats | null>(null)
  const [loading, setLoading] = useState(true)

  const translatedLabels = useBatchTranslation([
    'Hospital Information',
    'Services, fees, and policies',
    'Hospital Info',
    'Fees and Costs',
    'Visiting Hours',
    'Contacts',
    'Facilities',
    'Capacity & Stats',
    'Loading...',
    'Payment Methods: Cash, EcoCash, and Medical Aid accepted.',
    'No information available for this category yet.',
  ], language)

  const [pageTitle, pageSubtitle, tabGeneralLabel, tabFeesLabel, tabVisitingLabel, tabContactLabel, tabFacilitiesLabel, tabCapacityLabel, loadingLabel, paymentMethodsLabel, noInfoLabel] = translatedLabels

  useEffect(() => {
    Promise.all([
      fetch('/api/fees').then(r => r.json()),
      fetch('/api/information').then(r => r.json()),
      fetch('/api/dashboard').then(r => r.json()).catch(() => null),
    ]).then(([feesData, infoData, dashData]) => {
      setFees(Array.isArray(feesData) ? feesData : [])
      setInfo(Array.isArray(infoData) ? infoData : [])
      if (dashData?.stats) setStats(dashData.stats)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const tabs = [
    { id: 'general',    label: tabGeneralLabel,    icon: MdInfo },
    { id: 'fees',       label: tabFeesLabel,       icon: MdAttachMoney },
    { id: 'visiting',   label: tabVisitingLabel,   icon: MdAccessTime },
    { id: 'contact',    label: tabContactLabel,    icon: MdPhone },
    { id: 'facilities', label: tabFacilitiesLabel, icon: MdApartment },
    { id: 'capacity',   label: tabCapacityLabel,   icon: MdBarChart },
  ]

  const filteredInfo = activeTab === 'fees' ? [] : info.filter(i => i.category === activeTab)
  const feeTranslationInputs = useMemo(
    () => fees.flatMap(fee => [fee.category, fee.service, fee.description || '']),
    [fees],
  )
  const feeTranslations = useBatchTranslation(feeTranslationInputs, language)
  const infoTranslationInputs = useMemo(
    () => filteredInfo.flatMap(item => [item.key, item.value]),
    [filteredInfo],
  )
  const infoTranslations = useBatchTranslation(infoTranslationInputs, language)

  const translatedGroupedFees = useMemo(() => {
    const translated: Record<string, Array<Fee & { translatedCategory: string; translatedService: string; translatedDescription: string | null }>> = {}
    fees.forEach((fee, index) => {
      const translatedCategory = feeTranslations[index * 3] || fee.category
      const translatedService = feeTranslations[index * 3 + 1] || fee.service
      const translatedDescription = fee.description
        ? feeTranslations[index * 3 + 2] || fee.description
        : null
      if (!translated[translatedCategory]) translated[translatedCategory] = []
      translated[translatedCategory].push({
        ...fee,
        translatedCategory,
        translatedService,
        translatedDescription,
      })
    })
    return translated
  }, [feeTranslations, fees])

  const translatedInfoItems = useMemo(
    () => filteredInfo.map((item, index) => ({
      ...item,
      translatedKey: infoTranslations[index * 2] || item.key,
      translatedValue: infoTranslations[index * 2 + 1] || item.value,
    })),
    [filteredInfo, infoTranslations],
  )

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
        <MdInfo className="text-white/60 text-2xl" />
      </header>

      {/* Live Stats Strip */}
      {stats && (
        <div className="px-4 pt-3">
          <div className="grid grid-cols-4 gap-2 max-w-2xl mx-auto">
            {([
              { icon: FaBuilding,     label: 'Depts',   value: stats.departments, color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { icon: FaUserDoctor,   label: 'Doctors',  value: stats.doctors,     color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { icon: FaBed,          label: 'Beds',     value: stats.bedsTotal,   color: 'text-cyan-600 dark:text-cyan-400',    bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
              { icon: MdLocalHospital, label: 'Wards',   value: stats.wardsCount,  color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20' },
            ] as const).map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className={`flex flex-col items-center gap-0.5 py-2.5 rounded-xl ${bg}`}>
                <Icon className={`text-base ${color}`} />
                <span className={`font-black text-lg leading-tight ${color}`}>{value}</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto max-w-2xl mx-auto w-full">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onPointerDown={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all
                ${activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <main className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
              <p className="text-sm text-gray-400 font-medium">{loadingLabel}</p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">

            {/* ── FEES TAB ── */}
            {activeTab === 'fees' && (
              <div className="space-y-3">
                {Object.entries(translatedGroupedFees).map(([category, items]) => {
                  const { dot, text, bg, border } = catStyle(category)
                  const maxPrice = Math.max(...items.map(f => f.price))
                  return (
                    <div key={category} className={`rounded-2xl shadow-sm border overflow-hidden ${bg} ${border}`}>
                      <div className="px-4 py-3 flex items-center gap-2.5 border-b border-black/5 dark:border-white/5">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${dot}`} />
                        <h3 className={`font-bold text-sm uppercase tracking-wide flex-1 ${text}`}>{category}</h3>
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-white/60 dark:bg-gray-900/40 px-2 py-0.5 rounded-full">
                          {items.length} service{items.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="divide-y divide-black/5 dark:divide-white/5">
                        {items.map(fee => (
                          <div key={fee.id} className="flex items-start gap-3 px-4 py-3 bg-white/70 dark:bg-gray-900/50">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm leading-snug">{fee.translatedService}</p>
                              {fee.translatedDescription && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{fee.translatedDescription}</p>
                              )}
                            </div>
                            <span className={`font-black text-base flex-shrink-0 pt-0.5 ${fee.price === maxPrice && items.length > 1 ? text : 'text-gray-800 dark:text-gray-100'}`}>
                              ${fee.price.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
                <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border border-blue-200 dark:border-blue-900/40">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
                    <FaCreditCard className="text-white text-sm" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-blue-800 dark:text-blue-300">Payment Methods Accepted</p>
                    <p className="text-xs text-blue-700/70 dark:text-blue-400/70">{paymentMethodsLabel}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── GENERAL / VISITING / CONTACT TABS ── */}
            {activeTab !== 'fees' && (
              <div className="space-y-3">
                {translatedInfoItems.length > 0 ? (
                  translatedInfoItems.map(item => {
                    const { Icon, bg } = getInfoIconConfig(item.translatedKey)
                    const val = item.translatedValue
                    const isPhone = isPhoneNumber(val)
                    const isEmail = isEmailAddr(val)
                    return (
                      <div key={item.id} className="bg-white dark:bg-gray-800/90 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="flex items-start gap-3.5 p-4">
                          <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="text-white text-lg" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
                              {item.translatedKey}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-200 font-medium whitespace-pre-line leading-relaxed">
                              {val}
                            </p>
                          </div>
                          {(isPhone || isEmail) && (
                            <a
                              href={isPhone ? `tel:${val.replace(/\s/g, '')}` : `mailto:${val}`}
                              className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-bold"
                            >
                              {isPhone ? 'Call' : 'Email'}
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                      <MdInfo className="text-3xl text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="font-semibold text-gray-400 dark:text-gray-600">{noInfoLabel}</p>
                    <p className="text-xs text-gray-300 dark:text-gray-700 mt-1">Check back later or contact reception.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default function KioskInformation() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" /></div>}>
      <InformationContent />
    </Suspense>
  )
}
