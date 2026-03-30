'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'

type Mode = 'select' | 'text' | 'voice'

export default function KioskAssistant() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('select')
  
  // Text Mode state
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [messages, setMessages] = useState<{role: 'user'|'model', content: string, action?: any}[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Voice Mode state
  const [callStatus, setCallStatus] = useState<'disconnected' | 'connected'>('disconnected')
  const [voiceMessages, setVoiceMessages] = useState<{role: 'user'|'model', content: string}[]>([])
  const [isListening, setIsListening] = useState(false)
  const [aiSpeech, setAiSpeech] = useState('')
  const [silenceCount, setSilenceCount] = useState(0)
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // Initialize QR Code for Text Mode
  useEffect(() => {
    if (mode === 'text') {
      const getHost = async () => {
        try {
          const res = await fetch('/api/host')
          const { host } = await res.json()
          const url = `http://${host}/patient/assistant`
          const qr = await QRCode.toDataURL(url, { width: 200, margin: 1, color: { dark: '#003d73', light: '#ffffff' } })
          setQrCodeUrl(qr)
        } catch (e) {
          console.error(e)
        }
      }
      getHost()
    }
  }, [mode])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize Voice Mode
  useEffect(() => {
    if (mode === 'voice' && typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true
      }
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop()
      if (synthRef.current) synthRef.current.cancel()
    }
  }, [mode])

  const handleCallVoiceSubmit = async (text: string, currentHistory: {role: 'user'|'model', content: string}[]) => {
    setLoading(true)
    setIsListening(false)
    setAiSpeech('Thinking...')
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text + " Please reply as a helpful phone agent.", history: currentHistory })
      })
      const data = await res.json()
      if (data.reply) {
        setAiSpeech(data.reply)
        setVoiceMessages(prev => {
          const newHist = [...prev, { role: 'model', content: data.reply } as const]
          speakCard(data.reply, () => startCallListening(newHist))
          return newHist
        })
      } else {
        const err = "I'm having trouble connecting right now."
        setAiSpeech(err)
        speakCard(err, () => startCallListening(currentHistory))
      }
    } catch {
      const err = "Network error."
      setAiSpeech(err)
      speakCard(err, () => startCallListening(currentHistory))
    }
    setLoading(false)
  }

  const startCallListening = (currentHistory: {role: 'user'|'model', content: string}[]) => {
    if (callStatus === 'disconnected') return // stop if user ended call
    if (!recognitionRef.current) return
    
    setAiSpeech('')
    setIsListening(true)
    
    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript
      }
      if (finalTranscript) {
        recognitionRef.current._lastTranscript = finalTranscript
      }
    }

    recognitionRef.current.onend = () => {
      setIsListening(false)
      const text = recognitionRef.current?._lastTranscript
      recognitionRef.current._lastTranscript = ''
      
      if (text && text.trim()) {
        setSilenceCount(0)
        const newHist = [...currentHistory, { role: 'user', content: text.trim() } as const]
        setVoiceMessages(newHist)
        handleCallVoiceSubmit(text.trim(), newHist)
      } else {
        setSilenceCount(prev => {
           if (prev >= 2) {
             setCallStatus('disconnected')
             return 0
           }
           setAiSpeech("Are you still there?")
           speakCard("Are you still there?", () => startCallListening(currentHistory))
           return prev + 1
        })
      }
    }

    try {
      recognitionRef.current.start()
    } catch (e) {}
  }

  const speakCard = (text: string, onEnd?: () => void) => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voices = synthRef.current.getVoices()
    const preferredVoice = voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Samantha') || (v.lang.startsWith('en') && v.name.includes('Female')))
    if (preferredVoice) utterance.voice = preferredVoice
    utterance.rate = 1.05
    utterance.onend = () => { if (onEnd) onEnd() }
    utterance.onerror = () => { if (onEnd) onEnd() }
    synthRef.current.speak(utterance)
  }

  const startCall = () => {
    setCallStatus('connected')
    setVoiceMessages([])
    const greeting = "Good day sir or madam, welcome to Mutare Provincial General Hospital. How can I help you today?"
    setAiSpeech(greeting)
    setVoiceMessages([{ role: 'model', content: greeting }])
    speakCard(greeting, () => startCallListening([{ role: 'model', content: greeting }]))
  }

  const endCall = () => {
    setCallStatus('disconnected')
    if (synthRef.current) synthRef.current.cancel()
    if (recognitionRef.current) recognitionRef.current.stop()
  }

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    
    setLoading(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: messages })
      })
      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'model', content: data.reply, action: data.action }])
      } else {
        setMessages(prev => [...prev, { role: 'model', content: "I'm having trouble connecting right now." }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'model', content: "Network error. Please try again." }])
    }
    setLoading(false)
  }

  if (mode === 'select') {
    return (
      <div className="flex flex-col h-full bg-[#0a0a0a]">
        <header className="px-6 py-5 flex items-center gap-4 border-b border-[#222]">
          <button onClick={() => router.push('/kiosk/menu')}
            className="p-3 rounded-2xl bg-[#111] text-white hover:bg-[#222] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">How would you like to interact?</h1>
            <p className="text-gray-400 mt-1">Choose text chat or talk aloud to Aura.</p>
          </div>
        </header>

        <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-6 gap-6 max-w-5xl mx-auto w-full">
          {/* Text Option */}
          <button onClick={() => setMode('text')}
            className="flex-1 w-full bg-[#111] hover:bg-[#1a1a1a] border border-[#222] rounded-3xl p-8 flex flex-col items-center justify-center gap-4 transition-all group">
            <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
              💬
            </div>
            <h2 className="text-2xl font-black text-white mt-2">Text Assistant</h2>
            <p className="text-gray-400 text-center">Type your questions on the screen, or scan a QR code to chat from your phone.</p>
          </button>

          {/* Voice Option */}
          <button onClick={() => setMode('voice')}
            className="flex-1 w-full bg-[#111] hover:bg-[#1a1a1a] border border-[#222] rounded-3xl p-8 flex flex-col items-center justify-center gap-4 transition-all group">
            <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
              🎙️
            </div>
            <h2 className="text-2xl font-black text-white mt-2">Voice Assistant</h2>
            <p className="text-gray-400 text-center">Speak out loud directly to the kiosk like a real customer service desk.</p>
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'text') {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a]">
        <header className="bg-gradient-to-r from-[#003d73] to-[#0077cc] px-5 py-4 flex items-center gap-4">
          <button onClick={() => setMode('select')}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-white font-black text-lg">Text Assistant</h1>
            <p className="text-white/70 text-xs">Ask me anything about the hospital.</p>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col items-center border-r border-gray-100 dark:border-[#222]">
            <div className="flex-1 w-full max-w-3xl overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-[#003d73]/10 flex items-center justify-center text-4xl shadow-lg border border-[#003d73]/20">
                    🤖
                  </div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">Hello! I'm Aura.</h2>
                  <p className="text-gray-500 max-w-sm text-sm">How can I help you today? You can ask me about directions, departments, or doctors.</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {['Where is the Pharmacy?', 'How do I book an appointment?', 'What are the visiting hours?'].map(q => (
                      <button key={q} onClick={() => setInput(q)}
                        className="px-4 py-2 rounded-full border border-gray-200 dark:border-[#333] text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#111]">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col w-full ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    m.role === 'user' 
                      ? 'bg-[#003d73] text-white rounded-br-sm' 
                      : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-900 dark:text-white rounded-bl-sm border border-gray-200 dark:border-[#333]'
                  }`}>
                    <p className="whitespace-pre-wrap text-[15px]">{m.content}</p>
                  </div>
                  
                  {m.action && m.action.type === 'MAP' && (
                    <div className="mt-2 w-full max-w-sm rounded-xl overflow-hidden border border-gray-200 dark:border-[#333] shadow-sm ml-2">
                       <div className="bg-[#003d73] text-white px-4 py-2 text-sm font-bold flex justify-between items-center">
                          <span className="truncate">📍 {m.action.name}</span>
                          <a href={`https://www.google.com/maps/dir/?api=1&destination=${m.action.lat},${m.action.lng}`} target="_blank" className="bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30 text-xs shrink-0 ml-2 shadow-sm font-medium">Open Map</a>
                       </div>
                       <div className="h-32 bg-gray-200 dark:bg-gray-800 flex items-center justify-center relative bg-cover bg-center" style={{ backgroundImage: `url('https://maps.googleapis.com/maps/api/staticmap?center=${m.action.lat},${m.action.lng}&zoom=17&size=400x150&maptype=roadmap&markers=color:red%7C${m.action.lat},${m.action.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}')` }} />
                    </div>
                  )}

                  {m.action && m.action.type === 'APPOINTMENT' && (
                    <div className="mt-2 w-full max-w-sm rounded-2xl p-4 border border-blue-200 dark:border-[#003d73] bg-blue-50/50 dark:bg-[#111] shadow-sm ml-2 text-left">
                       <div className="flex justify-between items-start mb-1">
                         <div>
                           <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest mb-0.5">Appt. Tracker</p>
                           <p className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wider">{m.action.id}</p>
                         </div>
                         <span className={`px-2.5 py-1 text-[10px] font-black tracking-wider uppercase rounded-md shadow-sm border ${
                           m.action.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50' :
                           m.action.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50' :
                           'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                         }`}>{m.action.status}</span>
                       </div>
                       
                       <div className="mt-4 px-3 py-2 bg-white dark:bg-[#0a0a0a] rounded-xl border border-gray-100 dark:border-[#222]">
                         <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 line-clamp-1"><span className="text-gray-400 text-xs uppercase tracking-wide mr-2">Doc</span>Dr. {m.action.doctor}</p>
                         <p className="text-sm font-medium text-gray-700 dark:text-gray-300"><span className="text-gray-400 text-xs uppercase tracking-wide mr-2">Time</span>{new Date(m.action.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                       </div>
                    </div>
                  )}
                </div>
              ))}
              {loading && mode === 'text' && (
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
            
            <form onSubmit={handleTextSubmit} className="w-full max-w-3xl p-4 bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-[#222]">
              <div className="flex gap-2 relative">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 pl-4 pr-12 py-4 rounded-xl bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-[#0a0a0a] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73]"
                  disabled={loading}
                  autoFocus
                />
                <button type="submit" disabled={!input.trim() || loading}
                  className="absolute right-2 top-2 bottom-2 aspect-square rounded-lg bg-[#003d73] hover:bg-[#002d57] text-white flex items-center justify-center disabled:opacity-50 transition-colors">
                  <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
                </button>
              </div>
            </form>
          </div>

          {/* QR Code Side Panel */}
          <div className="hidden md:flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-[#111] w-80 shrink-0 text-center">
            <h3 className="font-black text-gray-900 dark:text-white mb-2">Chat on your Phone</h3>
            <p className="text-xs text-gray-500 mb-6 px-4">Scan this QR code to continue the conversation while you walk to your destination.</p>
            {qrCodeUrl ? (
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                <img src={qrCodeUrl} alt="Chat QR Code" className="w-48 h-48" />
              </div>
            ) : (
              <div className="w-48 h-48 border-2 border-dashed border-gray-300 dark:border-[#333] rounded-2xl flex items-center justify-center mb-6">
                <span className="text-xs text-gray-400">Loading QR...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Voice mode
  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] relative overflow-hidden">
      <header className="absolute top-0 inset-x-0 px-6 py-5 flex items-center justify-between z-10">
        <button onClick={() => { setMode('select'); endCall(); }}
          className="p-3 rounded-2xl bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-6 relative z-10">
        {callStatus === 'disconnected' ? (
          <div className="text-center p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#0077cc]/20 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-[#0077cc]" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Hospital Voice Agent</h2>
            <p className="text-gray-400 mb-8 max-w-sm mx-auto">You will soon be connected to our hospital human-like AI agent. They can help you with directions, bookings, and facility information.</p>
            <button 
              onClick={startCall}
              className="px-8 py-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
              Start Call
            </button>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-between py-12">
            
            {/* Caller Info */}
            <div className="text-center mt-8">
              <div className="w-24 h-24 mx-auto rounded-full bg-blue-900 border-4 border-[#003d73] shadow-lg mb-4 flex items-center justify-center text-4xl">🤖</div>
              <h2 className="text-3xl font-black text-white">Mutare Prov. Hospital</h2>
              <p className="text-[#0077cc] font-medium tracking-wide mt-1">AI Agent Aura</p>
            </div>

            {/* Transcript & Waveform */}
            <div className="w-full text-center space-y-6 flex-1 flex flex-col justify-center">
              <p className="text-xl font-medium text-emerald-400 min-h-[30px] opacity-80">
                {isListening ? "Listening..." : " "}
              </p>
              
              <div className="flex items-center justify-center gap-2 h-16">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className={`w-3 rounded-full bg-[#0077cc] transition-all duration-300 ${!isListening && !loading && aiSpeech ? 'animate-[pulse_1s_ease-in-out_infinite]' : 'h-2'}`}
                    style={(!isListening && !loading && aiSpeech) ? { height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.1}s` } : {}}
                  />
                ))}
              </div>

              <p className="text-2xl font-black text-white min-h-[64px] px-8">
                {loading ? <span className="animate-pulse text-[#0077cc]">Processing...</span> : aiSpeech}
              </p>
            </div>

            {/* End Call Button */}
            <button 
              onClick={endCall}
              className="w-20 h-20 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.4)] active:scale-95 transition-all mt-auto mb-8">
               <svg className="w-10 h-10 transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
