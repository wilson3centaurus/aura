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
  const [messages, setMessages] = useState<{role: 'user'|'model', content: string}[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Voice Mode state
  const [isListening, setIsListening] = useState(false)
  const [voiceText, setVoiceText] = useState('')
  const [aiSpeech, setAiSpeech] = useState('')
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
        
        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = ''
          let finalTranscript = ''
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript
            else interimTranscript += event.results[i][0].transcript
          }
          if (finalTranscript) {
            setVoiceText(finalTranscript)
            handleVoiceSubmit(finalTranscript)
          } else {
            setVoiceText(interimTranscript)
          }
        }
        
        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop()
      if (synthRef.current) synthRef.current.cancel()
    }
  }, [mode])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      if (synthRef.current) synthRef.current.cancel() // Stop speaking if AI is talking
      setVoiceText('')
      setAiSpeech('')
      try {
        recognitionRef.current?.start()
        setIsListening(true)
      } catch (e) {
        console.error('Speech recognition already started')
      }
    }
  }

  const handleVoiceSubmit = async (text: string) => {
    setLoading(true)
    setAiSpeech('Thinking...')
    setIsListening(false)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: [] })
      })
      const data = await res.json()
      if (data.reply) {
        setAiSpeech(data.reply)
        speak(data.reply)
      } else {
        setAiSpeech("I'm sorry, I'm having trouble connecting right now.")
        speak("I'm sorry, I'm having trouble connecting right now.")
      }
    } catch {
      setAiSpeech("Network error.")
    }
    setLoading(false)
  }

  const speak = (text: string) => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    
    // Try to find a good female English voice
    const voices = synthRef.current.getVoices()
    const preferredVoice = voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Samantha') || (v.lang.startsWith('en') && v.name.includes('Female')))
    if (preferredVoice) utterance.voice = preferredVoice
    
    utterance.rate = 1.05
    utterance.pitch = 1.0
    synthRef.current.speak(utterance)
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
        setMessages(prev => [...prev, { role: 'model', content: data.reply }])
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
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    m.role === 'user' 
                      ? 'bg-[#003d73] text-white rounded-br-sm' 
                      : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-900 dark:text-white rounded-bl-sm border border-gray-200 dark:border-[#333]'
                  }`}>
                    <p className="whitespace-pre-wrap text-[15px]">{m.content}</p>
                  </div>
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
        <button onClick={() => setMode('select')}
          className="p-3 rounded-2xl bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </header>

      {/* Futuristic Aura Voice UI */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-6 relative z-10">
        
        {/* Core AI orb */}
        <div className="relative mb-16">
          <div className={`absolute inset-0 bg-[#003d73] blur-[80px] rounded-full opacity-30 transition-all duration-700 ${isListening ? 'scale-150 opacity-60' : ''}`} />
          <button 
            onClick={toggleListening}
            className={`relative w-40 h-40 rounded-full flex items-center justify-center border-4 shadow-[0_0_50px_rgba(0,119,204,0.3)] transition-all duration-300 ${
              isListening ? 'border-emerald-500 bg-emerald-500/10 scale-105' : 'border-[#0077cc] bg-[#003d73]/20 hover:scale-105 hover:bg-[#003d73]/40'
            }`}
          >
            {isListening ? (
              <div className="flex gap-2 items-center justify-center">
                <div className="w-2 h-10 bg-emerald-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite]" />
                <div className="w-2 h-16 bg-emerald-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.1s]" />
                <div className="w-2 h-12 bg-emerald-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite_0.2s]" />
                <div className="w-2 h-8 bg-emerald-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite_0.3s]" />
              </div>
            ) : (
              <svg className="w-16 h-16 text-[#0077cc]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            )}
          </button>
        </div>

        {/* Text Transcript */}
        <div className="w-full text-center space-y-4">
          <p className="text-xl font-medium text-emerald-400 min-h-[30px] opacity-80">
            {voiceText}
          </p>
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-[#222] to-transparent mx-auto" />
          <p className="text-2xl font-black text-white min-h-[64px]">
            {loading ? (
              <span className="animate-pulse text-[#0077cc]">Processing...</span>
            ) : (
              aiSpeech || (isListening ? 'Listening...' : 'Tap the microphone to speak')
            )}
          </p>
        </div>

      </div>
    </div>
  )
}
