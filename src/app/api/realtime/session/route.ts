import { NextRequest, NextResponse } from 'next/server'

/**
 * Creates an OpenAI Realtime API ephemeral token.
 * The client uses this short-lived token to connect directly to OpenAI via WebRTC,
 * avoiding the need to expose the real API key in the browser.
 */

const LANGUAGE_NAMES: Record<string, string> = {
  sn: 'Shona (ChiShona)',
  nd: 'Ndebele (isiNdebele)',
  to: 'Tonga (chiTonga)',
  cb: 'Chibarwe',
  kl: 'Kalanga',
  ko: 'English',
  nm: 'Nambya',
  na: 'Ndau',
  sh: 'Shangani (Tsonga)',
  st: 'Sesotho',
  ve: 'Tshivenda',
  xh: 'isiXhosa',
  ch: 'Chichewa',
  ts: 'Setswana',
  en: 'English',
  sl: 'English',
}

export async function POST(request: NextRequest) {
  const { language = 'en' } = await request.json().catch(() => ({}))
  const langName = LANGUAGE_NAMES[language] || 'English'

  const res = await fetch('https://api.openai.com/v1/realtime/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-realtime-preview',
      voice: 'shimmer',
      instructions: `You are AURA, the friendly AI receptionist at Mutare Provincial Hospital in Zimbabwe.
Help patients with: finding departments and wards, booking or checking appointments (ask for their 4-character code like "AB12"), pharmacy and medication questions, visiting admitted relatives, medical fees, and general hospital information.
Be warm, concise (2–3 sentences per response), and conversational — your words are spoken aloud so avoid bullet points, lists, or markdown.
If asked for directions to a place inside the hospital, describe the route verbally in simple terms.
Always respond in ${langName}.`,
      input_audio_transcription: { model: 'whisper-1' },
      turn_detection: {
        type: 'server_vad',
        silence_duration_ms: 700,
        threshold: 0.5,
        prefix_padding_ms: 300,
      },
    }),
  })

  if (!res.ok) {
    const detail = await res.text()
    console.error('OpenAI Realtime session error:', res.status, detail)
    return NextResponse.json(
      { error: 'Failed to create realtime session', detail },
      { status: res.status }
    )
  }

  return NextResponse.json(await res.json())
}
