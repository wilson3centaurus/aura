'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LANGUAGES } from '@/types'
import VoiceChat from '@/components/VoiceChat'

export default function KioskWelcome() {
  const router = useRouter()
  const [voiceOpen, setVoiceOpen] = useState(false)

  const selectLanguage = (langCode: string) => {
    localStorage.setItem('aura-language', langCode)
    router.push('/kiosk/menu')
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0a0a0a]">

      {/* â”€â”€ Hero header â”€â”€ */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#003d73] via-[#005a9e] to-[#0077cc] px-8 py-10">
        {/* Subtle rings */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full border border-white/10" />
        <div className="absolute top-4 -right-8 w-40 h-40 rounded-full border border-white/10" />
        <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full border border-white/10" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/coat-of-arms.png" alt="Zimbabwe Coat of Arms" className="h-16 w-16 object-contain drop-shadow-lg" />
            <div className="w-px h-12 bg-white/25" />
            <img src="/mohcc-logo.png" alt="MOHCC" className="h-14 w-auto object-contain drop-shadow-lg" />
          </div>
          <div className="text-right">
            <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest">Ministry of Health &amp; Child Care</p>
            <p className="text-white font-black text-xl leading-tight">Mutare Provincial<br />Hospital</p>
            <p className="text-white/50 text-[10px] mt-0.5">AURA Self Service Kiosk</p>
          </div>
        </div>

        <div className="relative mt-8">
          <h1 className="text-3xl font-black text-white leading-tight">
            Welcome Â· <span className="text-white/70">Mauya</span> Â·{' '}
            <span className="text-white/50">Siyakwamukela</span>
          </h1>
          <p className="text-white/60 text-sm mt-1.5 font-medium">
            Please select your preferred language to continue / Sarudza mutauro wako kuenderera mberi
          </p>
        </div>
      </header>

      {/* â”€â”€ Main content â”€â”€ */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-8 gap-8">

        {/* Language selection */}
        <div className="w-full max-w-xl">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 text-center">
            Select Language / Sarudza Mutauro
          </p>
          <div className="grid grid-cols-2 gap-3">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => selectLanguage(lang.code)}
                className="
                  group flex items-center justify-between px-5 py-4 rounded-2xl
                  bg-white dark:bg-[#111] border-2 border-gray-200 dark:border-[#222]
                  hover:border-[#003d73] dark:hover:border-blue-600
                  hover:shadow-lg hover:shadow-blue-900/10
                  active:scale-98 transition-all duration-150
                "
              >
                <div className="text-left">
                  <p className="text-base font-black text-gray-900 dark:text-white">{lang.nativeName}</p>
                  {lang.nativeName !== lang.name && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{lang.name}</p>
                  )}
                </div>
                <svg className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-[#003d73] dark:group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full max-w-xl">
          <div className="flex-1 h-px bg-gray-100 dark:bg-[#222]" />
          <span className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">or use voice</span>
          <div className="flex-1 h-px bg-gray-100 dark:bg-[#222]" />
        </div>

        {/* Voice assistant */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => setVoiceOpen(true)}
            className="
              relative w-20 h-20 rounded-full flex items-center justify-center
              bg-gradient-to-br from-[#003d73] to-[#0077cc]
              text-white shadow-xl shadow-blue-900/30
              hover:shadow-2xl hover:shadow-blue-900/40
              hover:scale-105 active:scale-95
              transition-all duration-200
            "
            aria-label="Start AI voice assistant"
          >
            <span className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-ping" />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Speak with AURA</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">AI assistant Â· English, Shona, Ndebele</p>
          </div>
        </div>
      </main>

      {/* â”€â”€ Footer bar â”€â”€ */}
      <footer className="border-t border-gray-100 dark:border-[#1a1a1a] px-8 py-3 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-600">
        <div className="flex items-center gap-5">
          <span>ðŸ’§ Water Available Below</span>
          <span>ðŸ§´ Hand Sanitizer Below</span>
          <span>ðŸ§» Tissues Below</span>
        </div>
        <span className="font-mono">AURA v2.0</span>
      </footer>

      {voiceOpen && (
        <VoiceChat onClose={() => setVoiceOpen(false)} onNavigate={(href: string) => { setVoiceOpen(false); router.push(href) }} />
      )}
    </div>
  )
}
