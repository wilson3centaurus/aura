'use client'
/**
 * VoiceChat – ChatGPT-style push-to-talk AI assistant.
 * Set NEXT_PUBLIC_DISABLE_VOICE="true" to disable during testing.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import AuraLogo from './AuraLogo'

const VOICE_DISABLED = process.env.NEXT_PUBLIC_DISABLE_VOICE === 'true'

type Message = { role: 'user' | 'assistant'; text: string }
type Phase = 'idle' | 'recording' | 'thinking' | 'speaking'

const BAR_COUNT = 28

function WaveformBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-10">
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full transition-all ${active ? 'bg-blue-400' : 'bg-blue-400/30'}`}
          style={
            active
              ? {
                  height: `${20 + Math.random() * 80}%`,
                  animation: `voiceBar ${0.4 + Math.random() * 0.6}s ease-in-out ${Math.random() * 0.4}s infinite`,
                }
              : { height: '20%' }
          }
        />
      ))}
    </div>
  )
}

interface Props {
  onClose: () => void
  onNavigate: (href: string) => void
}

export default function VoiceChat({ onClose, onNavigate }: Props) {
  // If voice is disabled, show a simple disabled screen
  if (VOICE_DISABLED) {
    return (
      <div
        className="fixed inset-0 z-[500] flex flex-col items-center justify-center gap-6"
        style={{ background: 'linear-gradient(160deg, #0a0f1e 0%, #0d1b35 60%, #091628 100%)' }}
      >
        <AuraLogo size={48} showText />
        <div className="text-center px-8 space-y-2">
          <p className="text-white font-bold text-lg">Voice Assistant Disabled</p>
          <p className="text-blue-400/70 text-sm">Voice is turned off in testing mode.</p>
          <p className="text-blue-400/50 text-xs">Set NEXT_PUBLIC_DISABLE_VOICE=false in .env to enable.</p>
        </div>
        <button
          onClick={onClose}
          className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors"
        >
          Go Back
        </button>
      </div>
    )
  }

  return <VoiceChatInner onClose={onClose} onNavigate={onNavigate} />
}

function VoiceChatInner({ onClose, onNavigate }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [transcript, setTranscript] = useState('')
  const [aiText, setAiText] = useState('')
  const [error, setError] = useState('')
  const [lang, setLang] = useState<'en'|'sn'|'nd'>('en')
  const [consecutiveSilence, setConsecutiveSilence] = useState(0)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    return () => {
      isMounted.current = false
      window.speechSynthesis?.cancel()
      recognitionRef.current?.abort()
    }
  }, [])

  // Auto-scroll messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, aiText])

  const speak = useCallback((text: string, onDone?: () => void) => {
    window.speechSynthesis?.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 1.05
    utter.pitch = 1
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.lang.startsWith('en') && v.localService) ?? voices[0]
    if (preferred) utter.voice = preferred
    utter.onend = () => { if (isMounted.current) onDone?.() }
    utter.onerror = () => { if (isMounted.current) onDone?.() }
    synthRef.current = utter
    window.speechSynthesis.speak(utter)
  }, [])

  const sendToAI = useCallback(async (userText: string, currentHistory: Message[]) => {
    setPhase('thinking')
    setError('')
    try {
      // Add a system context hint for the language
      const langHint = lang === 'en' ? "Please reply in English." : lang === 'sn' ? "Please reply in Shona language." : "Please reply in Ndebele language."
      
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userText + ' ' + langHint,
          history: currentHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'model', content: m.text }))
        }),
      })
      if (!res.ok) throw new Error('AI error')
      const data = await res.json()
      const reply: string = data.reply ?? "I'm sorry, I didn't understand that."
      const nav: string | undefined = data.navigate

      if (!isMounted.current) return
      setMessages(prev => [...prev])
      setAiText(reply)
      setPhase('speaking')

      setMessages(prev => {
        const newHistory = [...prev, { role: 'assistant', text: reply } as Message]
        speak(reply, () => {
          if (!isMounted.current) return
          if (nav) {
            setPhase('idle')
            onNavigate(nav)
          } else {
            // Loop back to recording
            startRecording(newHistory)
          }
        })
        return newHistory
      })
    } catch {
      if (!isMounted.current) return
      setError('Could not reach the AI. Please try again.')
      setPhase('idle')
    }
  }, [speak, onNavigate, lang])

  const startRecording = useCallback((currentHistory: Message[]) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Voice input requires Chrome or Edge browser.')
      return
    }
    window.speechSynthesis?.cancel()
    setTranscript('')
    setAiText('')
    setPhase('recording')

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = lang === 'en' ? 'en-US' : lang === 'sn' ? 'sn-ZW' : 'nd-ZW'
    recognitionRef.current = recognition

    recognition.onresult = (event: any) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript
        else interim += event.results[i][0].transcript
      }
      if (isMounted.current) setTranscript(final || interim)
    }

    recognition.onend = () => {
      if (!isMounted.current) return
      const text = recognitionRef.current?._lastTranscript || transcript
      if (text.trim()) {
        setConsecutiveSilence(0)
        setMessages(prev => {
          const newHistory = [...prev, { role: 'user', text: text.trim() } as Message]
          sendToAI(text.trim(), newHistory)
          return newHistory
        })
      } else {
        setConsecutiveSilence(prev => {
          const newCount = prev + 1
          if (newCount >= 2) {
             setPhase('idle')
             return 0
          }
          setPhase('speaking')
          const noHear = lang === 'en' ? "I didn't hear anything." : lang === 'sn' ? "Handina chandinzwa." : "Angizwanga lutho."
          speak(noHear, () => startRecording(currentHistory))
          return newCount
        })
      }
    }

    recognition.onerror = () => {
      if (isMounted.current) setPhase('idle')
    }

    recognition.addEventListener('result', (event: any) => {
      let final = ''
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript
      }
      if (final) recognitionRef.current._lastTranscript = final
    })

    recognition.start()
  }, [transcript, sendToAI, lang, speak])

  const stopRecording = useCallback(() => { recognitionRef.current?.stop() }, [])
  const stopSpeaking = useCallback(() => { window.speechSynthesis?.cancel(); setPhase('idle') }, [])

  const phaseLabel: Record<Phase, string> = {
    idle: 'Tap the mic to speak',
    recording: 'Listening…',
    thinking: 'AURA is thinking…',
    speaking: 'AURA is speaking…',
  }

  return (
    <div
      className="fixed inset-0 z-[500] flex flex-col"
      style={{ background: 'linear-gradient(160deg, #0a0f1e 0%, #0d1b35 60%, #091628 100%)' }}
    >
      <div className="flex items-center justify-between px-6 pt-6 pb-4 relative">
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors text-sm font-medium flex items-center gap-1.5 z-10 w-20">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <AuraLogo size={36} showText />
        </div>
        
        <div className="flex gap-2 z-10 w-20 justify-end">
          {['en', 'sn', 'nd'].map(l => (
            <button key={l} onClick={() => {
              setLang(l as 'en'|'sn'|'nd')
              const greeting = l === 'en' ? "Hey, what brings you here today?" : l === 'sn' ? "Mhoro, chii chamuunzira pano nhasi?" : "Sawubona, kuyini okukulethe lapha namuhla?"
              const initHist = [{ role: 'assistant', text: greeting } as Message]
              setMessages(initHist)
              setPhase('speaking')
              speak(greeting, () => startRecording(initHist))
            }}
              className={`uppercase text-[10px] font-bold px-2 py-1 rounded-md border ${lang === l ? 'bg-blue-600 border-blue-500 text-white' : 'bg-transparent border-white/20 text-white/50 hover:bg-white/10'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-2 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-4 opacity-70">
            <div className="w-16 h-16 rounded-full bg-blue-600/20 border border-blue-400/20 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </div>
            <p className="text-blue-300 text-sm font-semibold">Hi, I'm AURA</p>
            <p className="text-blue-400/60 text-xs leading-relaxed">
              I can help you find a doctor, check medication, navigate the hospital, and more.<br />
              Just tap the mic and speak naturally.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg
                ${msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white/10 text-blue-50 rounded-bl-sm border border-white/10 backdrop-blur-sm'
                }`}
              style={{ animation: 'fadeSlideUp 0.3s ease-out both' }}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {phase === 'recording' && transcript && (
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-sm px-4 py-3 text-sm bg-blue-600/40 text-white/60 border border-blue-400/20 italic">
              {transcript}
            </div>
          </div>
        )}
        {phase === 'thinking' && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm px-5 py-3 bg-white/10 border border-white/10">
              <span className="flex gap-1.5 items-center h-4">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400"
                    style={{ animation: `pulseSoft 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center py-3">
        <WaveformBars active={phase === 'recording' || phase === 'speaking'} />
      </div>

      <p className="text-center text-xs font-medium text-blue-400/70 -mt-1 mb-4 tracking-wide">
        {phaseLabel[phase]}
      </p>

      {error && <p className="text-center text-xs text-red-400 mb-2 px-6">{error}</p>}

      <div className="flex flex-col items-center gap-4 pb-8">
        <button
          onClick={() => {
            if (phase === 'idle') {
               startRecording(messages)
            } else {
               stopSpeaking()
               stopRecording()
            }
          }}
          disabled={phase === 'thinking'}
          aria-label={phase === 'recording' ? 'Release to send' : 'Hold to speak'}
          className={`
            relative w-20 h-20 rounded-full flex items-center justify-center
            text-white shadow-2xl transition-all duration-200 select-none
            disabled:opacity-40
            ${phase === 'recording'
              ? 'bg-red-500 scale-110 ring-4 ring-red-400/40'
              : phase === 'speaking'
              ? 'bg-emerald-500 scale-105 ring-4 ring-emerald-400/30'
              : phase === 'thinking'
              ? 'bg-blue-700 cursor-not-allowed'
              : 'bg-gradient-to-br from-blue-500 to-cyan-400 hover:scale-105 active:scale-95'
            }
          `}
        >
          {phase === 'recording' && (
            <span className="absolute inset-0 rounded-full border-2 border-red-400/60 animate-ping" />
          )}
          {phase === 'recording' ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><rect x="4" y="4" width="16" height="16" rx="3"/></svg>
          ) : phase === 'speaking' ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          )}
        </button>
        <p className="text-blue-400/50 text-[11px] tracking-wide">
          {phase === 'idle' ? 'Tap mic to resume conversation' : 'Tap to stop conversation'}
        </p>
      </div>
    </div>
  )
}
