'use client'

import { useEffect, useState } from 'react'
import {
  DEFAULT_KIOSK_LANGUAGE,
  KIOSK_LANGUAGE_STORAGE_KEY,
  normalizeKioskLanguage,
  readStoredKioskLanguage,
  storeKioskLanguage,
} from '@/lib/kiosk-language'

export function useKioskLanguage() {
  const [language, setLanguage] = useState(DEFAULT_KIOSK_LANGUAGE)

  useEffect(() => {
    setLanguage(readStoredKioskLanguage())

    const handleStorage = (event: StorageEvent) => {
      if (event.key === KIOSK_LANGUAGE_STORAGE_KEY) {
        setLanguage(normalizeKioskLanguage(event.newValue))
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const updateLanguage = (nextLanguage: string) => {
    const normalized = normalizeKioskLanguage(nextLanguage)
    storeKioskLanguage(nextLanguage)
    setLanguage(normalized)
  }

  return { language, setLanguage: updateLanguage }
}