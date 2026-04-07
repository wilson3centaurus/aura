'use client'
/**
 * useRealtimeSession – React hook for OpenAI Realtime API (WebRTC).
 *
 * Flow:
 *  1. POST /api/realtime/session → get ephemeral key (keeps real API key server-side)
 *  2. Create RTCPeerConnection + get microphone
 *  3. Send SDP offer to OpenAI Realtime endpoint with the ephemeral key
 *  4. Set remote SDP answer → WebRTC connected
 *  5. Audio flows directly browser ↔ OpenAI; text events arrive via data channel
 */

import { useState, useRef, useCallback, useEffect } from 'react'

export type RealtimePhase = 'idle' | 'connecting' | 'connected' | 'error'

export interface RealtimeMessage {
  id: string
  role: 'user' | 'ai'
  text: string
}

interface Options {
  language?: string
}

export function useRealtimeSession({ language = 'en' }: Options = {}) {
  const [phase, setPhase] = useState<RealtimePhase>('idle')
  const [messages, setMessages] = useState<RealtimeMessage[]>([])
  const [aiSpeaking, setAiSpeaking] = useState(false)
  const [userSpeaking, setUserSpeaking] = useState(false)
  const [error, setError] = useState('')

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const isMounted = useRef(true)
  const currentAiId = useRef('')
  const currentAiText = useRef('')
  // Keep latest language in a ref so connect() doesn't go stale
  const langRef = useRef(language)
  useEffect(() => { langRef.current = language }, [language])

  useEffect(() => {
    return () => {
      isMounted.current = false
      pcRef.current?.close()
    }
  }, [])

  const handleEvent = useCallback((raw: string) => {
    if (!isMounted.current) return
    let msg: any
    try { msg = JSON.parse(raw) } catch { return }

    switch (msg.type) {
      // User started / stopped speaking
      case 'input_audio_buffer.speech_started':
        setUserSpeaking(true)
        setAiSpeaking(false)
        break
      case 'input_audio_buffer.speech_stopped':
        setUserSpeaking(false)
        break

      // User speech transcription (shown as user bubble)
      case 'conversation.item.input_audio_transcription.completed': {
        const text = (msg.transcript || '').trim()
        if (text) {
          setMessages(prev => [
            ...prev,
            { id: msg.item_id || `u-${Date.now()}`, role: 'user', text },
          ])
        }
        break
      }

      // AI response starts — add placeholder bubble
      case 'response.created':
        setAiSpeaking(true)
        currentAiText.current = ''
        currentAiId.current = msg.response?.id || `ai-${Date.now()}`
        setMessages(prev => [
          ...prev,
          { id: currentAiId.current, role: 'ai', text: '' },
        ])
        break

      // Streaming AI text
      case 'response.audio_transcript.delta':
        currentAiText.current += msg.delta || ''
        setMessages(prev =>
          prev.map(m =>
            m.id === currentAiId.current
              ? { ...m, text: currentAiText.current }
              : m
          )
        )
        break

      case 'response.audio_transcript.done':
      case 'response.done':
        setAiSpeaking(false)
        break

      case 'error':
        console.error('OpenAI Realtime error event:', msg.error)
        if (msg.error?.code !== 'session_expired') {
          setError(msg.error?.message || 'An error occurred during the session.')
        }
        break
    }
  }, [])

  const connect = useCallback(async () => {
    if (pcRef.current) pcRef.current.close()
    setPhase('connecting')
    setError('')
    setMessages([])
    setAiSpeaking(false)
    setUserSpeaking(false)
    currentAiId.current = ''
    currentAiText.current = ''

    try {
      // 1. Ephemeral key from our server (keeps OPENAI_API_KEY server-side)
      const sessionRes = await fetch('/api/realtime/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: langRef.current }),
      })
      if (!sessionRes.ok) {
        const err = await sessionRes.json().catch(() => ({}))
        throw new Error(err.error || `Session error: ${sessionRes.status}`)
      }
      const { client_secret } = await sessionRes.json()
      if (!client_secret?.value) throw new Error('No ephemeral key in response')

      // 2. Peer connection
      const pc = new RTCPeerConnection()
      pcRef.current = pc

      // 3. Remote audio plays through a hidden <audio> element
      const audioEl = document.createElement('audio')
      audioEl.autoplay = true
      audioElRef.current = audioEl
      pc.ontrack = e => { audioEl.srcObject = e.streams[0] }

      // 4. Microphone track
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => pc.addTrack(t, stream))

      // 5. Data channel for text events
      const dc = pc.createDataChannel('oai-events')
      dc.onmessage = e => handleEvent(e.data)

      // 6. SDP offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // 7. Send to OpenAI Realtime; receive SDP answer
      const sdpRes = await fetch(
        'https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${client_secret.value}`,
            'Content-Type': 'application/sdp',
          },
          body: offer.sdp,
        }
      )
      if (!sdpRes.ok) throw new Error(`WebRTC negotiation failed (${sdpRes.status})`)

      // 8. Complete handshake
      const sdpAnswer = await sdpRes.text()
      await pc.setRemoteDescription({ type: 'answer', sdp: sdpAnswer })

      if (!isMounted.current) { pc.close(); return }
      setPhase('connected')
    } catch (err: any) {
      if (!isMounted.current) return
      console.error('Realtime connect error:', err)
      setError(err.message || 'Connection failed. Check API key and network.')
      setPhase('error')
    }
  }, [handleEvent])

  const disconnect = useCallback(() => {
    pcRef.current?.close()
    pcRef.current = null
    if (audioElRef.current) {
      audioElRef.current.srcObject = null
      audioElRef.current = null
    }
    setPhase('idle')
    setAiSpeaking(false)
    setUserSpeaking(false)
  }, [])

  return {
    phase,
    messages,
    aiSpeaking,
    userSpeaking,
    error,
    connect,
    disconnect,
  }
}
