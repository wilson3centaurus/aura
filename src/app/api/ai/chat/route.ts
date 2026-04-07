import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabase } from '@/lib/db'

// Groq: free LLM inference, OpenAI-compatible SDK
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})

const LANGUAGE_NAMES: Record<string, string> = {
  sn: 'Shona (ChiShona)', nd: 'Ndebele (isiNdebele)', to: 'Tonga (chiTonga)',
  cb: 'Chibarwe', kl: 'Kalanga', ko: 'Koisan', nm: 'Nambya', na: 'Ndau',
  sh: 'Shangani', st: 'Sesotho', ve: 'Tshivenda', xh: 'isiXhosa',
  ch: 'Chichewa', ts: 'Setswana', en: 'English',
}

export async function POST(request: NextRequest) {
  try {
    const { message, history, language } = await request.json()

    if (!message?.trim()) {
      return NextResponse.json({ reply: "I didn't catch that. Could you try again?" })
    }

    const [docsRes, depsRes] = await Promise.all([
      supabase.from('doctors').select('user:users!doctors_user_id_fkey(name), specialty, room_number, status').neq('status', 'OFFLINE'),
      supabase.from('departments').select('name, location, floor, open_time, close_time'),
    ])

    const langName = language && language !== 'en' ? LANGUAGE_NAMES[language] : null

    const systemPrompt = `You are AURA, a real hospital receptionist at Mutare Provincial Hospital in Zimbabwe — you answer the phone like a real person, not an AI.
You sound like a friendly, confident call-centre agent who genuinely cares and also has a good sense of humour. Think: warm, quick, a little cheeky — like the receptionist everyone loves because she actually helps and makes you laugh.

HOW YOU SPEAK (very important — your output is read aloud):
- Short, natural sentences. No lists, no markdown, no asterisks. Plain speech only.
- Give SPECIFIC verbal directions: "Walk straight past the main entrance, take the first corridor on your left, you'll see it right there — can't miss it." Not just "go to the ward".
- Ask follow-up questions naturally: "Are you coming in from the main gate or the car park side?" or "Is it for yourself or someone else?"
- Small talk is fine — if someone says "how are you", reply like a human, then bring them back warmly.
- Occasional light humour is great: "The toilets? Yes, we keep those well hidden — just kidding, go straight down the hall..."
- NEVER say "As an AI" or "I am a language model". You're AURA, a hospital staff member on the phone.
- Vary your sentence starters. Don't begin every reply with "I" or "Sure" or "Of course".
- Max 2 sentences per reply. Short and punchy — the caller is standing at a kiosk.
${langName ? `IMPORTANT: The patient speaks ${langName}. Respond entirely in ${langName}. Even if they write in English, reply in ${langName}.` : ''}

Hospital info:
${depsRes.data?.map(d => `- ${d.name}: ${d.floor ?? 'ground floor'}, ${d.location ?? 'main building'}. Open ${d.open_time ?? '08:00'}–${d.close_time ?? '16:00'}`).join('\n') ?? 'Tell them to check with reception.'}

Doctors on call now:
${docsRes.data?.map((d: any) => `- Dr. ${d.user?.name}, ${d.specialty}, Room ${d.room_number ?? 'TBD'} (${d.status})`).join('\n') ?? 'Tell them to ask at reception.'}

Rules:
1. Bookings: "Head back to the main kiosk screen and tap 'See a Doctor' — it only takes a minute."
2. Directions: Also call show_map AND give a verbal turn-by-turn hint in your reply.
3. Appointment tracking: ask for their 4-letter code (like AB12), then call check_appointment.
5. NEVER output raw function call tags like <function=...> in your reply text. Use the proper tool mechanism — never type function syntax in your response.`

    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'show_map',
          description: 'Shows a map on screen to help the patient navigate to a hospital department or facility',
          parameters: { type: 'object', properties: { location_name: { type: 'string', description: 'Name of the department or place' } }, required: ['location_name'] },
        },
      },
      {
        type: 'function',
        function: {
          name: 'check_appointment',
          description: "Looks up a patient's appointment using their 4-character tracking code",
          parameters: { type: 'object', properties: { code: { type: 'string', description: '4-character alphanumeric appointment code e.g. AB12' } }, required: ['code'] },
        },
      },
    ]

    const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...((history || []) as any[]).map((h: any) => ({
        role: (h.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: String(h.content || h.text || ''),
      })),
      { role: 'user', content: message.slice(0, 1000) },
    ]

    let aiResponse = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: chatMessages,
      tools,
      tool_choice: 'auto',
      max_tokens: 200,
      temperature: 0.9,
    })

    let actionPayload: any = null
    const toolCalls = aiResponse.choices[0].message.tool_calls

    if (toolCalls?.length) {
      const call = toolCalls[0] as any
      const args = JSON.parse(call.function.arguments)
      let toolResult = ''

      if (call.function.name === 'show_map') {
        const { data } = await supabase.from('departments').select('name, latitude, longitude, location, floor').ilike('name', `%${args.location_name}%`).limit(1).single()
        if (data?.latitude) {
          toolResult = `Found: ${data.name} on ${data.floor ?? 'ground floor'}, ${data.location ?? 'main building'}. Map is now shown on screen.`
          actionPayload = { type: 'MAP', name: data.name, lat: data.latitude, lng: data.longitude }
        } else {
          toolResult = `No GPS coordinates found for "${args.location_name}". Provide verbal directions and suggest asking at reception.`
        }
      } else if (call.function.name === 'check_appointment') {
        const { data } = await supabase.from('appointments').select(`qr_code, status, scheduled_at, doctor:doctors!appointments_doctor_id_fkey(user:users!doctors_user_id_fkey(name))`).eq('qr_code', (args.code || '').toUpperCase()).single()
        if (data) {
          const doctorName = (data.doctor as any)?.user?.name ?? 'your doctor'
          toolResult = `Appointment found. Code: ${data.qr_code}. Status: ${data.status}. Doctor: Dr. ${doctorName}. Scheduled: ${data.scheduled_at ? new Date(data.scheduled_at).toLocaleString() : 'time not set'}.`
          actionPayload = { type: 'APPOINTMENT', id: data.qr_code, status: data.status, doctor: doctorName, time: data.scheduled_at }
        } else {
          toolResult = `No appointment found with code "${args.code}". Ask them to double-check their 4-character code.`
        }
      }

      aiResponse = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          ...chatMessages,
          aiResponse.choices[0].message,
          { role: 'tool', tool_call_id: call.id, content: toolResult },
        ],
        max_tokens: 200,
        temperature: 0.9,
      })
    }

    const rawReply = aiResponse.choices[0]?.message?.content?.trim() || "I'm here to help. What do you need today?"
    // Strip any leaked function-call syntax (Llama occasionally outputs <function=...> in the text)
    const reply = rawReply.replace(/<function=[^>]*>[\s\S]*?<\/function>/gi, '').replace(/\s+/g, ' ').trim()
      || "I'm here to help. What do you need today?"
    return NextResponse.json({ reply, action: actionPayload })
  } catch (err: any) {
    console.error('AI Chat error:', err?.message)
    return NextResponse.json({ reply: "I'm sorry, I'm having a bit of trouble right now. Please try again." })
  }
}