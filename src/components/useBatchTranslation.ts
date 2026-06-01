'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { normalizeKioskLanguage } from '@/lib/kiosk-language'

const translationCache = new Map<string, string[]>()

export function useBatchTranslation(texts: string[], language: string) {
  const normalizedLanguage = normalizeKioskLanguage(language)

  // Derive a string signature from text CONTENT so that inline array literals
  // (new reference every render, same content) do NOT re-trigger the effect.
  const textsSignature = texts.map(t => String(t || '')).join('\u241f')

  // stableTexts only changes when content actually changes — not on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableTexts = useMemo(() => texts.map(t => String(t || '')), [textsSignature])

  // Single key that encodes both language and content.
  const cacheKey = `${normalizedLanguage}::${textsSignature}`

  // Keep a ref so the fetch closure always reads the latest texts without
  // listing stableTexts as a dependency (which would reintroduce the render loop).
  const stableTextsRef = useRef(stableTexts)
  stableTextsRef.current = stableTexts

  const [translatedTexts, setTranslatedTexts] = useState(stableTexts)

  useEffect(() => {
    let active = true
    const currentTexts = stableTextsRef.current

    if (!currentTexts.length || normalizedLanguage === 'en') {
      setTranslatedTexts(currentTexts)
      return () => { active = false }
    }

    const cached = translationCache.get(cacheKey)
    if (cached) {
      setTranslatedTexts(cached)
      return () => { active = false }
    }

    // Show originals immediately while network request is in flight.
    // Do NOT call setTranslatedTexts(currentTexts) here — it would cause extra
    // renders that reset translated text back to English on every effect run.
    // The initial useState(stableTexts) already covers the initial render.

    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetLanguage: normalizedLanguage, texts: currentTexts }),
    })
      .then(async response => {
        if (!response.ok) throw new Error('Translation failed')
        return response.json()
      })
      .then(data => {
        const src = stableTextsRef.current
        const nextTexts = Array.isArray(data?.translations)
          ? data.translations.map((text: unknown, index: number) => String(text ?? src[index] ?? ''))
          : src
        translationCache.set(cacheKey, nextTexts)
        if (active) setTranslatedTexts(nextTexts)
      })
      .catch(() => {
        if (active) setTranslatedTexts(stableTextsRef.current)
      })

    return () => { active = false }
    // cacheKey encodes both normalizedLanguage and textsSignature — no other deps needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey])

  return translatedTexts
}