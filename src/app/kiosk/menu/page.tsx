'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import AuraLogo from '@/components/AuraLogo'
import { t } from '@/lib/i18n'
import {
  FaUserDoctor, FaPills, FaClipboardList, FaCircleInfo,
  FaPersonWalking, FaToilet, FaFileInvoiceDollar, FaTicket,
  FaMicrophone, FaStop, FaChevronLeft
} from 'react-icons/fa6'

export default function KioskMenu() {
  const router = useRouter()
  const [listening, setListening] = useState(false)
  const [lang, setLang] = useState('en')

  useEffect(() => {
    setLang(localStorage.getItem('aura-language') ?? 'en')
  }, [])

  const MENU_ITEMS = [
    { id: 'doctors',     label: t(lang, 'seeDoctor'),      subLabel: t(lang, 'seeDoctorSub'),       icon: FaUserDoctor,        href: '/kiosk/doctors',              color: 'from-blue-500 to-blue-700' },
    { id: 'medication',  label: t(lang, 'getMedication'),  subLabel: t(lang, 'getMedicationSub'),   icon: FaPills,             href: '/kiosk/medication',           color: 'from-emerald-500 to-emerald-700' },
    { id: 'symptoms',    label: t(lang, 'symptomCheck'),   subLabel: t(lang, 'symptomCheckSub'),    icon: FaClipboardList,     href: '/kiosk/symptoms',             color: 'from-orange-500 to-orange-700' },
    { id: 'information', label: t(lang, 'hospitalInfo'),   subLabel: t(lang, 'hospitalInfoSub'),    icon: FaCircleInfo,        href: '/kiosk/information',          color: 'from-violet-500 to-violet-700' },
    { id: 'visit',       label: t(lang, 'visitSomeone'),   subLabel: t(lang, 'visitSomeoneSub'),    icon: FaPersonWalking,     href: '/kiosk/visit',                color: 'from-pink-500 to-pink-700' },
    { id: 'facilities',  label: t(lang, 'findFacilities'), subLabel: t(lang, 'findFacilitiesSub'),  icon: FaToilet,            href: '/kiosk/facilities',           color: 'from-cyan-500 to-cyan-700' },
    { id: 'fees',        label: t(lang, 'medicalFees'),    subLabel: t(lang, 'medicalFeesSub'),     icon: FaFileInvoiceDollar, href: '/kiosk/information?tab=fees', color: 'from-amber-500 to-amber-700' },
    { id: 'queue',       label: t(lang, 'checkQueue'),     subLabel: t(lang, 'checkQueueSub'),      icon: FaTicket,            href: '/kiosk/queue',                color: 'from-indigo-500 to-indigo-700' },
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
      else router.push('/kiosk/information')
    }
    recognition.onerror = () => setListening(false)
    recognition.onend   = () => setListening(false)
    recognition.start()
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <header className="hero-gradient px-5 py-3.5 flex items-center justify-between shadow-lg">
        <button
          onClick={() => router.push('/kiosk')}
          className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors"
        >
          <FaChevronLeft size={12} />
          {t(lang, 'changeLanguage')}
        </button>
        <div className="text-center">
          <p className="text-white font-bold text-sm leading-tight">Mutare Provincial Hospital</p>
          <p className="text-white/60 text-[10px]">{t(lang, 'menuTitle')}</p>
        </div>
        <AuraLogo size={36} />
      </header>

      {/* ── Menu grid ── */}
      <main className="flex-1 flex flex-col p-3 pb-1">
        <div className="flex-1 grid grid-cols-2 gap-2.5">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                className="group kiosk-card flex flex-col p-4 text-left h-full"
              >
                <div className={`kiosk-card-icon bg-gradient-to-br ${item.color} mb-3`}>
                  <Icon />
                </div>
                <span className="text-base font-bold text-gray-800 dark:text-gray-100 leading-snug">
                  {item.label}
                </span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {item.subLabel}
                </span>
              </button>
            )
          })}
        </div>
      </main>

      {/* ── Amenities notice ── */}
      <div className="mx-3 mb-2 px-4 py-2 rounded-2xl bg-white/70 dark:bg-gray-800/70 border border-blue-100 dark:border-blue-900/30 backdrop-blur-sm text-center">
        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1.5">{t(lang, 'suppliesBelow')}</p>
        <div className="flex items-center justify-center gap-5 text-[11px] text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5"><i className="fa-solid fa-droplet text-blue-400" /> Water</span>
          <span className="flex items-center gap-1.5"><i className="fa-solid fa-hand-sparkles text-cyan-400" /> Sanitizer</span>
          <span className="flex items-center gap-1.5"><i className="fa-solid fa-toilet-paper text-gray-400" /> Tissues</span>
        </div>
      </div>

      {/* ── Voice button ── */}
      <div className="flex flex-col items-center pb-4 pt-1">
        <button
          onClick={startVoice}
          aria-label={listening ? 'Stop voice input' : 'Start voice input'}
          className={`
            relative w-14 h-14 rounded-full flex items-center justify-center
            shadow-lg text-white transition-all duration-300
            ${listening
              ? 'voice-active bg-red-500 scale-110'
              : 'bg-gradient-to-br from-blue-600 to-cyan-500 hover:scale-110 active:scale-95'
            }
          `}
        >
          {listening ? <FaStop size={18} /> : <FaMicrophone size={18} />}
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
          {listening ? t(lang, 'listening') : t(lang, 'askAnything')}
        </p>
      </div>

    </div>
  )
}
