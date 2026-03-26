'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LANGUAGES } from '@/types'
import VoiceChat from '@/components/VoiceChat'
import { useTheme } from '@/components/ThemeProvider'

export default function KioskWelcome() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [voiceOpen, setVoiceOpen] = useState(false)

  const selectLanguage = (langCode: string) => {
    localStorage.setItem('aura-language', langCode)
    router.push('/kiosk/menu')
  }

  return (
    <div className="flex flex-col h-full">

      {/* Hero header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#003d73] via-[#005a9e] to-[#0077cc] px-8 py-8 flex-shrink-0">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full border border-white/10" />
        <div className="absolute top-4 -right-8 w-40 h-40 rounded-full border border-white/10" />
        <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full border border-white/10" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/coat-of-arms.png" alt="Zimbabwe Coat of Arms" className="h-14 w-14 object-contain drop-shadow-lg" />
            <div className="w-px h-10 bg-white/25" />
            <img src="/mohcc-logo.png" alt="MOHCC" className="h-12 w-auto object-contain drop-shadow-lg" />
          </div>
          <div className="text-right flex items-start gap-3">
            <div>
              <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest">Ministry of Health &amp; Child Care</p>
              <p className="text-white font-black text-lg leading-tight">Mutare Provincial Hospital</p>
              <p className="text-white/50 text-[10px] mt-0.5">AURA Self Service Kiosk</p>
            </div>
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors mt-1"
            >
              {theme === 'light' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              )}
            </button>
          </div>
        </div>

        <div className="relative mt-5">
          <h1 className="text-2xl font-black text-white leading-tight">
            Welcome &middot; <span className="text-white/70">Mauya</span> &middot;{' '}
            <span className="text-white/50">Siyakwamukela</span>
          </h1>
          <p className="text-white/60 text-sm mt-1 font-medium">
            Select your preferred language to continue
          </p>
        </div>
      </header>

      {/* Main content — side-by-side: languages left, voice right */}
      <main className="flex-1 flex gap-0 overflow-hidden">

        {/* Language grid — fills available width */}
        <div className="flex-1 flex flex-col px-8 py-5">
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
            Select Language / Sarudza Mutauro
          </p>
          <div className="grid grid-cols-3 gap-2 flex-1 content-start">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => selectLanguage(lang.code)}
                className="group flex items-center justify-between px-4 py-3 rounded-xl bg-white dark:bg-[#111] border-2 border-gray-200 dark:border-[#222] hover:border-[#003d73] dark:hover:border-blue-600 hover:shadow-md hover:shadow-blue-900/10 active:scale-[0.98] transition-all duration-150"
              >
                <div className="text-left min-w-0">
                  <p className="text-sm font-black text-gray-900 dark:text-white truncate">{lang.nativeName}</p>
                  {lang.nativeName !== lang.name && (
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium truncate">{lang.name}</p>
                  )}
                </div>
                <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-[#003d73] dark:group-hover:text-blue-500 transition-colors flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Vertical divider */}
        <div className="flex flex-col items-center py-6 flex-shrink-0">
          <div className="flex-1 w-px bg-gray-100 dark:bg-[#222]" />
          <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest my-3" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>or</span>
          <div className="flex-1 w-px bg-gray-100 dark:bg-[#222]" />
        </div>

        {/* Voice panel */}
        <div className="w-52 flex flex-col items-center justify-center gap-4 px-6 flex-shrink-0">
          <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">Use Voice</p>
          <button
            onClick={() => setVoiceOpen(true)}
            className="relative w-24 h-24 rounded-full flex items-center justify-center bg-gradient-to-br from-[#003d73] to-[#0077cc] text-white shadow-xl shadow-blue-900/30 hover:shadow-2xl hover:shadow-blue-900/40 hover:scale-105 active:scale-95 transition-all duration-200"
            aria-label="Start AI voice assistant"
          >
            <span className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-ping" />
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Speak with AURA</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">AI assistant</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">English &middot; Shona &middot; Ndebele</p>
          </div>
        </div>
      </main>

      {/* Footer bar */}
      <footer className="border-t border-gray-100 dark:border-[#1a1a1a] px-8 py-2.5 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-600 flex-shrink-0">
        <div className="flex items-center gap-5">
          <span>&#x1F4A7; Water Available Below</span>
          <span>&#x1F9F4; Hand Sanitizer Below</span>
          <span>&#x1F9FB; Tissues Below</span>
        </div>
        <span className="font-mono">AURA v2.0</span>
      </footer>

      {voiceOpen && (
        <VoiceChat onClose={() => setVoiceOpen(false)} onNavigate={(href: string) => { setVoiceOpen(false); router.push(href) }} />
      )}
    </div>
  )
}
