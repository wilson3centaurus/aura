'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { FaChevronLeft, FaCreditCard } from 'react-icons/fa6'
import {
  MdInfo, MdAttachMoney, MdAccessTime, MdPhone, MdCircle,
} from 'react-icons/md'

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
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general')
  const [fees, setFees] = useState<Fee[]>([])
  const [info, setInfo] = useState<InfoItem[]>([])
  const [loading, setLoading] = useState(true)

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
    { id: 'general',   label: 'Hospital Info',   icon: MdInfo },
    { id: 'fees',      label: 'Fees & Costs',    icon: MdAttachMoney },
    { id: 'visiting',  label: 'Visiting Hours',  icon: MdAccessTime },
    { id: 'contact',   label: 'Contacts',        icon: MdPhone },
  ]

  const groupedFees = fees.reduce((acc, fee) => {
    if (!acc[fee.category]) acc[fee.category] = []
    acc[fee.category].push(fee)
    return acc
  }, {} as Record<string, Fee[]>)

  const filteredInfo = activeTab === 'fees' ? [] : info.filter(i => i.category === activeTab)

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
          <h1 className="text-white font-bold text-base leading-tight">Hospital Information</h1>
          <p className="text-white/65 text-xs">Services, fees & policies â€” Mutare Provincial Hospital</p>
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
              <p className="text-sm font-medium animate-pulse-soft">Loading...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {activeTab === 'fees' ? (
              <div className="space-y-4">
                {Object.entries(groupedFees).map(([category, items]) => (
                  <div key={category} className="bg-white dark:bg-gray-800/90 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3">{category}</h3>
                    <div className="space-y-2">
                      {items.map(fee => (
                        <div key={fee.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">{fee.service}</span>
                            {fee.description && <p className="text-xs text-gray-500 dark:text-gray-400">{fee.description}</p>}
                          </div>
                          <span className="font-bold text-blue-700 dark:text-blue-400">${fee.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 text-sm text-blue-700 dark:text-blue-400">
                  <FaCreditCard size={14} />
                  Payment Methods: Cash, EcoCash, Medical Aid accepted
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInfo.length > 0 ? filteredInfo.map(item => (
                  <div key={item.id} className="bg-white dark:bg-gray-800/90 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1 text-sm">{item.key}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">{item.value}</p>
                  </div>
                )) : (
                  <div className="text-center py-10">
                    <MdInfo className="text-4xl text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No information available for this category yet.</p>
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
