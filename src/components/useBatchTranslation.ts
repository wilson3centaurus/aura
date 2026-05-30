'use client'

import { useEffect, useMemo, useState } from 'react'
import { normalizeKioskLanguage } from '@/lib/kiosk-language'

const translationCache = new Map<string, string[]>()

export function useBatchTranslation(texts: string[], language: string) {
  const normalizedLanguage = normalizeKioskLanguage(language)
  const stableTexts = useMemo(() => texts.map(text => String(text || '')), [texts])
  const cacheKey = useMemo(
    () => `${normalizedLanguage}::${stableTexts.join('\u241f')}`,
    [normalizedLanguage, stableTexts],
  )

  const [translatedTexts, setTranslatedTexts] = useState(stableTexts)

  useEffect(() => {
    let active = true

    if (!stableTexts.length || normalizedLanguage === 'en') {
      setTranslatedTexts(stableTexts)
      return () => { active = false }
    }

    const cached = translationCache.get(cacheKey)
    if (cached) {
      setTranslatedTexts(cached)
      return () => { active = false }
    }

    setTranslatedTexts(stableTexts)

    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetLanguage: normalizedLanguage, texts: stableTexts }),
    })
      .then(async response => {
        if (!response.ok) throw new Error('Translation failed')
        return response.json()
      })
      .then(data => {
        const nextTexts = Array.isArray(data?.translations)
          ? data.translations.map((text: unknown, index: number) => String(text ?? stableTexts[index] ?? ''))
          : stableTexts
        translationCache.set(cacheKey, nextTexts)
        if (active) setTranslatedTexts(nextTexts)
      })
      .catch(() => {
        if (active) setTranslatedTexts(stableTexts)
      })

    return () => { active = false }
  }, [cacheKey, normalizedLanguage, stableTexts])

  return translatedTexts
}