import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API Key missing' }, { status: 500 })
    }

    const { message, history } = await request.json()

    // Fetch slim context to fit in prompt efficiently
    const [docs, deps] = await Promise.all([
      supabase.from('doctors').select('user:users!doctors_user_id_fkey(name), specialty, room_number'),
      supabase.from('departments').select('name, location, floor, open_time, close_time'),
    ])

    const systemPrompt = `You are Aura, the AI Receptionist for Mutare Provincial Hospital.
Be helpful, warm, concise, and professional. You are talking directly to a patient or visitor in the lobby.

Departments:
${deps.data?.map(d => `- ${d.name} (${d.floor}, ${d.location}). Hours: ${d.open_time}-${d.close_time}`).join('\n')}

Doctors:
${docs.data?.map((d: any) => `- Dr. ${d.user?.name} (${d.specialty}), Room ${d.room_number || 'TBD'}`).join('\n')}

Instructions:
1. Answer questions about the hospital, directions, and departments based on the given context.
2. If they want to book an appointment, instruct them to step back to the kiosk menu and select "Doctors & Appointments".
3. If they have a medical emergency, tell them to proceed immediately to Casualty/Emergency.
4. If you don't know the answer, politely tell them to ask a human at the reception desk.
5. Keep your answer conversational but brief (2-3 sentences max). Do not use markdown headers, just plain conversational text.
`

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt 
    })
    
    // Format history for Gemini
    const formattedHistory = (history || []).map((h: any) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }))

    const chat = model.startChat({
      history: formattedHistory,
    })

    const result = await chat.sendMessage(message)
    const response = await result.response

    return NextResponse.json({ reply: response.text() })
  } catch (err: any) {
    console.error('AI Chat Error:', err)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
