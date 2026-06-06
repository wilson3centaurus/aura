'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LANGUAGES } from '@/types'
import VoiceChat from '@/components/VoiceChat'
import { useTheme } from '@/components/ThemeProvider'
import { FaGlobe, FaRoute, FaStethoscope, FaTableCellsLarge } from 'react-icons/fa6'
import { useKioskLanguage } from '@/components/useKioskLanguage'
import { useBatchTranslation } from '@/components/useBatchTranslation'
import { RESEARCH_OBJECTIVES, type ResearchObjectiveId } from '@/lib/research-objectives'

const OBJECTIVE_ICONS = {
  'objective-1': FaTableCellsLarge,
  'objective-2': FaGlobe,
  'objective-3': FaStethoscope,
  'objective-4': FaRoute,
} as const

export default function KioskWelcome() {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage } = useKioskLanguage()
  const [voiceOpen, setVoiceOpen] = useState(false)

  const translatedTexts = useBatchTranslation([
    'Touch your language below to begin.',
    'Use Voice',
    'Speak with AURA',
    'English, Shona, and Ndebele supported live.',
    ...RESEARCH_OBJECTIVES.map(o => o.primaryFeature),
    'Ambulant kiosk amenities',
    'Water',
    'Sanitizer',
    'Tissues',
  ], language)

  const [touchInstruction, voiceLabel, voiceTitle, voiceSubtitle, obj1Label, obj2Label, obj3Label, obj4Label, amenitiesLabel, waterLabel, sanitizerLabel, tissuesLabel] = translatedTexts

  const objectiveTooltips: Record<ResearchObjectiveId, string> = {
    'objective-1': obj1Label,
    'objective-2': obj2Label,
    'objective-3': obj3Label,
    'objective-4': obj4Label,
  }

  const selectLanguage = (langCode: string) => {
    setLanguage(langCode)
    if (langCode === 'sl') {
      router.push('/kiosk/assistant?mode=sign')
      return
    }
    router.push('/kiosk/menu')
  }

  return (
    <div className="flex flex-col h-full">

      {/* Hero header — 15.5" touchscreen */}
      <header className="relative overflow-hidden bg-gradient-to-r from-[#001d3d] via-[#003d73] to-[#001d3d] px-6 py-5 flex-shrink-0">
        {/* Subtle diagonal stripe texture */}
        <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'repeating-linear-gradient(-45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '18px 18px' }} />

        {/* Main row: logos | hospital name | theme toggle */}
        <div className="relative flex items-center gap-5">
          {/* Logos */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <img src="/coat-of-arms.png" alt="Zimbabwe Coat of Arms" className="h-20 w-20 object-contain drop-shadow-lg" />
            <div className="w-px h-14 bg-white/25" />
            <img src="/mohcc-logo.png" alt="MOHCC" className="h-16 w-auto object-contain drop-shadow" />
          </div>

          <div className="w-px h-16 bg-white/20 mx-1 flex-shrink-0" />

          {/* Hospital name — dominant */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-5xl leading-none tracking-tight text-center">Mutare Provincial Hospital</p>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="h-px flex-1 bg-gradient-to-r from-white/40 to-transparent" />
              <p className="text-white/55 text-sm font-medium whitespace-nowrap">Ministry of Health &amp; Child Care · Zimbabwe</p>
              <div className="h-px flex-1 bg-gradient-to-l from-white/40 to-transparent" />
            </div>
            <h1 className="text-2xl font-black text-white/90 leading-tight mt-2 text-center">
              Welcome &nbsp;·&nbsp; <span className="text-white/70">Mauya</span> &nbsp;·&nbsp; <span className="text-white/50">Siyakwamukela</span>
            </h1>
          </div>

          {/* Right controls */}
          <div className="flex flex-col items-end gap-3 flex-shrink-0">
            <button
              onPointerDown={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              )}
            </button>
            <p className="text-white/30 text-[10px] font-mono uppercase tracking-wider">AURA v2.0</p>
          </div>
        </div>

        {/* Bottom strip: language instruction */}
        <div className="relative mt-3 pt-2.5 border-t border-white/10 text-center">
          <p className="text-white/60 text-sm">{touchInstruction}</p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden min-h-0">

        {/* Language grid */}
        <div className="flex-1 flex flex-col px-3 py-2 min-w-0">
          <div className="grid grid-cols-4 grid-rows-4 gap-2 flex-1 h-full">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onPointerDown={() => selectLanguage(lang.code)}
                className="flex flex-col items-start px-4 py-4 rounded-2xl bg-white dark:bg-[#111] border-2 border-gray-200 dark:border-[#222] hover:border-[#003d73] dark:hover:border-blue-600 active:scale-[0.96] transition-all duration-150 w-full h-full"
              >
                <p className="text-base font-black text-gray-900 dark:text-white leading-tight">{lang.nativeName}</p>
                {lang.nativeName !== lang.name && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium leading-tight mt-1">{lang.name}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex flex-col items-center py-4 flex-shrink-0 px-1">
          <div className="flex-1 w-px bg-gray-100 dark:bg-[#222]" />
          <span className="text-[8px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest my-2" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>or</span>
          <div className="flex-1 w-px bg-gray-100 dark:bg-[#222]" />
        </div>

        {/* Voice panel */}
        <div className="w-36 flex flex-col items-center justify-center gap-2 px-3 flex-shrink-0">
          <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">{voiceLabel}</p>
          <button
            onPointerDown={() => setVoiceOpen(true)}
            className="relative w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-[#003d73] to-[#0077cc] text-white shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
            aria-label="Start AI voice assistant"
          >
            <span className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-ping" />
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>
          <div className="text-center">
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{voiceTitle}</p>
            <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">{voiceSubtitle}</p>
          </div>
        </div>
      </main>

      {/* ── Research Objectives ─── 4 icon buttons, hover = tooltip annotation */}
      <section className="border-t border-gray-100 dark:border-[#1a1a1a] px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-center gap-5">
          {RESEARCH_OBJECTIVES.map((objective) => {
            const Icon = OBJECTIVE_ICONS[objective.id]
            return (
              <div key={objective.id} className="group relative flex flex-col items-center">
                <button
                  onPointerDown={() => router.push(objective.featureRoutes[0].href)}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#003d73]/8 dark:bg-blue-900/20 text-[#003d73] dark:text-blue-400 hover:bg-[#003d73] hover:text-white dark:hover:bg-blue-700 active:scale-90 transition-all duration-200"
                  aria-label={objectiveTooltips[objective.id as ResearchObjectiveId]}
                >
                  <Icon size={18} />
                </button>
                {/* Annotation tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <div className="bg-[#001d3d] dark:bg-[#0a1628] text-white text-[10px] font-semibold px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap">
                    <span className="text-blue-300 text-[9px] font-bold mr-1.5">{objective.number}</span>
                    {objectiveTooltips[objective.id as ResearchObjectiveId]}
                  </div>
                  <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#001d3d] dark:border-t-[#0a1628] mx-auto" />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <footer className="border-t border-gray-100 dark:border-[#1a1a1a] px-4 py-1.5 flex items-center justify-between text-[9px] text-gray-400 dark:text-gray-600 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="uppercase tracking-[0.24em] text-[8px]">{amenitiesLabel}</span>
          <span>💧 {waterLabel}</span>
          <span>🧴 {sanitizerLabel}</span>
          <span>🧻 {tissuesLabel}</span>
        </div>
        <span className="font-mono">AURA v2.0</span>
      </footer>

      {voiceOpen && (
        <VoiceChat onClose={() => setVoiceOpen(false)} onNavigate={(href: string) => { setVoiceOpen(false); router.push(href) }} />
      )}
    </div>
  )
}
