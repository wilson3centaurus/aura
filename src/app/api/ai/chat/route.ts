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

function normalizeCode(value: string | null | undefined) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
}

function extractCodeFromText(value: string | null | undefined) {
  const text = String(value || '').toUpperCase()
  const match = text.match(/\b[A-Z]{2}\d{2}\b|\b[A-Z0-9]{4}\b/g)
  return match?.[match.length - 1] || ''
}

function cleanDoctorName(value: string | null | undefined) {
  return String(value || '').replace(/^Dr\.?\s+/i, '').trim()
}

function pickDoctorFromMessage(message: string, doctors: any[]) {
  const normalized = message.toLowerCase()
  const byName = doctors.filter((doctor: any) => {
    const fullName = String(doctor.name || '').toLowerCase()
    const bareName = fullName.replace(/^dr\.?\s+/, '')
    return fullName && (normalized.includes(fullName) || normalized.includes(bareName))
  })
  if (byName.length === 1) return { selectedDoctor: byName[0], matches: byName }
  if (byName.length > 1) return { selectedDoctor: null, matches: byName }

  const byDepartmentOrSpecialty = doctors.filter((doctor: any) => {
    const department = String(doctor.department || '').toLowerCase()
    const specialty = String(doctor.specialty || '').toLowerCase()
    return (department && normalized.includes(department)) || (specialty && normalized.includes(specialty))
  })
  if (byDepartmentOrSpecialty.length === 1) return { selectedDoctor: byDepartmentOrSpecialty[0], matches: byDepartmentOrSpecialty }
  if (byDepartmentOrSpecialty.length > 1) return { selectedDoctor: null, matches: byDepartmentOrSpecialty }

  if (/any|first available|whoever|whichever/.test(normalized)) {
    const availableDoctor = doctors.find((doctor: any) => doctor.status === 'AVAILABLE')
    if (availableDoctor) return { selectedDoctor: availableDoctor, matches: [availableDoctor] }
  }

  return { selectedDoctor: null, matches: [] }
}

