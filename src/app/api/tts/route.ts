import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openAiKey = process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY
const openai    = new OpenAI({ apiKey: openAiKey })

// ElevenLabs — Rachel voice (calm, professional, multilingual)
const EL_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'
const EL_MODEL    = 'eleven_turbo_v2_5'

/** Wrap raw PCM (LINEAR16) bytes in a minimal WAV container so browsers can play it. */
function pcmToWav(pcm: Buffer, sampleRate = 24_000, channels = 1, bitsPerSample = 16): Buffer {
  const dataSize  = pcm.length
  const header    = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + dataSize, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)                                       // PCM
  header.writeUInt16LE(channels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28)
  header.writeUInt16LE(channels * (bitsPerSample / 8), 32)
  header.writeUInt16LE(bitsPerSample, 34)
  header.write('data', 36)
  header.writeUInt32LE(dataSize, 40)
  return Buffer.concat([header, pcm])
}

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'nova', speed = 1.0 } = await request.json()

    if (!text?.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    const clean = text.slice(0, 5000)
    const warnings: string[] = []

    function audioResponse(buffer: Buffer, contentType: string) {
      const headers: Record<string, string> = {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
        'Content-Length': String(buffer.length),
      }
      if (warnings.length) headers['X-TTS-Warning'] = warnings.join(',')
      return new NextResponse(buffer, { headers })
    }

    // ── 1. ElevenLabs (best quality, multilingual) ──────────────────────────
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
          return audioResponse(buffer, 'audio/mpeg')
        }
        if (elRes.status === 402) {
          warnings.push('elevenlabs:quota_exceeded')
          console.warn('ElevenLabs TTS HTTP 402 — quota exceeded, trying Gemini')
        } else {
          warnings.push(`elevenlabs:error_${elRes.status}`)
          console.warn('ElevenLabs TTS HTTP', elRes.status, '— trying Gemini')
        }
      } catch (elErr: any) {
        warnings.push('elevenlabs:network_error')
        console.warn('ElevenLabs TTS error:', elErr?.message, '— trying Gemini')
      }
    }

    // ── 2. Gemini TTS (free-tier friendly, returns PCM → wrapped as WAV) ────
    if (process.env.GEMINI_API_KEY) {
      try {
        const gemRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: clean.slice(0, 5000) }] }],
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } } },
              },
            }),
          },
        )
        if (gemRes.ok) {
          const data = await gemRes.json()
          const b64  = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data as string | undefined
          if (b64) {
            const wav = pcmToWav(Buffer.from(b64, 'base64'))
            return audioResponse(wav, 'audio/wav')
          }
        }
        if (gemRes.status === 402 || gemRes.status === 429) warnings.push(`gemini:quota_exceeded`)
        else warnings.push(`gemini:error_${gemRes.status}`)
        console.warn('Gemini TTS HTTP', gemRes.status, '— trying OpenAI')
      } catch (gemErr: any) {
        warnings.push('gemini:network_error')
        console.warn('Gemini TTS error:', gemErr?.message, '— trying OpenAI')
      }
    }

    // ── 3. OpenAI TTS (last resort) ─────────────────────────────────────────
    if (openAiKey) {
      try {
        const mp3 = await openai.audio.speech.create({
          model: 'tts-1',
          voice: voice as 'nova' | 'alloy' | 'echo' | 'fable' | 'onyx' | 'shimmer',
          input: clean.slice(0, 4096),
          speed: Math.min(Math.max(speed, 0.25), 4.0),
        })
        const buffer = Buffer.from(await mp3.arrayBuffer())
        return audioResponse(buffer, 'audio/mpeg')
      } catch (oaErr: any) {
        const msg = String(oaErr?.message || '')
        if (msg.includes('429') || msg.includes('quota') || msg.includes('insufficient_quota')) {
          warnings.push('openai:quota_exceeded')
        } else {
          warnings.push('openai:error')
        }
        console.warn('OpenAI TTS error:', oaErr?.message)
      }
    }

    // All TTS providers failed — client will use browser speechSynthesis
    return NextResponse.json(
      { error: 'All TTS providers unavailable', warnings },
      { status: 503, headers: warnings.length ? { 'X-TTS-Warning': warnings.join(',') } : {} },
    )
  } catch (err: any) {
    console.error('TTS route error:', err?.message)
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
  }
}
