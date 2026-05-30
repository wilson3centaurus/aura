'use client'
/**
 * useVoicePipeline — VAD → Whisper STT → Groq LLM → ElevenLabs TTS (+ browser speech fallback)
 * Exposes analyserRef so VoiceChat can drive a live waveform via requestAnimationFrame.
 */

import { useState, useRef, useCallback, useEffect } from 'react'

export type VoicePhase = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'

export interface VoiceMessage {
  id: string
  role: 'user' | 'ai'
  text: string
  action?: any
}

const RMS_THRESHOLD = 0.012
// 600 ms silence → faster turn-taking
const SILENCE_MS = 600

// Native-language greetings for all 16 supported languages
const GREETINGS: Record<string, string> = {
  en: 'Mutare Provincial Hospital, this is AURA speaking. How can I help you today?',
  sn: 'Mauya paMutare Provincial Hospital. Ndiri AURA. Ndingakubatsirai sei nhasi?',
  nd: 'Siyakwamukela eMutare Provincial Hospital. Ngingu AURA. Ngingakusiza njani lamuhla?',
  xh: 'Wamkelekile eMutare Provincial Hospital. NdinguAURA. Ndingakunceda njani namhlanje?',
  st: 'O amohetswe Mutare Provincial Hospital. Ke AURA. Ke ka thusa joang kajeno?',
  ve: 'Ni khou ambiwa Mutare Provincial Hospital. Ndi AURA. Ndi nga ni thusa hani namusi?',
  ts: 'O amogetswe Mutare Provincial Hospital. Ke AURA. Ke ka go thusa jang gompieno?',
  ch: 'Mukutilandira Mutare Provincial Hospital. Ndine AURA. Ndingakuthandize bwanji lero?',
  to: 'Mwabukeni ku Mutare Provincial Hospital. Ndine AURA. Ndingatuliziyi bwanji lelo?',
  cb: 'Mauya kuMutare Provincial Hospital. Ndini AURA. Ndingabatsira sei nhasi?',
  kl: 'Dumela Mutare Provincial Hospital. Ke AURA. Ke ka thusa jang gompieno?',
  ko: 'Welcome to Mutare Provincial Hospital. I am AURA. How can I assist you today?',
  nm: 'Mauya ku Mutare Provincial Hospital. Ndine AURA. Ndingatuliziyi bwanji lelo?',
  na: 'Mauya ku Mutare Provincial Hospital. Ndini AURA. Ndingabatsira sei nhasi?',
  sh: 'Mauya ku Mutare Provincial Hospital. Ndini AURA. Ndingabatsira sei nhasi?',
  sl: 'Welcome to Mutare Provincial Hospital. I am AURA. How can I help you today?',
}

function getGreeting(language: string) {
  return GREETINGS[language] || GREETINGS.en
}

