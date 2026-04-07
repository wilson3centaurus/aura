import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ElevenLabs — Rachel voice (calm, professional, multilingual)
const EL_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'
const EL_MODEL    = 'eleven_multilingual_v2'

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'nova', speed = 1.0 } = await request.json()

    if (!text?.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    const clean = text.slice(0, 5000)

    // — ElevenLabs first (highest quality, multilingual) —
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${EL_VOICE_ID}`, {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text: clean,
            model_id: EL_MODEL,
            voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true },
          }),
        })
        if (elRes.ok) {
          const buffer = Buffer.from(await elRes.arrayBuffer())
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Cache-Control': 'no-store',
              'Content-Length': String(buffer.length),
            },
          })
        }
      } catch (elErr: any) {
        console.warn('ElevenLabs TTS failed, falling back to OpenAI:', elErr?.message)
      }
    }

    // — Fallback: OpenAI TTS —
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice as 'nova' | 'alloy' | 'echo' | 'fable' | 'onyx' | 'shimmer',
      input: clean.slice(0, 4096),
      speed: Math.min(Math.max(speed, 0.25), 4.0),
    })

    const buffer = Buffer.from(await mp3.arrayBuffer())
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
        'Content-Length': String(buffer.length),
      },
    })
  } catch (err: any) {
    console.error('TTS error:', err?.message)
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
  }
}
