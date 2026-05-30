export const KIOSK_LANGUAGE_STORAGE_KEY = 'aura-language'

export const DEFAULT_KIOSK_LANGUAGE = 'en'

export const LANGUAGE_NAME_MAP: Record<string, string> = {
  en: 'English',
  sn: 'Shona',
  nd: 'Ndebele',
  to: 'Tonga',
  cb: 'Chibarwe',
  kl: 'Kalanga',
  ko: 'Koisan',
  nm: 'Nambya',
  na: 'Ndau',
  sh: 'Shangani',
  st: 'Sesotho',
  ve: 'Tshivenda',
  xh: 'isiXhosa',
  ch: 'Chichewa',
  ts: 'Setswana',
  sl: 'Sign Language',
}

export function normalizeKioskLanguage(language?: string | null) {
  if (!language) return DEFAULT_KIOSK_LANGUAGE
  const value = String(language).trim().toLowerCase()
  if (value === 'sl') return DEFAULT_KIOSK_LANGUAGE
  return LANGUAGE_NAME_MAP[value] ? value : DEFAULT_KIOSK_LANGUAGE
}

export function getLanguageDisplayName(language?: string | null) {
  return LANGUAGE_NAME_MAP[normalizeKioskLanguage(language)] || LANGUAGE_NAME_MAP.en
}

export function readStoredKioskLanguage() {
  if (typeof window === 'undefined') return DEFAULT_KIOSK_LANGUAGE
  return normalizeKioskLanguage(window.localStorage.getItem(KIOSK_LANGUAGE_STORAGE_KEY))
}

export function storeKioskLanguage(language: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KIOSK_LANGUAGE_STORAGE_KEY, language)
}