export function useVoicePipeline({ language = 'en' }: { language?: string } = {}) {
  const [phase,    setPhase]    = useState<VoicePhase>('idle')
  const [messages, setMessages] = useState<VoiceMessage[]>([])
  const [error,    setError]    = useState('')
  const [status,   setStatus]   = useState('')

  const activeRef   = useRef(false)
  const streamRef   = useRef<MediaStream | null>(null)
  const ctxRef      = useRef<AudioContext | null>(null)
  // Exposed so VoiceChat can drive a live waveform without triggering re-renders
  const analyserRef = useRef<AnalyserNode | null>(null)
  const historyRef  = useRef<{ role: string; content: string; action?: any }[]>([])
  const langRef     = useRef(language)

  useEffect(() => { langRef.current = language }, [language])

  const stop = useCallback(() => {
    activeRef.current = false
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    ctxRef.current?.close().catch(() => {})
    ctxRef.current    = null
    analyserRef.current = null
    setPhase('idle')
    setStatus('')
    setError('')
  }, [])

  const start = useCallback(async () => {
    setError('')
    setMessages([])
    historyRef.current = []
    setStatus('Requesting microphone…')

    if (!navigator.mediaDevices?.getUserMedia) {
      const onPhone = typeof window !== 'undefined' &&
        window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
      setError(onPhone
        ? 'Voice requires a secure connection. Open Chrome, tap the 🔒 icon in the address bar → Site Settings → Allow Microphone. If on the kiosk, access the page via http://localhost:3000 instead.'
        : 'Microphone not available. Try using Google Chrome or Microsoft Edge.')
      setPhase('error')
      return
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
    } catch (e: any) {
      setError(e.name === 'NotAllowedError' ? 'Microphone permission denied. Please allow mic access and try again.' : (e.message || 'Mic error'))
      setPhase('error')
      return
    }
    streamRef.current = stream

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new AudioCtx()
    ctxRef.current = ctx
    const source   = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 1024
    source.connect(analyser)
    analyserRef.current = analyser

    activeRef.current = true

    const mimeType =
      MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
      MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'

    // Speak text: tries ElevenLabs TTS first, falls back to browser speechSynthesis
    async function speakText(text: string): Promise<void> {
      try {
        const ttsRes = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, language: langRef.current }),
        })
        if (ttsRes.ok) {
          const url = URL.createObjectURL(await ttsRes.blob())
          return new Promise<void>(resolve => {
            const a = new Audio(url)
            a.onended = () => { URL.revokeObjectURL(url); resolve() }
            a.onerror = () => { URL.revokeObjectURL(url); resolve() }
            a.play().catch(() => resolve())
          })
        }
        console.warn('[TTS] HTTP', ttsRes.status, '-> browser speech fallback')
      } catch (e) {
        console.warn('[TTS] failed, using browser speech:', e)
      }
      return new Promise<void>(resolve => {
        if (!('speechSynthesis' in window)) { resolve(); return }
        window.speechSynthesis.cancel()
        const utter = new SpeechSynthesisUtterance(text)
        utter.rate  = 1.05
        utter.pitch = 1.0
        utter.onend   = () => resolve()
        utter.onerror = () => resolve()
        window.speechSynthesis.speak(utter)
      })
    }

    function listen() {
      if (!activeRef.current) return

      const chunks: Blob[]   = []
      let hasSpeech   = false
      let speechDurMs = 0
      let speechStart = 0
      let silenceTimer: ReturnType<typeof setTimeout> | null = null
      let vadId: ReturnType<typeof setInterval> | null = null

      const mr = new MediaRecorder(stream, { mimeType })
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
      mr.start(100)

      setPhase('listening')
      setStatus('Listening… speak naturally')

      const buf = new Float32Array(analyser.fftSize)

      vadId = setInterval(() => {
        if (!activeRef.current || !analyserRef.current) {
          if (vadId) clearInterval(vadId)
          return
        }
        analyserRef.current.getFloatTimeDomainData(buf)
        const rms = Math.sqrt(buf.reduce((s, v) => s + v * v, 0) / buf.length)

        if (rms > RMS_THRESHOLD) {
          if (!hasSpeech) { hasSpeech = true; speechStart = Date.now() }
          speechDurMs = Date.now() - speechStart
          if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null }
        } else if (hasSpeech && !silenceTimer) {
          silenceTimer = setTimeout(() => {
            if (vadId) { clearInterval(vadId); vadId = null }
            const dur = speechDurMs
            mr.onstop = () => {
              const blob = new Blob(chunks, { type: mimeType })
              processAudio(blob, dur)
            }
            mr.stop()
          }, SILENCE_MS)
        }
      }, 80)
    }

    async function processAudio(blob: Blob, speechDurMs: number) {
      if (!activeRef.current) return

      if (speechDurMs < 300 || blob.size < 1000) {
        if (activeRef.current) listen()
        return
      }

      setPhase('processing')
      setStatus('Transcribing…')

      let transcript = ''
      try {
        const form = new FormData()
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
        form.append('audio', blob, `speech.${ext}`)
        form.append('language', langRef.current)
        const res = await fetch('/api/whisper', { method: 'POST', body: form })
        if (res.ok) {
          const data = await res.json()
          transcript = (data.transcript || '').trim()
          console.log('[Whisper] transcript:', JSON.stringify(transcript))
        } else {
          console.error('[Whisper] HTTP', res.status)
        }
      } catch (e) {
        console.error('[Whisper] error:', e)
      }

      if (!transcript || transcript.length < 2) {
        setStatus('(Nothing heard, listening again…)')
        if (activeRef.current) listen()
        return
      }

      setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', text: transcript }])
      historyRef.current = [...historyRef.current, { role: 'user', content: transcript }]

      setStatus('Thinking…')
      let aiText   = "I'm sorry, I had trouble responding. Please try again."
      let aiAction: any = null
      try {
        const chatRes = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message:  transcript,
            history:  historyRef.current.slice(0, -1),
            language: langRef.current,
          }),
        })
        if (chatRes.ok) {
          const data = await chatRes.json()
          aiText   = data.reply  || aiText
          aiAction = data.action || null
          console.log('[AI] reply:', aiText, 'action:', aiAction)
        } else {
          console.error('[AI] HTTP', chatRes.status)
        }
      } catch (e) {
        console.error('[AI] error:', e)
      }

      setMessages(prev => [...prev, { id: `ai-${Date.now()}`, role: 'ai', text: aiText, action: aiAction }])
      historyRef.current = [...historyRef.current, { role: 'assistant', content: aiText, action: aiAction }]

      setPhase('speaking')
      setStatus('Speaking…')
      await speakText(aiText)

      if (activeRef.current) listen()
    }

    setPhase('processing')
    setStatus('Connecting…')

    const greeting = getGreeting(langRef.current)
    setMessages([{ id: 'ai-0', role: 'ai', text: greeting }])
    historyRef.current = [{ role: 'assistant', content: greeting }]

    await speakText(greeting)

    if (activeRef.current) listen()
  }, [stop])

  return { phase, messages, error, status, start, stop, analyserRef }
}
