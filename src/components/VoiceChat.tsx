'use client'

import { useRef, useEffect, useState } from 'react'
import AuraLogo from './AuraLogo'
import { useVoicePipeline } from './useVoicePipeline'

interface Props {
  onClose: () => void
  onNavigate: (href: string) => void
}

function MapCard({ action }: { action: any }) {
  const [qrUrl, setQrUrl] = useState('')
  const KIOSK_LAT = process.env.NEXT_PUBLIC_KIOSK_LAT || '-18.9718'
  const KIOSK_LNG = process.env.NEXT_PUBLIC_KIOSK_LNG || '32.6703'
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${KIOSK_LAT},${KIOSK_LNG}&destination=${action.lat},${action.lng}&travelmode=walking`

  useEffect(() => {
    import('qrcode').then(mod => {
      const QR = (mod as any).default ?? mod
      return QR.toDataURL(mapsUrl, { width: 140, margin: 1, color: { dark: '#003d73', light: '#ffffff' } })
    }).then(setQrUrl).catch(() => {})
  }, [mapsUrl])

  return (
    <div className="mt-2 rounded-2xl overflow-hidden border border-white/15 bg-white/5 max-w-[85%]">
      <div className="bg-blue-600/30 px-4 py-2 flex items-center gap-2">
        <span className="text-lg">📍</span>
        <span className="text-white font-bold text-sm flex-1 truncate">{action.name}</span>
      </div>
      <div className="p-3 flex gap-3">
        {qrUrl && (
          <div className="flex flex-col items-center gap-1">
            <img src={qrUrl} alt="QR" className="w-24 h-24 rounded-lg" />
            <span className="text-[9px] text-white/40">Scan for directions</span>
          </div>
        )}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 transition-colors">
            🗺️ Open Google Maps
          </a>
          <div className="text-[10px] text-white/40">
            Walking directions from kiosk
          </div>
        </div>
      </div>
    </div>
  )
}

function AppointmentCard({ action }: { action: any }) {
  return (
    <div className="mt-2 rounded-2xl overflow-hidden border border-white/15 bg-white/5 max-w-[85%]">
      <div className="bg-emerald-600/30 px-4 py-2 flex items-center gap-2">
        <span className="text-lg">🎫</span>
        <span className="text-white font-bold text-sm">Appointment: {action.id}</span>
      </div>
      <div className="p-3 space-y-1 text-xs text-white/70">
        <p><span className="text-white/40">Status:</span> <span className="font-bold text-white">{action.status}</span></p>
        <p><span className="text-white/40">Doctor:</span> Dr. {action.doctor}</p>
        {action.time && <p><span className="text-white/40">Time:</span> {new Date(action.time).toLocaleString()}</p>}
      </div>
    </div>
  )
}

function DoctorsListCard({ action }: { action: any }) {
  return (
    <div className="mt-2 rounded-2xl overflow-hidden border border-white/15 bg-white/5 max-w-[85%]">
      <div className="bg-blue-600/30 px-4 py-2 flex items-center gap-2">
        <span className="text-lg">👨‍⚕️</span>
        <span className="text-white font-bold text-sm">Available Doctors ({action.doctors?.length ?? 0})</span>
      </div>
      <div className="p-2 space-y-1.5 max-h-48 overflow-y-auto">
        {(action.doctors ?? []).map((d: any) => (
          <div key={d.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
            <div className={`w-2 h-2 rounded-full shrink-0 ${d.status === 'AVAILABLE' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">Dr. {d.name}</p>
              <p className="text-white/50 text-[10px] truncate">{d.specialty} · {d.department ?? 'General'} · Room {d.room ?? 'TBD'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BookingConfirmedCard({ action }: { action: any }) {
  const [qrUrl, setQrUrl] = useState('')

  useEffect(() => {
    let active = true
    fetch('/api/host')
      .then(res => res.json())
      .then(async ({ origin }) => {
        const base = origin || (typeof window !== 'undefined' ? window.location.origin : '')
        const trackUrl = `${base}/kiosk/track?qr=${action.code}`
        const mod = await import('qrcode')
        const QR = (mod as any).default ?? mod
        const dataUrl = await QR.toDataURL(trackUrl, { width: 140, margin: 1, color: { dark: '#003d73', light: '#ffffff' } })
        if (active) setQrUrl(dataUrl)
      })
      .catch(() => {})

    return () => { active = false }
  }, [action.code])

  return (
    <div className="mt-2 rounded-2xl overflow-hidden border border-white/15 bg-white/5 max-w-[85%]">
      <div className="bg-emerald-600/30 px-4 py-2 flex items-center gap-2">
        <span className="text-lg">✅</span>
        <span className="text-white font-bold text-sm">Booking Confirmed!</span>
      </div>
      <div className="p-3 space-y-2 text-xs text-white/70">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white/40">Your Code:</span>
          <span className="font-black text-xl text-emerald-400 tracking-widest">{action.code}</span>
        </div>
        <p><span className="text-white/40">Doctor:</span> Dr. {action.doctor}</p>
        {action.time && <p><span className="text-white/40">Scheduled:</span> {new Date(action.time).toLocaleString()}</p>}
        {qrUrl && (
          <div className="pt-1 flex flex-col items-start gap-1">
            <img src={qrUrl} alt="Track appointment QR" className="w-24 h-24 rounded-lg bg-white p-1" />
            <p className="text-[10px] text-white/40">Scan the QR to track on your phone</p>
          </div>
        )}
        <p className="text-[10px] text-white/40">Store this appointment number in your head mate if you prefer</p>
      </div>
    </div>
  )
}

export default function VoiceChat({ onClose, onNavigate }: Props) {
  const lang = typeof window !== 'undefined' ? (localStorage.getItem('aura-language') || 'en') : 'en'
  const { phase, messages, error, status, start, stop } = useVoicePipeline({ language: lang })

  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, status])

  const isActive = phase !== 'idle' && phase !== 'error'

  const barColor =
    phase === 'listening'  ? 'bg-emerald-400' :
    phase === 'speaking'   ? 'bg-blue-400'    :
    phase === 'processing' ? 'bg-yellow-400'  : 'bg-white/20'

  const barActive = phase === 'listening' || phase === 'speaking'

  return (
    <div
      className="fixed inset-0 z-[500] flex flex-col"
      style={{ background: 'linear-gradient(160deg, #050d1a 0%, #091525 60%, #050f1c 100%)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-3 shrink-0">
        <button
          onClick={() => { stop(); onClose() }}
          className="text-white/50 hover:text-white transition-colors text-sm font-medium flex items-center gap-1.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>

        <AuraLogo size={32} showText />

        {phase === 'listening' && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-semibold">Listening</span>
          </div>
        )}
        {phase === 'speaking' && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-blue-400 text-xs font-semibold">Speaking</span>
          </div>
        )}
        {phase === 'processing' && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-yellow-400 text-xs font-semibold">Processing</span>
          </div>
        )}
        {(phase === 'idle' || phase === 'error') && <div className="w-20" />}
      </div>

      {/* Conversation transcript — full scrollable log */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {messages.length === 0 && !isActive && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-5 py-10">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600/30 to-cyan-500/10 border border-blue-400/20 flex items-center justify-center">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.6" strokeLinecap="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-xl mb-1">AURA Voice Assistant</p>
              <p className="text-blue-400/60 text-sm leading-relaxed max-w-xs">
                Tap the mic below. AURA will greet you, then listen automatically.
                Everything said is shown on screen in real time.
              </p>
            </div>
            {error && <p className="text-red-400 text-sm px-4 mt-2">{error}</p>}
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-blue-600/40 border border-blue-400/30 flex items-center justify-center shrink-0 mb-0.5 text-[9px] font-black text-blue-300">
                  AI
                </div>
              )}
              <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white/8 text-blue-50 rounded-bl-sm border border-white/10'
              }`}>
                {msg.text}
              </div>
            </div>
            {/* Interactive action cards */}
            {msg.action?.type === 'MAP' && <MapCard action={msg.action} />}
            {msg.action?.type === 'APPOINTMENT' && <AppointmentCard action={msg.action} />}
            {msg.action?.type === 'DOCTORS_LIST' && <DoctorsListCard action={msg.action} />}
            {msg.action?.type === 'BOOKING_CONFIRMED' && <BookingConfirmedCard action={msg.action} />}
          </div>
        ))}

        {/* Live status */}
        {isActive && status && (
          <p className="text-center text-xs text-white/40 italic py-1">{status}</p>
        )}
        {isActive && error && (
          <p className="text-center text-xs text-red-400 py-1">{error}</p>
        )}
      </div>

      {/* Waveform */}
      <div className="px-8 py-3 shrink-0">
        <div className="flex items-end justify-center gap-[3px] h-10">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className={`w-[3px] rounded-full transition-all duration-150 ${barColor}`}
              style={barActive ? { height: `${20 + Math.abs(Math.sin(i * 0.8)) * 65}%` } : { height: '18%' }}
            />
          ))}
        </div>
      </div>

      {/* Button */}
      <div className="flex flex-col items-center gap-2 pb-10 shrink-0">
        {!isActive ? (
          <button
            onClick={start}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 hover:scale-105 active:scale-95 text-white shadow-2xl shadow-blue-500/30 transition-all duration-200 flex items-center justify-center"
            aria-label="Start voice call"
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>
        ) : (
          <button
            onClick={() => { stop(); onClose() }}
            aria-label="End voice call"
            className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 text-white shadow-2xl shadow-red-500/30 transition-all duration-200 flex items-center justify-center relative"
          >
            <span className="absolute inset-0 rounded-full border-2 border-red-400/50 animate-ping" />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M12 9.5c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.58c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 9.28 7.46 7.5 12 7.5s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.75 13.6 9.5 12 9.5z"/>
            </svg>
          </button>
        )}
        <p className="text-blue-400/40 text-[11px] tracking-wide">
          {isActive ? 'Tap to hang up' : 'Tap to start'}
        </p>
      </div>
    </div>
  )
}
