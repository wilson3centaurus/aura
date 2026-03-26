'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LANGUAGES } from '@/types'
import AuraLogo from '@/components/AuraLogo'
import { MdLanguage } from 'react-icons/md'
import VoiceChat from '@/components/VoiceChat'

/* ─── Floating hospital icons ────────────────────────────────────── */
const FLOATING_ICONS = [
  { emoji: '🏥', x: 8,  y: 12, size: 28, dur: 14, delay: 0 },
  { emoji: '💊', x: 75, y: 8,  size: 22, dur: 18, delay: 2 },
  { emoji: '🩺', x: 88, y: 35, size: 26, dur: 16, delay: 1 },
  { emoji: '🩻', x: 5,  y: 55, size: 24, dur: 20, delay: 3 },
  { emoji: '❤️', x: 90, y: 65, size: 20, dur: 13, delay: 0.5 },
  { emoji: '🧬', x: 18, y: 80, size: 22, dur: 17, delay: 2.5 },
  { emoji: '💉', x: 60, y: 88, size: 20, dur: 19, delay: 1.5 },
  { emoji: '🩹', x: 45, y: 5,  size: 18, dur: 15, delay: 4 },
  { emoji: '🔬', x: 35, y: 92, size: 20, dur: 21, delay: 0.8 },
  { emoji: '🏥', x: 65, y: 72, size: 16, dur: 12, delay: 3.5 },
  { emoji: '💪', x: 25, y: 40, size: 18, dur: 22, delay: 1.2 },
  { emoji: '🧪', x: 80, y: 20, size: 16, dur: 16, delay: 5 },
]

export default function KioskWelcome() {
  const router = useRouter()
  const [voiceOpen, setVoiceOpen] = useState(false)

  const selectLanguage = (langCode: string) => {
    localStorage.setItem('aura-language', langCode)
    router.push('/kiosk/menu')
  }

  return (
    <div className="relative flex flex-col items-center justify-between min-h-screen overflow-hidden">

      {/* ── Floating animated hospital icons ── */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        {FLOATING_ICONS.map((item, i) => (
          <span
            key={i}
            className="absolute select-none"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              fontSize: item.size,
              opacity: 0.13,
              animation: `floatIcon ${item.dur}s ease-in-out ${item.delay}s infinite alternate`,
              filter: 'blur(0.3px)',
            }}
          >
            {item.emoji}
          </span>
        ))}
        {/* Soft radial glow orbs */}
        <div className="absolute top-1/4 left-1/3 w-64 h-64 rounded-full bg-blue-400/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-cyan-400/10 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* ── Ministry header ── */}
      <header className="relative z-10 w-full hero-gradient px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <img
            src="/coat-of-arms.png"
            alt="Zimbabwe Coat of Arms"
            className="h-14 w-14 object-contain drop-shadow-lg"
          />
          <div>
            <p className="text-white/75 text-[10px] font-semibold uppercase tracking-widest leading-none">
              Ministry of Health and Child Care
            </p>
            <p className="text-white font-bold text-sm leading-snug tracking-wide">
              Mutare Provincial Hospital
            </p>
          </div>
        </div>
        <AuraLogo size={48} showText />
      </header>

      {/* ── Main welcome section ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-6 w-full max-w-2xl mx-auto">

        {/* Welcome text */}
        <div className="text-center mb-6 animate-fade-in">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
            Welcome to<br />
            <span className="bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">
              Mutare Provincial Hospital
            </span>
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400 mt-2 font-medium tracking-wide">
            Mauya · Siyakwamukela · Welcome
          </p>
        </div>

        {/* Language prompt */}
        <div className="w-full mb-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-3 px-1">
            <MdLanguage className="text-blue-600 dark:text-blue-400 text-lg" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Select your language / Sarudza mutauro wako
            </span>
          </div>

          {/* Language grid */}
          <div className="grid grid-cols-4 gap-2">
            {LANGUAGES.map((lang, idx) => (
              <button
                key={lang.code}
                onClick={() => selectLanguage(lang.code)}
                style={{ animationDelay: `${0.05 * idx}s` }}
                className="
                  animate-fade-in flex flex-col items-center justify-center py-3 px-2
                  rounded-xl bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm
                  border border-gray-200 dark:border-gray-700
                  shadow-sm hover:shadow-lg
                  hover:border-blue-400 dark:hover:border-blue-500
                  hover:bg-blue-50 dark:hover:bg-blue-900/20
                  hover:scale-105 active:scale-95
                  transition-all duration-150
                "
              >
                <span className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight">
                  {lang.nativeName}
                </span>
                {lang.nativeName !== lang.name && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{lang.name}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full mb-5">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* AI Voice button */}
        <div className="flex flex-col items-center gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => setVoiceOpen(true)}
            className="relative w-24 h-24 rounded-full flex items-center justify-center
              bg-gradient-to-br from-blue-600 to-cyan-500
              text-white shadow-2xl hover:scale-110 active:scale-95
              hover:shadow-blue-400/40 transition-all duration-300 select-none group"
            aria-label="Start AI voice assistant"
          >
            {/* Pulsing rings */}
            <span className="absolute inset-0 rounded-full border-2 border-blue-400/40 animate-ping group-hover:border-blue-300/60" />
            <span className="absolute inset-[-8px] rounded-full border border-blue-300/20 animate-pulse" />
            {/* Mic SVG */}
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Tap to speak with AURA
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
            AI-powered assistant · speaks your language
          </p>
        </div>
      </main>

      {/* ── Amenities bar ── */}
      <footer className="relative z-10 w-full border-t border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm px-6 py-3">
        <div className="flex items-center justify-center gap-6 text-xs text-gray-500 dark:text-gray-400 font-medium">
          <span className="flex items-center gap-1.5">
            <i className="fa-solid fa-droplet text-blue-400" />
            Drinking Water Below
          </span>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <span className="flex items-center gap-1.5">
            <i className="fa-solid fa-hand-sparkles text-cyan-400" />
            Hand Sanitizer Below
          </span>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <span className="flex items-center gap-1.5">
            <i className="fa-solid fa-toilet-paper text-gray-400" />
            Tissues Below
          </span>
        </div>
      </footer>

      {/* ── AI Voice Chat overlay ── */}
      {voiceOpen && (
        <VoiceChat onClose={() => setVoiceOpen(false)} onNavigate={(href: string) => { setVoiceOpen(false); router.push(href) }} />
      )}

    </div>
  )
}

