'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import AuraLogo from '@/components/AuraLogo'
import { t } from '@/lib/i18n'
import {
  FaUserDoctor, FaPills, FaClipboardList, FaCircleInfo,
  FaPersonWalking, FaToilet, FaTicket,
  FaMicrophone, FaStop, FaChevronLeft, FaRobot,
} from 'react-icons/fa6'

export default function KioskMenu() {
  const router = useRouter()
  const [listening, setListening] = useState(false)
  const [lang, setLang] = useState('en')

  useEffect(() => {
    setLang(localStorage.getItem('aura-language') ?? 'en')
    // Pre-warm all kiosk routes so first tap is instant
    ;['/kiosk/doctors', '/kiosk/medication', '/kiosk/symptoms', '/kiosk/information',
      '/kiosk/visit', '/kiosk/facilities', '/kiosk/queue', '/kiosk/assistant',
    ].forEach(href => router.prefetch(href))
  }, [])

  const MENU_ITEMS = [
    { id: 'doctors',     label: t(lang, 'seeDoctor'),      subLabel: t(lang, 'seeDoctorSub'),       icon: FaUserDoctor,    href: '/kiosk/doctors',     color: 'from-blue-500 to-blue-700' },
    { id: 'medication',  label: t(lang, 'getMedication'),  subLabel: t(lang, 'getMedicationSub'),   icon: FaPills,         href: '/kiosk/medication',  color: 'from-emerald-500 to-emerald-700' },
    { id: 'symptoms',    label: t(lang, 'symptomCheck'),   subLabel: t(lang, 'symptomCheckSub'),    icon: FaClipboardList, href: '/kiosk/symptoms',    color: 'from-orange-500 to-orange-700' },
    { id: 'information', label: 'Hospital Info & Fees',    subLabel: 'Services, fees & policies',   icon: FaCircleInfo,    href: '/kiosk/information', color: 'from-violet-500 to-violet-700' },
    { id: 'visit',       label: t(lang, 'visitSomeone'),   subLabel: t(lang, 'visitSomeoneSub'),    icon: FaPersonWalking, href: '/kiosk/visit',       color: 'from-pink-500 to-pink-700' },
    { id: 'facilities',  label: t(lang, 'findFacilities'), subLabel: t(lang, 'findFacilitiesSub'),  icon: FaToilet,        href: '/kiosk/facilities',  color: 'from-cyan-500 to-cyan-700' },
    { id: 'queue',       label: t(lang, 'checkQueue'),     subLabel: t(lang, 'checkQueueSub'),      icon: FaTicket,        href: '/kiosk/queue',       color: 'from-indigo-500 to-indigo-700' },
    { id: 'assistant',   label: 'Talk to Assistant',       subLabel: 'Voice or chat 🤖',            icon: FaRobot,         href: '/kiosk/assistant',   color: 'from-rose-500 to-rose-700' },
  ]

  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser.')
      return
    }
    setListening(true)
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SR()
    recognition.continuous     = false
    recognition.interimResults = false

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase()
      setListening(false)
      if (transcript.includes('doctor') || transcript.includes('chiremba'))                                   router.push('/kiosk/doctors')
      else if (transcript.includes('medic') || transcript.includes('pill') || transcript.includes('mushonga')) router.push('/kiosk/medication')
      else if (transcript.includes('symptom') || transcript.includes('sick') || transcript.includes('pain'))   router.push('/kiosk/symptoms')
      else if (transcript.includes('visit') || transcript.includes('admitted'))                               router.push('/kiosk/visit')
      else if (transcript.includes('toilet') || transcript.includes('bathroom') || transcript.includes('map') || transcript.includes('facilit')) router.push('/kiosk/facilities')
      else if (transcript.includes('fee') || transcript.includes('cost') || transcript.includes('price'))      router.push('/kiosk/information?tab=fees')
      else if (transcript.includes('queue') || transcript.includes('ticket') || transcript.includes('wait'))   router.push('/kiosk/queue')
      else if (transcript.includes('assistant') || transcript.includes('help') || transcript.includes('chat')) router.push('/kiosk/assistant')
      else router.push('/kiosk/information')
    }
    recognition.onerror = () => setListening(false)
    recognition.onend   = () => setListening(false)
    recognition.start()
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <header className="hero-gradient px-4 py-3 flex items-center justify-between shadow-lg flex-shrink-0">
        <button
          onClick={() => router.push('/kiosk')}
          className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors"
        >
          <FaChevronLeft size={12} />
          {t(lang, 'changeLanguage')}
        </button>
        <div className="text-center">
          <p className="text-white font-bold text-base leading-tight">Mutare Provincial Hospital</p>
          <p className="text-white/60 text-xs">{t(lang, 'menuTitle')}</p>
        </div>
        <AuraLogo size={48} />
      </header>

      {/* ── Menu grid ── */}
      <main className="flex-1 flex flex-col p-2 pb-1 min-h-0">
        <div className="flex-1 grid grid-cols-2 gap-2">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onPointerDown={() => router.push(item.href)}
                className="group kiosk-card flex items-center gap-3 px-3 py-0 text-left"
                style={{ minHeight: 0 }}
              >
                <div className={`kiosk-card-icon-sm bg-gradient-to-br ${item.color} flex-shrink-0`}>
                  <Icon />
                </div>
                <span className="text-xl font-bold text-gray-800 dark:text-gray-100 leading-tight">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </main>

      {/* ── Bottom bar: amenities + voice ── */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-gray-100 dark:border-[#1a1a1a] flex-shrink-0">
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span>💧 Water</span>
          <span>🧴 Sanitizer</span>
          <span>🧻 Tissues</span>
        </div>
        <button
          onClick={startVoice}
          aria-label={listening ? 'Stop voice input' : 'Start voice input'}
          className={`
            relative w-10 h-10 rounded-full flex items-center justify-center
            shadow-md text-white transition-all duration-300
            ${listening
              ? 'bg-red-500 scale-110'
              : 'bg-gradient-to-br from-blue-600 to-cyan-500 hover:scale-110 active:scale-95'
            }
          `}
        >
          {listening ? <FaStop size={14} /> : <FaMicrophone size={14} />}
        </button>
      </div>

    </div>
  )
}
