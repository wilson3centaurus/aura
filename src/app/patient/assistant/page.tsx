'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useVoicePipeline } from '@/components/useVoicePipeline'
import { LANGUAGES } from '@/types'

const LANG_PICKER = LANGUAGES.filter(l => l.code !== 'sl')

export default function PatientAssistant() {
  return (
    <Suspense fallback={<div className="h-[100dvh] bg-[#0a0a0a] flex items-center justify-center text-white text-sm">Loading…</div>}>
      <PatientAssistantInner />
    </Suspense>
  )
}

function PatientAssistantInner() {
  const searchParams = useSearchParams()
  const isVoice = searchParams.get('voice') === 'true'

  const [lang, setLang] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('aura-language') || 'en' : 'en'
  )

  const changeLang = (code: string) => {
    setLang(code)
    if (typeof window !== 'undefined') localStorage.setItem('aura-language', code)
  }

  // All hooks declared unconditionally at top
  const { phase: vpPhase, messages: vpMessages, error: vpError, status: vpStatus, start: vpStart, stop: vpStop } =
    useVoicePipeline({ language: lang })

  const [textMessages, setTextMessages] = useState<{ role: 'user' | 'model'; content: string; action?: any }[]>([])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [textMessages])

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setTextMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: textMessages, language: lang }),
      })
      const data = await res.json()
      setTextMessages(prev => [...prev, { role: 'model', content: data.reply || "I'm having trouble connecting right now.", action: data.action }])
    } catch {
      setTextMessages(prev => [...prev, { role: 'model', content: 'Network error. Please try again.' }])
    }
    setLoading(false)
  }

  // ─── Voice Call UI — phone call style ───────────────────────────────────
  if (isVoice) {
    const vpActive = vpPhase !== 'idle' && vpPhase !== 'error'
    const isPulsing = vpPhase === 'listening' || vpPhase === 'speaking'

    const statusLabel =
      vpPhase === 'listening'  ? 'Listening...' :
      vpPhase === 'speaking'   ? 'AURA is speaking...' :
      vpPhase === 'processing' ? 'Thinking...' :
      vpPhase === 'error'      ? vpError :
      vpActive                 ? 'Connected' : ''

    return (
      <div className="flex flex-col h-[100dvh] bg-[#111] select-none">

        {/* Language strip */}
        <div className="flex gap-2 px-4 pt-4 pb-2 overflow-x-auto scrollbar-hide shrink-0">
          {LANG_PICKER.map(l => (
            <button key={l.code} onClick={() => changeLang(l.code)}
              className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                lang === l.code ? 'bg-white/20 text-white' : 'bg-white/5 text-white/30 hover:bg-white/10'
              }`}>
              {l.nativeName}
            </button>
          ))}
        </div>

        {/* Call body */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">

          {/* Hospital name */}
          <div className="text-center">
            <p className="text-white/40 text-xs tracking-widest uppercase">Incoming call from</p>
            <p className="text-white font-black text-2xl mt-1">Mutare Provincial Hospital</p>
            <p className="text-white/40 text-sm mt-0.5">AURA · AI Receptionist</p>
          </div>

          {/* Avatar with pulse rings */}
          <div className="relative flex items-center justify-center">
            {isPulsing && vpActive && (
              <>
                <span className="absolute w-40 h-40 rounded-full bg-emerald-500/10 animate-ping" />
                <span className="absolute w-52 h-52 rounded-full bg-emerald-500/5 animate-ping" style={{ animationDelay: '0.3s' }} />
              </>
            )}
            <div className={`relative w-32 h-32 rounded-full flex items-center justify-center shadow-2xl border-4 transition-colors duration-500 ${
              vpPhase === 'listening'  ? 'bg-emerald-600 border-emerald-400' :
              vpPhase === 'speaking'   ? 'bg-blue-600   border-blue-400'    :
              vpPhase === 'processing' ? 'bg-yellow-600 border-yellow-400'  :
              'bg-[#1e1e1e] border-white/10'
            }`}>
              <svg className="w-14 h-14 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
            </div>
          </div>

          {/* Status */}
          <div className="h-8 flex items-center justify-center">
            {vpActive && (
              <p className={`text-sm font-medium tracking-wide ${
                vpPhase === 'listening'  ? 'text-emerald-400' :
                vpPhase === 'speaking'   ? 'text-blue-400'    :
                vpPhase === 'processing' ? 'text-yellow-400'  : 'text-white/40'
              }`}>
                {statusLabel}
              </p>
            )}
            {vpPhase === 'error' && (
              <p className="text-red-400 text-sm text-center px-4">{vpError}</p>
            )}
          </div>

          {/* Pre-call prompt */}
          {!vpActive && vpPhase !== 'error' && (
            <p className="text-white/30 text-sm text-center max-w-xs leading-relaxed">
              Tap the green button to call — AURA will answer right away.
            </p>
          )}
        </div>

        {/* Call controls */}
        <div className="shrink-0 pb-14 pt-4 flex items-center justify-center gap-16">
          {vpActive && (
            <button
              onClick={() => { /* mute todo */ }}
              className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors"
            >
              <svg className="w-6 h-6 text-white/60" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3zm-1 1.93V18H9v2h6v-2h-2v-2.07A5.002 5.002 0 0017 11h-2a3 3 0 01-6 0H7a5.002 5.002 0 004 4.93z"/>
              </svg>
            </button>
          )}

          {/* Start / End button */}
          <button
            onClick={vpActive ? vpStop : vpStart}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all ${
              vpActive ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {vpActive ? (
              /* end call */
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" transform="rotate(133 12 12)"/>
              </svg>
            ) : (
              /* start call */
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
              </svg>
            )}
          </button>

          {vpActive && (
            <button
              className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center opacity-0 pointer-events-none"
            />
          )}
        </div>
      </div>
    )
  }

  // ─── Text Chat UI ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[100dvh] bg-white dark:bg-[#0a0a0a]">
      <header className="bg-gradient-to-r from-[#003d73] to-[#0077cc] shadow-md shrink-0">
        <div className="px-5 py-3 flex items-center">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl mr-3">🤖</div>
          <div>
            <h1 className="text-white font-black text-lg">Aura Assistant</h1>
            <p className="text-white/70 text-xs">Mutare Provincial Hospital</p>
          </div>
        </div>
        {/* Language picker */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {LANG_PICKER.map(l => (
            <button key={l.code} onClick={() => changeLang(l.code)}
              className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                lang === l.code ? 'bg-white text-[#003d73]' : 'bg-white/20 text-white/70 hover:bg-white/30'
              }`}>
              {l.nativeName}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 w-full overflow-y-auto p-4 space-y-4">
        {textMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center mt-10">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">How can I help you?</h2>
            <p className="text-gray-500 text-sm">Ask me about departments, directions, doctors, or hospital services.</p>
            <div className="flex flex-col gap-2 w-full mt-4">
              {['Where is the Pharmacy?', 'How do I book an appointment?', 'Visiting hours?'].map(q => (
                <button key={q} onClick={() => setInput(q)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#333] text-sm font-semibold text-[#003d73] dark:text-blue-400 bg-gray-50 dark:bg-[#111] hover:bg-gray-100 dark:hover:bg-[#1a1a1a]">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {textMessages.map((m, i) => (
          <div key={i} className={`flex flex-col w-full ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'bg-[#003d73] text-white rounded-br-sm' : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-900 dark:text-white rounded-bl-sm border border-gray-200 dark:border-[#333]'}`}>
              <p className="whitespace-pre-wrap text-[15px]">{m.content}</p>
            </div>
            {m.action?.type === 'MAP' && (
              <div className="mt-2 w-full max-w-[85%] rounded-xl overflow-hidden border border-gray-200 dark:border-[#333] shadow-sm">
                <div className="bg-[#003d73] text-white px-4 py-2 text-sm font-bold flex justify-between items-center">
                  <span className="truncate">📍 {m.action.name}</span>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${m.action.lat},${m.action.lng}`} target="_blank" className="bg-white/20 px-3 py-1 rounded-lg text-xs shrink-0 ml-2">Open Maps</a>
                </div>
                <div className="h-32 bg-gray-200" style={{ background: `center/cover url('https://maps.googleapis.com/maps/api/staticmap?center=${m.action.lat},${m.action.lng}&zoom=17&size=400x150&markers=color:red%7C${m.action.lat},${m.action.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}')` }} />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-[#1a1a1a] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-75" />
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce delay-150" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleTextSubmit} className="p-4 bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-[#222] shrink-0">
        <div className="flex gap-2 relative">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." disabled={loading}
            className="flex-1 pl-4 pr-12 py-3.5 rounded-2xl bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-[#0a0a0a] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
          <button type="submit" disabled={!input.trim() || loading}
            className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square rounded-xl bg-[#003d73] text-white flex items-center justify-center disabled:opacity-50">
            <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
          </button>
        </div>
      </form>
    </div>
  )
}