'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import QRCode from 'qrcode'

type Mode = 'select' | 'text' | 'voice' | 'sign'

// ─── Speak helper (ElevenLabs -> browser speech fallback) ────────────────────
async function speakReply(text: string) {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (res.ok) {
      const url = URL.createObjectURL(await res.blob())
      return new Promise<void>(resolve => {
        const a = new Audio(url)
        a.onended = () => { URL.revokeObjectURL(url); resolve() }
        a.onerror  = () => { URL.revokeObjectURL(url); resolve() }
        a.play().catch(() => resolve())
      })
    }
  } catch {}
  // Browser speech synthesis fallback
  return new Promise<void>(resolve => {
    if (!('speechSynthesis' in window)) { resolve(); return }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.onend = u.onerror = () => resolve()
    window.speechSynthesis.speak(u)
  })
}

// ─── Sign Language Camera ────────────────────────────────────────────────────
function SignLanguageCamera() {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const [camStatus,  setCamStatus]  = useState<'loading' | 'ready' | 'error'>('loading')
  const [signStatus, setSignStatus] = useState<'idle' | 'detecting' | 'processing'>('idle')
  const [capturedText, setCapturedText] = useState('')
  const [aiReply,  setAiReply]  = useState('')
  const [aiStatus, setAiStatus] = useState<'idle' | 'thinking' | 'speaking'>('idle')
  const streamRef       = useRef<MediaStream | null>(null)
  const prevFrameRef    = useRef<ImageData | null>(null)
  const motionTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const histRef         = useRef<{ role: 'user' | 'model'; content: string }[]>([])
  const isMounted       = useRef(true)

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamStatus('error')
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
      .then(stream => {
        streamRef.current = stream
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
        setCamStatus('ready')
      })
      .catch(() => setCamStatus('error'))
    return () => {
      isMounted.current = false
      streamRef.current?.getTracks().forEach(t => t.stop())
      if (motionTimerRef.current) clearTimeout(motionTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (camStatus !== 'ready' || signStatus !== 'idle') return
    const iv = setInterval(() => {
      if (!videoRef.current || !canvasRef.current || !isMounted.current) return
      const ctx = canvasRef.current.getContext('2d')!
      const W = 160, H = 120
      canvasRef.current.width = W; canvasRef.current.height = H
      ctx.drawImage(videoRef.current, 0, 0, W, H)
      const curr = ctx.getImageData(0, 0, W, H)
      if (prevFrameRef.current) {
        let diff = 0
        for (let i = 0; i < curr.data.length; i += 4)
          diff += Math.abs(curr.data[i] - prevFrameRef.current.data[i]) +
                  Math.abs(curr.data[i + 1] - prevFrameRef.current.data[i + 1]) +
                  Math.abs(curr.data[i + 2] - prevFrameRef.current.data[i + 2])
        if (diff / (W * H * 3) > 12) {
          if (motionTimerRef.current) clearTimeout(motionTimerRef.current)
          setSignStatus('detecting')
          motionTimerRef.current = setTimeout(() => { if (isMounted.current) captureAndInterpret() }, 1500)
        }
      }
      prevFrameRef.current = curr
    }, 150)
    return () => clearInterval(iv)
  }, [camStatus, signStatus])

  const captureAndInterpret = async () => {
    if (!videoRef.current || !canvasRef.current || !isMounted.current) return
    setSignStatus('processing')
    const canvas = canvasRef.current
    canvas.width = 640; canvas.height = 480
    canvas.getContext('2d')!.drawImage(videoRef.current, 0, 0, 640, 480)
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
    try {
      const { text } = await (await fetch('/api/sign-language', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      })).json()
      if (!isMounted.current) return
      setCapturedText(text)
      setAiStatus('thinking')
      histRef.current = [...histRef.current, { role: 'user', content: text }]
      const { reply } = await (await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: histRef.current.slice(0, -1) }),
      })).json()
      if (!isMounted.current) return
      setAiReply(reply)
      histRef.current = [...histRef.current, { role: 'model', content: reply }]
      setAiStatus('speaking')
      await speakReply(reply)
      if (isMounted.current) { setAiStatus('idle'); setSignStatus('idle'); prevFrameRef.current = null }
    } catch {
      if (isMounted.current) { setSignStatus('idle'); setAiStatus('idle') }
    }
  }

  if (camStatus === 'error') return (
    <div className="flex-1 flex items-center justify-center text-center px-8">
      <div>
        <p className="text-5xl mb-4">📷</p>
        <p className="text-white font-bold text-lg mb-2">Camera access required</p>
        <p className="text-gray-400 text-sm">Please allow camera access in your browser to use sign language mode. This requires a secure (HTTPS) connection.</p>
      </div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
      <div className="relative w-full max-w-lg rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-2xl">
        <video ref={videoRef} autoPlay muted playsInline className="w-full aspect-video object-cover bg-black" style={{ transform: 'scaleX(-1)' }} />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-center text-sm font-medium">
          {camStatus === 'loading' && <span className="text-white/60">Starting camera...</span>}
          {signStatus === 'idle'      && camStatus === 'ready' && <span className="text-white">🤲 Make a sign — I'm watching</span>}
          {signStatus === 'detecting' && <span className="text-emerald-400 animate-pulse">Movement detected — hold still...</span>}
          {signStatus === 'processing'&& <span className="text-blue-400">🔄 Interpreting your sign...</span>}
        </div>
      </div>
      {(capturedText || aiReply) && (
        <div className="w-full max-w-lg space-y-2">
          {capturedText && (
            <div className="bg-white/10 rounded-xl px-4 py-3 text-sm text-white border border-white/10">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1">Your Sign</span>
              {capturedText}
            </div>
          )}
          {aiReply && (
            <div className="bg-blue-600/20 rounded-xl px-4 py-3 text-sm text-white border border-blue-500/30">
              <span className="text-[10px] text-blue-400 uppercase tracking-wide block mb-1">
                AURA {aiStatus === 'speaking' ? '🔊' : aiStatus === 'thinking' ? '💭' : ''}
              </span>
              {aiReply}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function KioskAssistant() {
  return (
    <Suspense fallback={<div className="h-full bg-[#0a0a0a] flex items-center justify-center text-white">Loading…</div>}>
      <KioskAssistantInner />
    </Suspense>
  )
}

function KioskAssistantInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const initMode: Mode = searchParams.get('mode') === 'sign' ? 'sign' : 'select'
  const [mode, setMode] = useState<Mode>(initMode)

  // All hooks declared up-front (no hooks after conditional returns)
  const [messages,  setMessages]  = useState<{ role: 'user' | 'model'; content: string; action?: any }[]>([])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const chatEndRef  = useRef<HTMLDivElement>(null)
  const [qrTextUrl,  setQrTextUrl]  = useState('')
  const [qrVoiceUrl, setQrVoiceUrl] = useState('')
  const [lang] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('aura-language') || 'en' : 'en'
  )

  useEffect(() => {
    if (mode !== 'text' && mode !== 'voice') return
    fetch('/api/host').then(r => r.json()).then(async ({ host, origin }) => {
      if (mode === 'text') {
        const qr = await QRCode.toDataURL(`http://${host}/patient/assistant`, { width: 200, margin: 1, color: { dark: '#003d73', light: '#ffffff' } })
        setQrTextUrl(qr)
      } else {
        const base = origin || `http://${host}`
        const qr = await QRCode.toDataURL(`${base}/patient/assistant?voice=true`, { width: 280, margin: 1, color: { dark: '#0a0a0a', light: '#ffffff' } })
        setQrVoiceUrl(qr)
      }
    }).catch(console.error)
  }, [mode])

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
        body: JSON.stringify({ message: userMsg, history: messages, language: lang }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'model', content: data.reply || "I'm having trouble right now.", action: data.action }])
    } catch {
      setMessages(prev => [...prev, { role: 'model', content: 'Network error. Please try again.' }])
    }
    setLoading(false)
  }

  // ─── Select mode ────────────────────────────────────────────────────────
  if (mode === 'select') {
    return (
      <div className="flex flex-col h-full bg-[#0a0a0a]">
        <header className="px-6 py-5 flex items-center gap-4 border-b border-[#222]">
          <button onClick={() => router.push('/kiosk/menu')} className="p-3 rounded-2xl bg-[#111] text-white hover:bg-[#222] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">How would you like to interact?</h1>
            <p className="text-gray-400 mt-1">Choose text, voice, or sign language.</p>
          </div>
        </header>
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-6 gap-6 max-w-5xl mx-auto w-full">
          <button onClick={() => setMode('text')} className="flex-1 w-full bg-[#111] hover:bg-[#1a1a1a] border border-[#222] rounded-3xl p-8 flex flex-col items-center justify-center gap-4 transition-all group">
            <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">💬</div>
            <h2 className="text-2xl font-black text-white mt-2">Text Assistant</h2>
            <p className="text-gray-400 text-center">Type your questions or scan a QR code to chat from your phone.</p>
          </button>
          <button onClick={() => setMode('voice')} className="flex-1 w-full bg-[#111] hover:bg-[#1a1a1a] border border-[#222] rounded-3xl p-8 flex flex-col items-center justify-center gap-4 transition-all group">
            <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">📱</div>
            <h2 className="text-2xl font-black text-white mt-2">Voice Call</h2>
            <p className="text-gray-400 text-center">Scan a QR code with your phone and speak to AURA privately.</p>
          </button>
          <button onClick={() => setMode('sign')} className="flex-1 w-full bg-[#111] hover:bg-[#1a1a1a] border border-[#222] rounded-3xl p-8 flex flex-col items-center justify-center gap-4 transition-all group">
            <div className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">🤲</div>
            <h2 className="text-2xl font-black text-white mt-2">Sign Language</h2>
            <p className="text-gray-400 text-center">Use your hands to sign. The camera interprets your message via AI.</p>
          </button>
        </div>
      </div>
    )
  }

  // ─── Sign language mode ──────────────────────────────────────────────────
  if (mode === 'sign') {
    return (
      <div className="flex flex-col h-full bg-[#0a0a0a]">
        <header className="px-6 py-5 flex items-center gap-4 border-b border-[#222]">
          <button onClick={() => setMode('select')} className="p-3 rounded-2xl bg-[#111] text-white hover:bg-[#222] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">Sign Language</h1>
            <p className="text-gray-400 text-sm mt-0.5">Sign your message — the camera will interpret it</p>
          </div>
        </header>
        <SignLanguageCamera />
      </div>
    )
  }

  // ─── Voice mode — QR code for patient's phone ──────────────────────────
  if (mode === 'voice') {
    return (
      <div className="flex flex-col h-full bg-[#0a0a0a]">
        <header className="px-6 py-5 flex items-center gap-4 border-b border-[#222]">
          <button onClick={() => setMode('select')} className="p-3 rounded-2xl bg-[#111] text-white hover:bg-[#222] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">Voice Call</h1>
            <p className="text-gray-400 text-sm mt-0.5">Scan with your phone to speak to AURA privately</p>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 overflow-y-auto">
          <div className="text-7xl animate-bounce">📱</div>
          <div className="text-center">
            <h2 className="text-3xl font-black text-white mb-3">Scan with your phone</h2>
            <p className="text-gray-400 max-w-sm leading-relaxed">Point your phone camera at the QR code below to start a private voice conversation with AURA.</p>
          </div>
          {qrVoiceUrl ? (
            <div className="p-5 bg-white rounded-3xl shadow-2xl border-4 border-white">
              <img src={qrVoiceUrl} alt="Voice Call QR Code" className="w-64 h-64" />
            </div>
          ) : (
            <div className="w-64 h-64 border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-white/30 text-sm">Generating QR code...</span>
            </div>
          )}
          <button onClick={() => router.push('/patient/assistant?voice=true')} className="text-white/30 text-xs underline underline-offset-2 hover:text-white/60 transition-colors">
            Or use this kiosk instead
          </button>
        </div>
      </div>
    )
  }

  // ─── Text mode ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a]">
      <header className="bg-gradient-to-r from-[#003d73] to-[#0077cc] px-5 py-4 flex items-center gap-4">
        <button onClick={() => setMode('select')} className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1">
          <h1 className="text-white font-black text-lg">Text Assistant</h1>
          <p className="text-white/70 text-xs">Ask me anything about the hospital.</p>
        </div>
      </header>
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        <div className="flex-1 flex flex-col items-center border-r border-gray-100 dark:border-[#222]">
          <div className="flex-1 w-full max-w-3xl overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
                <div className="w-20 h-20 rounded-full bg-[#003d73]/10 flex items-center justify-center text-4xl shadow-lg border border-[#003d73]/20">🤖</div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">Hello! I'm Aura.</h2>
                <p className="text-gray-500 max-w-sm text-sm">How can I help you today?</p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {['Where is the Pharmacy?', 'How do I book an appointment?', 'What are the visiting hours?'].map(q => (
                    <button key={q} onClick={() => setInput(q)} className="px-4 py-2 rounded-full border border-gray-200 dark:border-[#333] text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#111]">{q}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col w-full ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'bg-[#003d73] text-white rounded-br-sm' : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-900 dark:text-white rounded-bl-sm border border-gray-200 dark:border-[#333]'}`}>
                  <p className="whitespace-pre-wrap text-[15px]">{m.content}</p>
                </div>
                {m.action?.type === 'MAP' && (
                  <div className="mt-2 w-full max-w-sm rounded-xl overflow-hidden border border-gray-200 dark:border-[#333] shadow-sm ml-2">
                    <div className="bg-[#003d73] text-white px-4 py-2 text-sm font-bold flex justify-between items-center">
                      <span className="truncate">📍 {m.action.name}</span>
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${m.action.lat},${m.action.lng}`} target="_blank" className="bg-white/20 px-3 py-1 rounded-lg text-xs shrink-0 ml-2">Open Map</a>
                    </div>
                    <div className="h-32 bg-gray-200" style={{ background: `center/cover url('https://maps.googleapis.com/maps/api/staticmap?center=${m.action.lat},${m.action.lng}&zoom=17&size=400x150&markers=color:red%7C${m.action.lat},${m.action.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}')` }} />
                  </div>
                )}
                {m.action?.type === 'APPOINTMENT' && (
                  <div className="mt-2 w-full max-w-sm rounded-xl overflow-hidden border border-gray-200 dark:border-[#333] shadow-sm ml-2">
                    <div className="bg-emerald-600 text-white px-4 py-2 text-sm font-bold flex items-center gap-2">🎫 Appointment: {m.action.id}</div>
                    <div className="p-3 space-y-1 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1a1a1a]">
                      <p><span className="text-gray-400">Status:</span> <span className="font-bold">{m.action.status}</span></p>
                      <p><span className="text-gray-400">Doctor:</span> Dr. {m.action.doctor}</p>
                      {m.action.time && <p><span className="text-gray-400">Time:</span> {new Date(m.action.time).toLocaleString()}</p>}
                    </div>
                  </div>
                )}
                {m.action?.type === 'DOCTORS_LIST' && (
                  <div className="mt-2 w-full max-w-sm rounded-xl overflow-hidden border border-gray-200 dark:border-[#333] shadow-sm ml-2">
                    <div className="bg-blue-600 text-white px-4 py-2 text-sm font-bold flex items-center gap-2">👨‍⚕️ Available Doctors ({m.action.doctors?.length ?? 0})</div>
                    <div className="p-2 space-y-1.5 max-h-48 overflow-y-auto bg-white dark:bg-[#1a1a1a]">
                      {(m.action.doctors ?? []).map((d: any) => (
                        <div key={d.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#222] border border-gray-100 dark:border-[#333]">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${d.status === 'AVAILABLE' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 dark:text-white text-xs font-bold truncate">Dr. {d.name}</p>
                            <p className="text-gray-500 text-[10px] truncate">{d.specialty} · {d.department ?? 'General'} · Room {d.room ?? 'TBD'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {m.action?.type === 'BOOKING_CONFIRMED' && (
                  <div className="mt-2 w-full max-w-sm rounded-xl overflow-hidden border border-gray-200 dark:border-[#333] shadow-sm ml-2">
                    <div className="bg-emerald-600 text-white px-4 py-2 text-sm font-bold flex items-center gap-2">✅ Booking Confirmed!</div>
                    <div className="p-3 space-y-1.5 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1a1a1a]">
                      <div className="flex items-center gap-2"><span className="text-gray-400">Your Code:</span> <span className="font-black text-lg text-emerald-600 dark:text-emerald-400 tracking-widest">{m.action.code}</span></div>
                      <p><span className="text-gray-400">Doctor:</span> Dr. {m.action.doctor}</p>
                      {m.action.time && <p><span className="text-gray-400">Scheduled:</span> {new Date(m.action.time).toLocaleString()}</p>}
                      <p className="text-[10px] text-gray-400 pt-1">Remember this code to track your appointment</p>
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
          <form onSubmit={handleTextSubmit} className="w-full max-w-3xl p-4 bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-[#222]">
            <div className="flex gap-2 relative">
              <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Type your message..." disabled={loading} autoFocus
                className="flex-1 pl-4 pr-12 py-4 rounded-xl bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-[#0a0a0a] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
              <button type="submit" disabled={!input.trim() || loading} className="absolute right-2 top-2 bottom-2 aspect-square rounded-lg bg-[#003d73] hover:bg-[#002d57] text-white flex items-center justify-center disabled:opacity-50">
                <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
              </button>
            </div>
          </form>
        </div>
        <div className="hidden md:flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-[#111] w-80 shrink-0 text-center">
          <h3 className="font-black text-gray-900 dark:text-white mb-2">Chat on your Phone</h3>
          <p className="text-xs text-gray-500 mb-6 px-4">Scan to continue chatting while you walk.</p>
          {qrTextUrl ? (
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-200"><img src={qrTextUrl} alt="Chat QR Code" className="w-48 h-48" /></div>
          ) : (
            <div className="w-48 h-48 border-2 border-dashed border-gray-300 dark:border-[#333] rounded-2xl flex items-center justify-center"><span className="text-xs text-gray-400">Loading QR...</span></div>
          )}
        </div>
      </div>
    </div>
  )
}