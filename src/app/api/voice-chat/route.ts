import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are AURA, the friendly AI assistant at Mutare Provincial Hospital in Zimbabwe.
You help patients navigate the hospital. 
Keep responses SHORT (1-2 sentences) â€” the response will be spoken aloud to a patient at a kiosk.
If the patient's request clearly maps to a kiosk section, include a JSON navigation hint at the end like: [NAVIGATE:/kiosk/doctors]
Available routes: /kiosk/doctors, /kiosk/medication, /kiosk/symptoms, /kiosk/visit, /kiosk/facilities, /kiosk/information, /kiosk/queue
Respond in the same language the patient uses. Be warm, calm, and professional.
Do NOT include [NAVIGATE:...] unless navigation is clearly needed.`

export async function POST(request: Request) {
  try {
    const { message } = await request.json()
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ reply: "I didn't catch that. Could you try again?" })
    }

    const safeMessage = message.slice(0, 500).trim()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(fallbackResponse(safeMessage))
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: safeMessage },
      ],
      max_tokens: 150,
      temperature: 0.7,
    })

    const raw = response.choices[0]?.message?.content ?? ''
    const navMatch = raw.match(/\[NAVIGATE:([^\]]+)\]/)
    const reply = raw.replace(/\[NAVIGATE:[^\]]+\]/g, '').trim()
    const navigate = navMatch?.[1] ?? undefined

    return NextResponse.json({ reply, navigate })
  } catch (err) {
    console.error('voice-chat error', err)
    return NextResponse.json(fallbackResponse(typeof (await (request as any).json?.()) === 'object' ? '' : ''))
  }
}

function fallbackResponse(message: string): { reply: string; navigate?: string } {
  const m = message.toLowerCase()
  if (m.includes('doctor') || m.includes('chiremba') || m.includes('sick') || m.includes('pain'))
    return { reply: "I'll take you to our doctors directory right away.", navigate: '/kiosk/doctors' }
  if (m.includes('medic') || m.includes('pill') || m.includes('mushonga') || m.includes('pharmacy'))
    return { reply: 'Heading to the pharmacy and medication section.', navigate: '/kiosk/medication' }
  if (m.includes('symptom') || m.includes('fever') || m.includes('cough'))
    return { reply: "Let's check your symptoms and find the right care.", navigate: '/kiosk/symptoms' }
  if (m.includes('visit') || m.includes('admitted') || m.includes('relative'))
    return { reply: 'I can help you find an admitted patient.', navigate: '/kiosk/visit' }
  if (m.includes('toilet') || m.includes('bathroom') || m.includes('facilit') || m.includes('where'))
    return { reply: "I'll show you a map of the hospital facilities.", navigate: '/kiosk/facilities' }
  if (m.includes('fee') || m.includes('cost') || m.includes('price') || m.includes('pay'))
    return { reply: "Here's the hospital fee and cost information.", navigate: '/kiosk/information' }
  if (m.includes('queue') || m.includes('wait') || m.includes('ticket'))
    return { reply: "Let me check your queue position.", navigate: '/kiosk/queue' }
  return { reply: "I'm AURA, your hospital assistant. I can help you see a doctor, find facilities, check medications, and more. What do you need today?" }
}
