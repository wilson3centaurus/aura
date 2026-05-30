import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getLanguageDisplayName, normalizeKioskLanguage } from '@/lib/kiosk-language'

const groq = process.env.GROQ_API_KEY
  ? new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' })
  : null

// Maps our language codes → Google Translate language codes (unofficial free API)
const GOOGLE_LANG_MAP: Record<string, string> = {
  sn: 'sn',  // Shona
  nd: 'nd',  // Ndebele (North)
  xh: 'xh',  // Xhosa
  st: 'st',  // Sesotho (Southern Sotho)
  ve: 've',  // Tshivenda
  ts: 'tn',  // Setswana → Google uses 'tn'
  ch: 'ny',  // Chichewa → Google uses 'ny' (Nyanja)
}

function chunkTexts(texts: string[], size: number) {
  const chunks: string[][] = []
  for (let index = 0; index < texts.length; index += size) {
    chunks.push(texts.slice(index, index + size))
  }
  return chunks
}

// Free unofficial Google Translate — no API key needed, works for most major languages
async function translateWithGoogleFree(texts: string[], googleLangCode: string): Promise<string[] | null> {
  try {
    const results = await Promise.all(
      texts.map(async (text) => {
        if (!text.trim()) return text
        try {
          const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${googleLangCode}&dt=t&q=${encodeURIComponent(text.slice(0, 500))}`
          const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
          if (!res.ok) return null
          const data = await res.json()
          // Response: [[["translated","original",null,null,1],...], null, "lang"]
          const translated = data?.[0]?.map((item: string[]) => item[0]).join('') || null
          return translated
        } catch {
          return null
        }
      }),
    )
    // If more than half failed, treat whole batch as failed
    const successes = results.filter(r => r !== null).length
    if (successes < texts.length / 2) return null
    return results.map((r, i) => r ?? texts[i])
  } catch {
    return null
  }
}

// Google Cloud Translation API (paid, highest quality) — uses GOOGLE_TRANSLATE_API_KEY
async function translateWithGoogleCloud(texts: string[], targetLang: string): Promise<string[] | null> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: texts, source: 'en', target: targetLang, format: 'text' }),
        signal: AbortSignal.timeout(8000),
      },
    )
    if (!res.ok) return null
    const data = await res.json()
    const translations: string[] = data?.data?.translations?.map((t: { translatedText: string }) => t.translatedText) ?? []
    if (translations.length !== texts.length) return null
    return translations
  } catch {
    return null
  }
}

async function translateWithGroq(texts: string[], targetLanguage: string) {
  if (!groq) return texts

  const translated: string[] = []

  for (const chunk of chunkTexts(texts, 12)) {
    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Translate UI text for a hospital kiosk into ${getLanguageDisplayName(targetLanguage)}. Return only JSON in this shape: {"translations":["..."]}. Keep the array length identical to the input. Preserve names, codes, numbers, slashes, and medical terms unless translation is obvious.`,
          },
          {
            role: 'user',
            content: JSON.stringify({ texts: chunk }),
          },
        ],
      })

      const content = response.choices[0]?.message?.content || ''
      const parsed = JSON.parse(content)
      const items = Array.isArray(parsed?.translations) ? parsed.translations : chunk
      for (let index = 0; index < chunk.length; index += 1) {
        translated.push(String(items[index] ?? chunk[index]))
      }
    } catch {
      // On chunk failure, keep originals
      for (const text of chunk) translated.push(text)
    }
  }

  return translated
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const targetLanguage = normalizeKioskLanguage(body?.targetLanguage)
    const texts = Array.isArray(body?.texts)
      ? body.texts.map((text: unknown) => String(text ?? '').slice(0, 500))
      : []

    if (!texts.length || targetLanguage === 'en') {
      return NextResponse.json({ translations: texts })
    }

    // 1. Try Google Cloud Translation API first (paid, highest quality)
    const googleLangCode = GOOGLE_LANG_MAP[targetLanguage]
    if (googleLangCode && process.env.GOOGLE_TRANSLATE_API_KEY) {
      const cloud = await translateWithGoogleCloud(texts, googleLangCode)
      if (cloud) return NextResponse.json({ translations: cloud, source: 'google-cloud' })
    }

    // 2. Try free unofficial Google Translate for supported languages
    if (googleLangCode) {
      const googleFree = await translateWithGoogleFree(texts, googleLangCode)
      if (googleFree) return NextResponse.json({ translations: googleFree, source: 'google-free' })
    }

    // 3. Groq LLM fallback — works for ALL languages including Tonga, Chibarwe, Kalanga etc.
    const groqResult = await translateWithGroq(texts, targetLanguage)
    return NextResponse.json({ translations: groqResult, source: 'groq' })
  } catch (error: any) {
    console.error('Translate route error:', error?.message)
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
  }
}
