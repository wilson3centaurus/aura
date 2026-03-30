'use client'

import { useState, useEffect, useRef } from 'react'

export default function PatientAssistant() {
  const [messages, setMessages] = useState<{role: 'user'|'model', content: string, action?: any}[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  return (
    <div className="flex flex-col h-[100dvh] bg-white dark:bg-[#0a0a0a]">
      <header className="bg-gradient-to-r from-[#003d73] to-[#0077cc] px-5 py-4 flex items-center shadow-md">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl mr-3">
          🤖
        </div>
        <div>
          <h1 className="text-white font-black text-lg">Aura Assistant</h1>
          <p className="text-white/70 text-xs">Mutare Provincial Hospital</p>
        </div>
      </header>

      <div className="flex-1 w-full overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
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
              <div className="mt-2 w-full max-w-[85%] rounded-xl overflow-hidden border border-gray-200 dark:border-[#333] shadow-sm ml-2">
                 <div className="bg-[#003d73] text-white px-4 py-2 text-sm font-bold flex justify-between items-center">
                    <span className="truncate">📍 {m.action.name}</span>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${m.action.lat},${m.action.lng}`} target="_blank" className="bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30 text-xs shrink-0 ml-2 shadow-sm font-medium">Open Google Maps</a>
                 </div>
                 <div className="h-32 bg-gray-200 dark:bg-gray-800 flex items-center justify-center relative bg-cover bg-center" style={{ backgroundImage: `url('https://maps.googleapis.com/maps/api/staticmap?center=${m.action.lat},${m.action.lng}&zoom=17&size=400x150&maptype=roadmap&markers=color:red%7C${m.action.lat},${m.action.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}')` }} />
              </div>
            )}

            {m.action && m.action.type === 'APPOINTMENT' && (
              <div className="mt-2 w-full max-w-[85%] rounded-2xl p-4 border border-blue-200 dark:border-[#003d73] bg-blue-50/50 dark:bg-[#111] shadow-sm ml-2 text-left">
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
      
      <form onSubmit={handleTextSubmit} className="p-4 bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-[#222]">
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 pl-4 pr-12 py-3.5 rounded-2xl bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-[#0a0a0a] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73] shadow-inner"
            disabled={loading}
          />
          <button type="submit" disabled={!input.trim() || loading}
            className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square rounded-xl bg-[#003d73] active:bg-[#002d57] text-white flex items-center justify-center disabled:opacity-50 transition-colors shadow-sm">
            <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
          </button>
        </div>
      </form>
    </div>
  )
}
