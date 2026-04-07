import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Groq offers a free Whisper API (whisper-large-v3-turbo) compatible with the OpenAI SDK
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const audio = form.get('audio') as File | null
    const language = (form.get('language') as string) || 'en'

    if (!audio) return NextResponse.json({ error: 'No audio' }, { status: 400 })
    if (audio.size < 200) return NextResponse.json({ transcript: '' })

    const transcription = await groq.audio.transcriptions.create({
      file: audio,
      model: 'whisper-large-v3-turbo',
      // Only lock language for English; let Whisper auto-detect for Shona/Ndebele/etc.
      ...(language === 'en' ? { language: 'en' } : {}),
    })

    return NextResponse.json({ transcript: (transcription.text || '').trim() })
  } catch (err: any) {
    console.error('[Whisper] error:', err?.message)
    return NextResponse.json({ error: 'Transcription failed', detail: err?.message }, { status: 500 })
  }
}
