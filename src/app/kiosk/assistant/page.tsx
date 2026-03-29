'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { FaChevronLeft, FaMicrophone, FaStop, FaPaperPlane, FaRobot } from 'react-icons/fa6'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

const EXAMPLE_PROMPTS = [
  'Where is the pharmacy?',
  'What time is my appointment?',
  'How do I get to the emergency room?',
  'What are visiting hours?',
  'Where can I pay my bill?',
  'Where are the toilets?',
  'What is the cost of a consultation?',
  'How do I find the maternity ward?',
]

export default function KioskAssistant() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Hello! I\'m your AURA Assistant. I can help you navigate Mutare Provincial Hospital, answer questions about services, fees, visiting hours, and more. How can I help you today?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { role: 'user', text: trimmed }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        }),
      })
      const data = await res.json()
      const reply = data.response || data.message || 'I\'m sorry, I couldn\'t process that. Please try again.'
      setMessages(prev => [...prev, { role: 'assistant', text: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'I\'m having trouble connecting. Please try again or ask a staff member for help.' }])
    }
    setLoading(false)
  }

  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser.')
      return
    }
    setListening(true)
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setListening(false)
      sendMessage(transcript)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend   = () => setListening(false)
    recognition.start()
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#003d73] to-[#0077cc] px-5 py-4 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => router.push('/kiosk/menu')}
          className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors">
          <FaChevronLeft size={14} />
        </button>
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <FaRobot className="text-white text-lg" />
        </div>
        <div className="flex-1">
          <p className="text-white font-black text-sm">AURA Assistant</p>
          <p className="text-white/60 text-[10px]">Ask me anything about the hospital</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/60 text-[10px] font-medium">Online</span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#003d73] to-[#0077cc] flex items-center justify-center flex-shrink-0 mb-1">
                <FaRobot className="text-white text-xs" />
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#003d73] text-white rounded-br-sm'
                : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-100 rounded-bl-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#003d73] to-[#0077cc] flex items-center justify-center flex-shrink-0">
              <FaRobot className="text-white text-xs" />
            </div>
            <div className="bg-gray-100 dark:bg-[#1a1a1a] px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts — only shown before first user message */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Common Questions</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-3 border-t border-gray-100 dark:border-[#222] bg-white dark:bg-[#111] flex items-center gap-2 flex-shrink-0">
        <button
          onClick={startVoice}
          disabled={listening}
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
            listening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600'
          }`}
          title="Voice input"
        >
          {listening ? <FaStop size={14} /> : <FaMicrophone size={14} />}
        </button>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
          placeholder="Type your question..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="w-10 h-10 rounded-xl bg-[#003d73] hover:bg-[#002d57] disabled:opacity-40 text-white flex items-center justify-center flex-shrink-0 transition-colors"
        >
          <FaPaperPlane size={13} />
        </button>
      </div>
    </div>
  )
}