export async function POST(request: NextRequest) {
  try {
    const { message, history, language } = await request.json()

    if (!message?.trim()) {
      return NextResponse.json({ reply: "I didn't catch that. Could you try again?" })
    }

    const [docsRes, depsRes, feesRes, infoRes] = await Promise.all([
      supabase.from('doctors').select('user:users!doctors_user_id_fkey(name), specialty, room_number, status').neq('status', 'OFFLINE'),
      supabase.from('departments').select('name, location, floor, open_time, close_time'),
      supabase.from('fees').select('service, category, price, description').order('category'),
      supabase.from('hospital_info').select('key, value, category').order('category'),
    ])

    const langName = language && language !== 'en' ? LANGUAGE_NAMES[language] : null

    // Group fees by category for readable injection
    const feesByCategory: Record<string, string[]> = {}
    for (const f of feesRes.data ?? []) {
      const cat = f.category || 'General'
      if (!feesByCategory[cat]) feesByCategory[cat] = []
      const price = f.price != null ? `$${Number(f.price).toFixed(2)}` : 'contact reception'
      feesByCategory[cat].push(`${f.service}: ${price}${f.description ? ` (${f.description})` : ''}`)
    }
    const feesText = Object.entries(feesByCategory)
      .map(([cat, items]) => `${cat}:\n  ${items.join('\n  ')}`)
      .join('\n')

    // Group hospital_info by category
    const infoByCategory: Record<string, string[]> = {}
    for (const i of infoRes.data ?? []) {
      const cat = i.category || 'General'
      if (!infoByCategory[cat]) infoByCategory[cat] = []
      infoByCategory[cat].push(`${i.key}: ${i.value}`)
    }
    const infoText = Object.entries(infoByCategory)
      .map(([cat, items]) => `${cat}:\n  ${items.join('\n  ')}`)
      .join('\n')

    async function loadNormalizedDoctors() {
      const doctorsRes = await fetch(new URL('/api/doctors', request.url), { cache: 'no-store' })
      const doctorsData = doctorsRes.ok ? await doctorsRes.json() : []
      return (Array.isArray(doctorsData) ? doctorsData : [])
        .map((doctor: any) => {
          if (!doctor || typeof doctor !== 'object' || doctor.status === 'OFFLINE') return null
          const departmentSource = Array.isArray(doctor.department) ? doctor.department[0] : doctor.department
          const userSource = Array.isArray(doctor.user) ? doctor.user[0] : doctor.user
          return {
            id: doctor.id,
            name: cleanDoctorName(userSource?.name ?? 'Unknown'),
            specialty: doctor.specialty,
            department: departmentSource?.name ?? 'General',
            room: doctor.room_number,
            status: doctor.status,
          }
        })
        .filter(Boolean)
    }

    async function createAppointmentRecord(details: { doctorId: string; patientName: string; patientPhone?: string | null; symptoms?: string | null }) {
      const generateShortCode = () => {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        const dl = () => letters[Math.floor(Math.random() * letters.length)]
        const n = Math.floor(Math.random() * 90) + 10
        return `${dl()}${dl()}${n}`
      }

      let shortCode = ''
      for (let i = 0; i < 5; i++) {
        shortCode = generateShortCode()
        const { count } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('qr_code', shortCode)
        if (count === 0) break
      }

      const scheduledAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          patient_name: details.patientName,
          patient_phone: details.patientPhone || null,
          symptoms: details.symptoms || null,
          doctor_id: details.doctorId,
          scheduled_at: scheduledAt,
          qr_code: shortCode,
        })
        .select('qr_code, status, scheduled_at, doctor:doctors!appointments_doctor_id_fkey(user:users!doctors_user_id_fkey(name))')
        .single()

      if (appointmentError || !appointment) {
        return { appointment: null, error: appointmentError?.message || 'Unknown error' }
      }

      return { appointment, error: null }
    }

    const conversationHistory = Array.isArray(history) ? history : []
    const normalizedMessage = String(message).trim().toLowerCase()
    const compactCode = extractCodeFromText(message)
    const yesPattern = /^(yes|yeah|yep|correct|confirm|book it|go ahead|okay|ok|sure|please do|that'?s right)\b/i
    const skipPhonePattern = /^(skip|none|no phone|no number|without phone|n\/a|na|nil|don'?t have one)\b/i
    const bookingState = [...conversationHistory].reverse().find((entry: any) => entry?.action?.type === 'BOOKING_PROGRESS')?.action || null
    const previousDoctorsList = [...conversationHistory].reverse().find((entry: any) => entry?.action?.type === 'DOCTORS_LIST')?.action || null
    const assistantAskedForCode = [...conversationHistory].reverse().some((entry: any) => {
      const text = String(entry?.content || entry?.text || '').toLowerCase()
      return entry?.role !== 'user' && (text.includes('tracking code') || text.includes('4-letter code') || text.includes('appointment code'))
    })

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

Fees & Service Costs (LIVE prices from database — always quote these exactly. Never say you don't know the price):
${feesText || 'No fees on file — tell them to ask at reception.'}

Hospital Information (LIVE from database):
${infoText || 'No additional info on file.'}

About Mutare Provincial Hospital (historical facts — answer confidently):
Mutare Provincial Hospital was established in 1902 during the colonial era and was originally known as Umtali General Hospital — named after the city's former colonial name, Umtali. It is a government referral hospital operating under Zimbabwe's Ministry of Health and Child Care (MoHCC). It is the main public referral centre for Manicaland Province, located along Herbert Chitepo Street in Mutare city. The hospital has over 400 beds and serves a large catchment population across Manicaland. It offers services including general medicine, surgery, maternity, paediatrics, orthopaedics, ophthalmology, dental, and more. The hospital has been progressively modernised and expanded since independence in 1980.

Rules:
1. Bookings: When a patient wants to book, call list_doctors first (filtered by department/specialty if they mentioned one). Present the doctors naturally by name and specialty, then ask which one they'd like. Once they choose, ask for their full name, then call book_appointment. Give them their code and tell them to remember it.
2. Directions: Also call show_map AND give a verbal turn-by-turn hint in your reply.
3. Appointment tracking: ask for their 4-letter code (like AB12), then call check_appointment.
4. Fees: ALWAYS quote the exact price from the fee schedule above. Never say you don't have access to fee information.
5. History/facts: Use the historical facts above to answer questions about when the hospital was built, who founded it, etc.
6. If asked something you genuinely don't know (not in the data above), call search_web to look it up — don't make things up.
7. NEVER output raw function call tags like <function=...> in your reply text. Use the proper tool mechanism — never type function syntax in your response.
8. When listing doctors, mention their name, specialty, and department conversationally — never dump raw IDs or JSON.`

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
      {
        type: 'function',
        function: {
          name: 'search_web',
          description: 'Search the internet for information not available in the hospital database — use for medical facts, general health questions, or anything not covered by the data above',
          parameters: { type: 'object', properties: { query: { type: 'string', description: 'The search query to look up' } }, required: ['query'] },
        },
      },
      {
        type: 'function',
        function: {
          name: 'list_doctors',
          description: 'Lists available doctors at the hospital optionally filtered by department or specialty. Call this when a patient wants to see a doctor or book an appointment so they can choose.',
          parameters: {
            type: 'object',
            properties: {
              department: { type: 'string', description: 'Filter by department name e.g. "Maternity", "Surgery"' },
              specialty: { type: 'string', description: 'Filter by doctor specialty e.g. "Orthopedics", "Pediatrics"' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'book_appointment',
          description: 'Books an appointment for a patient with a specific doctor. Ask the patient for their name first, then which doctor or department they want.',
          parameters: {
            type: 'object',
            properties: {
              doctor_id: { type: 'string', description: 'The doctor ID to book with' },
              patient_name: { type: 'string', description: 'Full name of the patient' },
              patient_phone: { type: 'string', description: 'Patient phone number (optional)' },
              symptoms: { type: 'string', description: 'Brief description of symptoms (optional)' },
            },
            required: ['doctor_id', 'patient_name'],
          },
        },
      },
    ]

    const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((h: any) => ({
        role: (h.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: String(h.content || h.text || ''),
      })),
      { role: 'user', content: message.slice(0, 1000) },
    ]

    const wantsBooking = /(book|appointment|see a doctor|doctor appointment)/i.test(normalizedMessage)
    const wantsTracking = /(track|status|check.*appointment|appointment status|where.*appointment|my appointment|use my code)/i.test(normalizedMessage)

    if ((wantsTracking && compactCode.length !== 4) || (assistantAskedForCode && compactCode.length !== 4 && !bookingState)) {
      return NextResponse.json({ reply: 'Please tell me your 4-letter appointment code, and I will check it for you.' })
    }

    if (compactCode.length === 4 && (wantsTracking || assistantAskedForCode)) {
      const { data } = await supabase
        .from('appointments')
        .select(`qr_code, status, scheduled_at, doctor:doctors!appointments_doctor_id_fkey(user:users!doctors_user_id_fkey(name))`)
        .eq('qr_code', compactCode)
        .single()

      if (data) {
        const doctorName = cleanDoctorName((data.doctor as any)?.user?.name ?? 'your doctor')
        return NextResponse.json({
          reply: `I found your appointment. The details are shown on the screen below.`,
          action: { type: 'APPOINTMENT', id: data.qr_code, status: data.status, doctor: doctorName, time: data.scheduled_at },
        })
      }

      return NextResponse.json({ reply: `I can't find an appointment with code ${compactCode}. Please check the letters and numbers and try again.` })
    }

    const shouldHandleBooking = wantsBooking || !!bookingState || !!previousDoctorsList
    if (shouldHandleBooking) {
      const doctors = await loadNormalizedDoctors()

      if (bookingState?.stage === 'ASK_NAME' && bookingState.doctor) {
        const patientName = String(message).trim()
        if (patientName.length < 3) {
          return NextResponse.json({
            reply: 'I need your full name please, just as you would like it on the appointment.',
            action: bookingState,
          })
        }

        return NextResponse.json({
          reply: `Alright ${patientName}. What's your phone number? If you don't want to give one, just say skip.`,
          action: { ...bookingState, stage: 'ASK_PHONE', patientName },
        })
      }

      if (bookingState?.stage === 'ASK_PHONE' && bookingState.doctor && bookingState.patientName) {
        const patientPhone = skipPhonePattern.test(String(message).trim()) ? '' : String(message).trim()
        return NextResponse.json({
          reply: 'Now tell me what you are feeling, or what the appointment is for.',
          action: { ...bookingState, stage: 'ASK_SYMPTOMS', patientPhone },
        })
      }

      if (bookingState?.stage === 'ASK_SYMPTOMS' && bookingState.doctor && bookingState.patientName) {
        const symptoms = String(message).trim()
        if (symptoms.length < 3) {
          return NextResponse.json({
            reply: 'Give me a quick reason for the visit please, even if it is just one short sentence.',
            action: bookingState,
          })
        }

        return NextResponse.json({
          reply: `Just to confirm, you want to book with Dr. ${cleanDoctorName(bookingState.doctor.name)}. Your name is ${bookingState.patientName}, phone number is ${bookingState.patientPhone || 'not provided'}, and you said ${symptoms}. Say yes to confirm, or tell me what to change.`,
          action: { ...bookingState, stage: 'CONFIRM', symptoms },
        })
      }

      if (bookingState?.stage === 'CONFIRM' && bookingState.doctor && bookingState.patientName) {
        if (!yesPattern.test(String(message).trim())) {
          return NextResponse.json({
            reply: 'No problem. Tell me the doctor or department you want, and we will update it from there.',
            action: { type: 'DOCTORS_LIST', doctors },
          })
        }

        const { appointment, error } = await createAppointmentRecord({
          doctorId: bookingState.doctor.id,
          patientName: bookingState.patientName,
          patientPhone: bookingState.patientPhone || null,
          symptoms: bookingState.symptoms || null,
        })

        if (!appointment) {
          return NextResponse.json({ reply: `I couldn't complete the booking just now. ${error || 'Please try again.'}` })
        }

        const doctorName = cleanDoctorName((appointment.doctor as any)?.user?.name ?? bookingState.doctor.name)
        return NextResponse.json({
          reply: `Booked. Scan the QR below to track it on your phone, or store this appointment number in your head mate: ${appointment.qr_code}.`,
          action: { type: 'BOOKING_CONFIRMED', code: appointment.qr_code, doctor: doctorName, time: appointment.scheduled_at },
        })
      }

      const doctorSelectionMessage = bookingState?.doctor ? String(message).trim() : normalizedMessage
      const doctorChoice = pickDoctorFromMessage(doctorSelectionMessage, doctors)
      if (doctorChoice.selectedDoctor) {
        return NextResponse.json({
          reply: `Good choice. Booking with Dr. ${cleanDoctorName(doctorChoice.selectedDoctor.name)}. What's your full name?`,
          action: { type: 'BOOKING_PROGRESS', stage: 'ASK_NAME', doctor: doctorChoice.selectedDoctor },
        })
      }

      if (doctorChoice.matches.length > 1) {
        return NextResponse.json({
          reply: 'I found a few doctors that match that. Pick the one you want from the list below.',
          action: { type: 'DOCTORS_LIST', doctors: doctorChoice.matches },
        })
      }

      if (doctors.length) {
        return NextResponse.json({
          reply: 'These are the doctors available right now. Tell me which doctor or department you want.',
          action: { type: 'DOCTORS_LIST', doctors },
        })
      }
    }

    const directLocationTerms = [
      'pharmacy', 'toilet', 'toilets', 'bathroom', 'restroom', 'washroom', 'laboratory', 'lab',
      'radiology', 'emergency', 'maternity', 'chapel', 'cafeteria', 'parking', 'main entrance', 'outpatient',
    ]
    const matchedLocationTerm = directLocationTerms.find(term => normalizedMessage.includes(term))
    if ((/where|direction|locat|find|take me|show me/i.test(normalizedMessage) || matchedLocationTerm) && matchedLocationTerm) {
      const searchTerms = matchedLocationTerm.match(/toilet|bathroom|restroom|washroom/)
        ? ['toilet', 'toilets', 'bathroom', 'restroom', 'washroom']
        : [matchedLocationTerm]
      const { data: pins } = await supabase
        .from('location_pins')
        .select('name, category, description, latitude, longitude, written_directions, floor')
        .eq('is_active', true)

      const matchedPin = (pins ?? []).find((pin: any) => {
        const haystack = [pin?.name, pin?.category, pin?.description, pin?.written_directions]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return searchTerms.some(term => haystack.includes(term))
      })

      if (matchedPin?.latitude != null && matchedPin?.longitude != null) {
        return NextResponse.json({
          reply: `${matchedPin.name} is shown on the screen below with directions.`,
          action: { type: 'MAP', name: matchedPin.name, lat: matchedPin.latitude, lng: matchedPin.longitude },
        })
      }
    }

    let aiResponse = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: chatMessages,
      tools,
      tool_choice: 'auto',
      max_tokens: 300,
      temperature: 0.9,
    })

    // ── Reusable tool executor ──
    async function executeTool(name: string, args: any): Promise<{ result: string; action: any | null }> {
      if (name === 'show_map') {
        const requestedName = String(args.location_name || '').trim().toLowerCase()
        const searchTerms = requestedName.match(/toilet|bathroom|restroom|washroom/)
          ? ['toilet', 'toilets', 'bathroom', 'restroom', 'washroom']
          : [requestedName]

        const { data: pins } = await supabase
          .from('location_pins')
          .select('name, category, description, latitude, longitude, written_directions, floor')
          .eq('is_active', true)

        const matchedPin = (pins ?? []).find((pin: any) => {
          const haystack = [pin.name, pin.category, pin.description, pin.written_directions]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return searchTerms.some(term => haystack.includes(term))
        })

        if (matchedPin?.latitude != null && matchedPin?.longitude != null) {
          return {
            result: `Found: ${matchedPin.name} on ${matchedPin.floor ?? 'ground floor'}. Map is now shown on screen.${matchedPin.written_directions ? ` Directions: ${matchedPin.written_directions}.` : ''}`,
            action: { type: 'MAP', name: matchedPin.name, lat: matchedPin.latitude, lng: matchedPin.longitude },
          }
        }

        const { data: departments } = await supabase
          .from('departments')
          .select('name, latitude, longitude, location, floor, written_directions')

        const matchedDepartment = (departments ?? []).find((department: any) => {
          const haystack = [department.name, department.location, department.written_directions]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return searchTerms.some(term => haystack.includes(term))
        })

        if (matchedDepartment?.latitude != null && matchedDepartment?.longitude != null) {
          return {
            result: `Found: ${matchedDepartment.name} on ${matchedDepartment.floor ?? 'ground floor'}, ${matchedDepartment.location ?? 'main building'}. Map is now shown on screen.${matchedDepartment.written_directions ? ` Directions: ${matchedDepartment.written_directions}.` : ''}`,
            action: { type: 'MAP', name: matchedDepartment.name, lat: matchedDepartment.latitude, lng: matchedDepartment.longitude },
          }
        }

        return { result: `No GPS coordinates found for "${args.location_name}". Provide verbal directions and suggest asking at reception.`, action: null }
      }
      if (name === 'check_appointment') {
        const code = normalizeCode(args.code)
        const { data } = await supabase.from('appointments').select(`qr_code, status, scheduled_at, doctor:doctors!appointments_doctor_id_fkey(user:users!doctors_user_id_fkey(name))`).eq('qr_code', code).single()
        if (data) {
          const doctorName = cleanDoctorName((data.doctor as any)?.user?.name ?? 'your doctor')
          return { result: `Appointment found. Code: ${data.qr_code}. Status: ${data.status}. Doctor: Dr. ${doctorName}. Scheduled: ${data.scheduled_at ? new Date(data.scheduled_at).toLocaleString() : 'time not set'}.`, action: { type: 'APPOINTMENT', id: data.qr_code, status: data.status, doctor: doctorName, time: data.scheduled_at } }
        }
        return { result: `No appointment found with code "${code}". Ask them to double-check their 4-character code.`, action: null }
      }
      if (name === 'list_doctors') {
        const docs = await loadNormalizedDoctors()
        const requestedDepartment = String(args.department || '').trim().toLowerCase()
        const requestedSpecialty = String(args.specialty || '').trim().toLowerCase()
        const filtered = docs.filter((doctor: any) => {
          const matchesDepartment = !requestedDepartment
            || String(doctor.department || '').toLowerCase().includes(requestedDepartment)
          const matchesSpecialty = !requestedSpecialty
            || String(doctor.specialty || '').toLowerCase().includes(requestedSpecialty)
          return matchesDepartment && matchesSpecialty
        })

        if (filtered.length) {
          return { result: `Available doctors:\n${filtered.map((doctor: any) => `- Dr. ${doctor.name} (ID: ${doctor.id}) — ${doctor.specialty}, ${doctor.department}, Room ${doctor.room ?? 'TBD'}, Status: ${doctor.status}`).join('\n')}\n\nAsk the patient which doctor they'd like to book with.`, action: { type: 'DOCTORS_LIST', doctors: filtered.map((doctor: any) => ({ id: doctor.id, name: doctor.name, specialty: doctor.specialty, department: doctor.department, room: doctor.room, status: doctor.status })) } }
        }
        return { result: 'No doctors found matching that criteria. Suggest the patient try a different department or check at reception.', action: null }
      }
      if (name === 'book_appointment') {
        const { appointment: appt, error: apptErr } = await createAppointmentRecord({
          doctorId: args.doctor_id,
          patientName: args.patient_name,
          patientPhone: args.patient_phone || null,
          symptoms: args.symptoms || null,
        })
        if (appt) {
          const drName = cleanDoctorName((appt.doctor as any)?.user?.name ?? 'your doctor')
          return { result: `Appointment booked! Code: ${appt.qr_code}. Doctor: Dr. ${drName}. Scheduled: ${new Date(appt.scheduled_at).toLocaleString()}. Tell the patient to remember their code ${appt.qr_code} for tracking.`, action: { type: 'BOOKING_CONFIRMED', code: appt.qr_code, doctor: drName, time: appt.scheduled_at } }
        }
        return { result: `Failed to book: ${apptErr?.message || 'Unknown error'}. Suggest trying again or visiting reception.`, action: null }
      }
      if (name === 'search_web') {
        try {
          const q = encodeURIComponent((args.query || '') + ' Zimbabwe')
          const searchRes = await fetch(`https://api.duckduckgo.com/?q=${q}&format=json&no_html=1&skip_disambig=1`, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(5000) })
          const searchData = await searchRes.json()
          const answer = searchData.AbstractText || searchData.Answer || searchData.RelatedTopics?.[0]?.Text || ''
          return { result: answer ? `Web result: ${answer.slice(0, 500)}` : 'No specific web result found — answer from your general knowledge.', action: null }
        } catch {
          return { result: 'Web search unavailable — answer from your general knowledge.', action: null }
        }
      }
      return { result: 'Unknown tool.', action: null }
    }

    let actionPayload: any = null
    let fallbackReply: string | null = null
    const toolCalls = aiResponse.choices[0].message.tool_calls

    // Path 1: Model used proper tool-call mechanism
    if (toolCalls?.length) {
      const call = toolCalls[0] as any
      let args: any = {}
      try {
        const rawArgs = String(call.function.arguments || '').trim()
        args = rawArgs ? JSON.parse(rawArgs) : {}
      } catch {
        args = {}
      }
      const { result: toolResult, action } = await executeTool(call.function.name, args)
      actionPayload = action
      fallbackReply = action?.type === 'MAP'
        ? `${action.name} is shown on the screen below with directions.`
        : action?.type === 'APPOINTMENT'
          ? `I found your appointment. The details are shown on the screen below.`
          : action?.type === 'DOCTORS_LIST'
            ? 'These are the doctors available right now. Tell me which doctor or department you want.'
            : action?.type === 'BOOKING_CONFIRMED'
              ? `Your appointment is booked. Your code is ${action.code}.`
              : toolResult

      aiResponse = {
        choices: [{ message: { content: fallbackReply } }],
      } as any
    }

    const rawReply = aiResponse.choices[0]?.message?.content?.trim() || fallbackReply || "I'm here to help. What do you need today?"

    // Path 2: Llama leaked <function=...> as text instead of using tools.
    // It may return any of these malformed variants:
    //   <function=show_map>{"location_name":"toilets"}</function>
    //   <function=show_map{"location_name":"toilets"}</function>
    //   <function=list_doctors></function>
    const leakedTagRegex = /<function=(\w+)(?:\s*(\{[\s\S]*?\}))?>([\s\S]*?)<\/function>/gi
    let leakedMatch: RegExpExecArray | null
    while ((leakedMatch = leakedTagRegex.exec(rawReply)) !== null) {
      if (actionPayload) break
      try {
        const fnName = leakedMatch[1]
        const inlineArgs = leakedMatch[2]?.trim()
        const bodyText = leakedMatch[3]?.trim()
        const rawArgs = inlineArgs || (bodyText?.startsWith('{') ? bodyText : '{}')
        const fnArgs = JSON.parse(rawArgs)
        const { action } = await executeTool(fnName, fnArgs)
        if (action) actionPayload = action
      } catch {}
    }

    // Also handle malformed tags missing the > before the JSON body.
    if (!actionPayload) {
      const malformedInlineRegex = /<function=(\w+)\s*(\{[\s\S]*?\})\s*<\/function>/gi
      let malformedMatch: RegExpExecArray | null
      while ((malformedMatch = malformedInlineRegex.exec(rawReply)) !== null) {
        if (actionPayload) break
        try {
          const fnName = malformedMatch[1]
          const fnArgs = JSON.parse(malformedMatch[2])
          const { action } = await executeTool(fnName, fnArgs)
          if (action) actionPayload = action
        } catch {}
      }
    }

    // Strip all leaked function-call syntax from displayed reply.
    const reply = rawReply
      .replace(/<function=\w+(?:\s*\{[\s\S]*?\})?>[\s\S]*?<\/function>/gi, '')
      .replace(/<function=\w+\s*\{[\s\S]*?\}\s*<\/function>/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim() || "I'm here to help. What do you need today?"

    return NextResponse.json({ reply, action: actionPayload })
  } catch (err: any) {
    console.error('AI Chat error:', err?.message)
    return NextResponse.json({ reply: "I'm sorry, I'm having a bit of trouble right now. Please try again." })
  }
}