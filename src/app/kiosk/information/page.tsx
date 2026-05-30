'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { FaChevronLeft, FaCreditCard } from 'react-icons/fa6'
import {
  MdInfo, MdAttachMoney, MdAccessTime, MdPhone, MdCircle,
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

function InformationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language } = useKioskLanguage()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general')
  const [fees, setFees] = useState<Fee[]>([])
  const [info, setInfo] = useState<InfoItem[]>([])
  const [loading, setLoading] = useState(true)

  const translatedLabels = useBatchTranslation([
    'Hospital Information',
    'Services, fees, and policies',
    'Hospital Info',
    'Fees and Costs',
    'Visiting Hours',
    'Contacts',
    'Loading...',
    'Payment Methods: Cash, EcoCash, and Medical Aid accepted.',
    'No information available for this category yet.',
  ], language)

  const [pageTitle, pageSubtitle, tabGeneralLabel, tabFeesLabel, tabVisitingLabel, tabContactLabel, loadingLabel, paymentMethodsLabel, noInfoLabel] = translatedLabels

  useEffect(() => {
    Promise.all([
      fetch('/api/fees').then(r => r.json()),
      fetch('/api/information').then(r => r.json()),
    ]).then(([feesData, infoData]) => {
      setFees(Array.isArray(feesData) ? feesData : [])
      setInfo(Array.isArray(infoData) ? infoData : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const tabs = [
    { id: 'general',   label: tabGeneralLabel,  icon: MdInfo },
    { id: 'fees',      label: tabFeesLabel,     icon: MdAttachMoney },
    { id: 'visiting',  label: tabVisitingLabel, icon: MdAccessTime },
    { id: 'contact',   label: tabContactLabel,  icon: MdPhone },
  ]

  const groupedFees = fees.reduce((acc, fee) => {
    if (!acc[fee.category]) acc[fee.category] = []
    acc[fee.category].push(fee)
    return acc
  }, {} as Record<string, Fee[]>)

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
          onClick={() => router.push('/kiosk/menu')}
          className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
        >
          <FaChevronLeft size={14} />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-base leading-tight">{pageTitle}</h1>
          <p className="text-white/65 text-xs">{pageSubtitle} - Mutare Provincial Hospital</p>
        </div>
        <MdInfo className="text-white/60 text-2xl" />
      </header>

      {/* Tabs */}
      <div className="flex gap-2 px-4 pt-4 pb-2 overflow-x-auto max-w-2xl mx-auto w-full">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all
                ${activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}>
              <Icon size={16} /> {tab.label}
            </button>
          )
        })}
      </div>

      <main className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <MdInfo className="text-4xl animate-pulse-soft" />
              <p className="text-sm font-medium animate-pulse-soft">{loadingLabel}</p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {activeTab === 'fees' ? (
              <div className="space-y-4">
                {Object.entries(translatedGroupedFees).map(([category, items]) => (
                  <div key={category} className="bg-white dark:bg-gray-800/90 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3">{category}</h3>
                    <div className="space-y-2">
                      {items.map(fee => (
                        <div key={fee.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">{fee.translatedService}</span>
                            {fee.translatedDescription && <p className="text-xs text-gray-500 dark:text-gray-400">{fee.translatedDescription}</p>}
                          </div>
                          <span className="font-bold text-blue-700 dark:text-blue-400">${fee.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 text-sm text-blue-700 dark:text-blue-400">
                  <FaCreditCard size={14} />
                  {paymentMethodsLabel}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {translatedInfoItems.length > 0 ? translatedInfoItems.map(item => (
                  <div key={item.id} className="bg-white dark:bg-gray-800/90 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1 text-sm">{item.translatedKey}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">{item.translatedValue}</p>
                  </div>
                )) : (
                  <div className="text-center py-10">
                    <MdInfo className="text-4xl text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">{noInfoLabel}</p>
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
    <Suspense fallback={<div className="flex items-center justify-center h-full"><p className="text-gray-500 animate-pulse">Loading...</p></div>}>
      <InformationContent />
    </Suspense>
  )
}
