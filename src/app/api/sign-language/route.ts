import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Groq llama-3.2-11b-vision-preview â€” free vision model
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})

export async function POST(request: NextRequest) {
  try {
    const { imageBase64 } = await request.json()

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const response = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
            {
              type: 'text',
              text: `This person is at a hospital kiosk in Zimbabwe and is communicating using sign language or hand gestures. 
Please interpret what they are trying to ask or say. 
Focus on common hospital-related requests such as: seeing a doctor, finding the pharmacy, asking about visiting hours, checking their queue number, finding the toilet/bathroom, or getting medication.
Respond with ONLY a short plain English sentence of what you think they are asking â€” e.g. "I need to see a doctor" or "Where is the pharmacy?" 
If you cannot confidently interpret the gesture, respond with: "Please tap an option on the screen or type your question."`,
            },
          ],
        },
      ],
      max_tokens: 80,
    })

    const text =
      response.choices[0]?.message?.content?.trim() ||
      'Please tap an option on the screen or type your question.'

    return NextResponse.json({ text })
  } catch (err: any) {
    console.error('Sign language error:', err?.message)
    return NextResponse.json(
      { text: 'Unable to interpret gesture. Please tap an option on the screen.' },
      { status: 200 }
    )
  }
}
