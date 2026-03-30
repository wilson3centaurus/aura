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
3. If the user asks for directions to a specific place (e.g. Pharmacy, Toilet), call the get_department_location tool so you can show them a GPS map.
4. If they want to check their appointment status, ask for their 4-character appointment ID (e.g. AB12), and use the check_appointment_status tool.
5. Keep your answer conversational but brief (2-3 sentences max). Do not use markdown headers, just plain conversational text.
`

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    
    // Tools definition
    const tools = [{
      functionDeclarations: [
        {
          name: "get_department_location",
          description: "Gets the GPS coordinates for a specific hospital department or facility (e.g. Pharmacy, Ward) to show the user a map layout.",
          parameters: {
            type: "object",
            properties: { location_name: { type: "string", description: "The name of the department" } },
            required: ["location_name"]
          }
        },
        {
          name: "check_appointment_status",
          description: "Looks up a patient's appointment status in the database using their exact 4-character alphanumeric appointment tracking ID (e.g. AB12). Check this when patients want to know their queue status.",
          parameters: {
            type: "object",
            properties: { appointment_id: { type: "string", description: "The 4-character alphanumeric appointment ID." } },
            required: ["appointment_id"]
          }
        }
      ]
    }];

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
      tools: tools as any
    })
    
    const formattedHistory = (history || []).map((h: any) => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }))

    const chat = model.startChat({ history: formattedHistory })

    let result = await chat.sendMessage([{ text: message }])
    let response = await result.response

    let actionPayload = null;

    const calls = response.functionCalls ? response.functionCalls() : undefined;
    if (calls && calls.length > 0) {
      const call = calls[0]
      let funcResult: any = {}

      if (call.name === 'get_department_location') {
        const { location_name } = call.args as any
        const { data } = await supabase.from('departments').select('name, latitude, longitude').ilike('name', `%${location_name}%`).limit(1).single()
        
        if (data && data.latitude) {
           funcResult = { status: 'success', name: data.name, latitude: data.latitude, longitude: data.longitude, message: "Tell the user the map is shown below." }
           actionPayload = { type: 'MAP', name: data.name, lat: data.latitude, lng: data.longitude }
        } else {
           funcResult = { status: 'error', message: 'Location coordinates not found in the database. Just tell them general directions.' }
        }
      } 
      else if (call.name === 'check_appointment_status') {
        const { appointment_id } = call.args as any
        const { data } = await supabase.from('appointments').select(`
           qr_code, status, scheduled_at,
           doctor:doctors!appointments_doctor_id_fkey(user:users!doctors_user_id_fkey(name))
        `).eq('qr_code', (appointment_id || '').toUpperCase()).single()
        
        if (data) {
           funcResult = { status: 'success', appointment_status: data.status, doctor_name: (data.doctor as any)?.user?.name, time: data.scheduled_at }
           actionPayload = { type: 'APPOINTMENT', id: data.qr_code, status: data.status, doctor: (data.doctor as any)?.user?.name, time: data.scheduled_at }
        } else {
           funcResult = { status: 'error', message: 'Appointment not found. Ask them to verify the exact 4-character ID (e.g. AB12)' }
        }
      }

      // Send the function execution result back to the model
      result = await chat.sendMessage([{
        functionResponse: { name: call.name, response: funcResult }
      }])
      response = await result.response
    }

    return NextResponse.json({ reply: response.text(), action: actionPayload })
  } catch (err: any) {
    console.error('AI Chat Error:', err)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
