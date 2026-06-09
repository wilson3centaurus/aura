'use client'

import { useTheme } from '@/components/ThemeProvider'
import PresenceDetector from '@/components/PresenceDetector'
import { useEffect, useState } from 'react'

type WarningLevel = 'degraded' | 'failed'

interface TtsWarning {
  level: WarningLevel
  label: string
  hint: string
}

function parseTtsWarning(raw: string): TtsWarning {
  if (raw === 'all_providers_failed') {
    return {
      level: 'failed',
      label: 'Voice unavailable — all TTS providers failed',
      hint: 'Using browser speech synthesis. Check ElevenLabs, Gemini, and OpenAI quotas.',
    }
  }
  const parts = raw.split(',')
  const labels: string[] = []
  for (const p of parts) {
    if (p.startsWith('elevenlabs:quota')) labels.push('ElevenLabs quota exceeded (402)')
    else if (p.startsWith('elevenlabs:error')) labels.push(`ElevenLabs error (${p.split('_').pop()})`)
    else if (p.startsWith('gemini:quota')) labels.push('Gemini quota exceeded')
    else if (p.startsWith('openai:quota')) labels.push('OpenAI quota exceeded')
    else if (p.includes('network_error')) labels.push(p.split(':')[0] + ' unreachable')
  }
  const hasQuota = parts.some(p => p.includes('quota'))
  const level: WarningLevel = parts.length >= 2 ? 'failed' : 'degraded'
  return {
    level,
    label: labels.length ? `Voice degraded: ${labels.join(' · ')}` : 'Voice service degraded',
    hint: hasQuota ? 'Please top up your API account to restore premium voice.' : 'Voice is running on backup mode.',
  }
}

function TtsBanner() {
  const [warning, setWarning] = useState<TtsWarning | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check for persisted warning from previous TTS call
    try {
      const stored = localStorage.getItem('tts-warning')
      if (stored) {
        const { warnings, ts } = JSON.parse(stored)
        // Only show if within last 30 minutes
        if (Date.now() - ts < 30 * 60 * 1000) {
          setWarning(parseTtsWarning(warnings))
          setDismissed(false)
        }
      }
    } catch {}

    function onWarning(e: Event) {
      const { warnings } = (e as CustomEvent).detail
      setWarning(parseTtsWarning(warnings))
      setDismissed(false)
    }
    window.addEventListener('tts-warning', onWarning)
    return () => window.removeEventListener('tts-warning', onWarning)
  }, [])

  if (!warning || dismissed) return null

  const isFailure = warning.level === 'failed'

  return (
    <div className={`flex items-start gap-3 px-4 py-2.5 text-sm border-b ${
      isFailure
        ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300'
        : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300'
    }`}>
      <span className="text-base mt-0.5 flex-shrink-0">{isFailure ? '🔇' : '⚠️'}</span>
      <div className="flex-1 min-w-0">
        <span className="font-semibold">{warning.label}</span>
        <span className="mx-1.5 opacity-50">·</span>
        <span className="opacity-80 text-xs">{warning.hint}</span>
      </div>
      <button
        onClick={() => {
          setDismissed(true)
          try { localStorage.removeItem('tts-warning') } catch {}
        }}
        className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} h-screen w-screen overflow-hidden bg-white dark:bg-[#0a0a0a] flex flex-col kiosk-container`}>
      {/* Camera presence detection — no auto-redirect */}
      <PresenceDetector enabled={true} />
      <TtsBanner />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
