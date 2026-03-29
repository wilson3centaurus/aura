'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import AuraLogo from './AuraLogo'

const MOTION_THRESHOLD = 18
const CHECK_INTERVAL   = 900
const MOTION_DEBOUNCE  = 3

const GREETINGS = [
  { line1: 'Welcome to Mutare Provincial Hospital', line2: 'Mauya kuMutare Provincial Hospital', sub: "I'm AURA — your hospital service assistant." },
  { line1: 'Siyakwamukela eMutare Provincial Hospital', line2: 'Welcome!', sub: 'Touch the screen or speak to get started.' },
  { line1: 'Welcome!', line2: 'Mauya! Siyakwamukela!', sub: 'How can I help you today? Ndingakubatsira sei?' },
]

export default function PresenceDetector({ enabled = true }: { enabled?: boolean }) {
  const router    = useRouter()
  const pathname  = usePathname()
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prevData  = useRef<Uint8ClampedArray | null>(null)
  const lastActive = useRef<number>(Date.now())
  const motionCount = useRef<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef   = useRef<MediaStream | null>(null)

  const [showGreeting, setShowGreeting] = useState(false)
  const [wasPresent, setWasPresent]     = useState(false)
  const [greeting]  = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)])

  // Flag — read env at module level to avoid reading in render
  const videoDisabled = process.env.NEXT_PUBLIC_DISABLE_VIDEO === 'true'

  // Reset idle timer on any user interaction
  useEffect(() => {
    const resetIdle = () => { lastActive.current = Date.now() }
    window.addEventListener('pointerdown', resetIdle, { passive: true })
    window.addEventListener('touchstart', resetIdle, { passive: true })
    window.addEventListener('keydown', resetIdle, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', resetIdle)
      window.removeEventListener('touchstart', resetIdle)
      window.removeEventListener('keydown', resetIdle)
    }
  }, [])

  useEffect(() => { lastActive.current = Date.now() }, [pathname])

  const detectMotion = useCallback(() => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return

    const W = 160, H = 120
    canvas.width  = W
    canvas.height = H
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    ctx.drawImage(video, 0, 0, W, H)
    const imgData = ctx.getImageData(0, 0, W, H).data

    if (prevData.current) {
      const prev   = prevData.current
      const pixels = prev.length / 4
      let totalDiff = 0
      for (let i = 0; i < prev.length; i += 4) {
        totalDiff += (Math.abs(imgData[i] - prev[i]) + Math.abs(imgData[i + 1] - prev[i + 1]) + Math.abs(imgData[i + 2] - prev[i + 2])) / 3
      }
      const avgDiff = totalDiff / pixels

      if (avgDiff > MOTION_THRESHOLD) {
        motionCount.current++
        if (motionCount.current >= MOTION_DEBOUNCE) {
          const idleSeconds = Date.now() - lastActive.current
          lastActive.current = Date.now()
          if (!wasPresent) {
            setWasPresent(true)
            if (idleSeconds > 8_000) {
              setShowGreeting(true)
              setTimeout(() => setShowGreeting(false), 5000)
            }
          } else {
            lastActive.current = Date.now()
          }
        }
      } else {
        motionCount.current = 0
      }
    }
    prevData.current = new Uint8ClampedArray(imgData)
  }, [wasPresent, pathname, router])

  const detectRef = useRef(detectMotion)
  useEffect(() => { detectRef.current = detectMotion }, [detectMotion])

  useEffect(() => {
    // Do nothing when video is disabled via env flag
    if (videoDisabled || !enabled) return
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return

    let cancelled = false
    navigator.mediaDevices.getUserMedia({ video: { width: 160, height: 120, facingMode: 'user' } })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
        intervalRef.current = setInterval(() => detectRef.current(), CHECK_INTERVAL)
      })
      .catch(err => console.info('AURA presence detector: camera not available.', err.message))

    return () => {
      cancelled = true
      if (intervalRef.current) clearInterval(intervalRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [enabled, videoDisabled])

  // When disabled, render nothing
  if (videoDisabled) return null

  return (
    <>
      <video ref={videoRef} className="hidden" muted playsInline aria-hidden />
      <canvas ref={canvasRef} className="hidden" aria-hidden />
      {showGreeting && (
        <div className="greeting-overlay fixed inset-0 z-[300] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md pointer-events-none">
          <AuraLogo size={72} showText={false} />
          <div className="mt-6 text-center px-8">
            <h1 className="text-4xl font-black text-white leading-tight tracking-tight drop-shadow-lg">
              {greeting.line1}
            </h1>
            <h2 className="text-2xl font-semibold text-blue-200 mt-2 leading-snug">
              {greeting.line2}
            </h2>
            <p className="text-lg text-blue-300/80 mt-4 font-medium">
              {greeting.sub}
            </p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-40 h-40 rounded-full border-2 border-blue-400/20 animate-ping" />
          </div>
        </div>
      )}
    </>
  )
}
