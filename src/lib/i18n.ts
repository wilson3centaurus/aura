/**
 * AURA Kiosk – lightweight i18n translations
 * Covers the 16 official Zimbabwean languages.
 */

export type TranslationKey =
  | 'welcome'
  | 'subtitle'
  | 'selectLanguage'
  | 'tapToSpeak'
  | 'listening'
  | 'speakNow'
  | 'or'
  | 'menuTitle'
  | 'changeLanguage'
  | 'seeDoctor'
  | 'seeDoctorSub'
  | 'getMedication'
  | 'getMedicationSub'
  | 'symptomCheck'
  | 'symptomCheckSub'
  | 'hospitalInfo'
  | 'hospitalInfoSub'
  | 'visitSomeone'
  | 'visitSomeoneSub'
  | 'findFacilities'
  | 'findFacilitiesSub'
  | 'medicalFees'
  | 'medicalFeesSub'
  | 'checkQueue'
  | 'checkQueueSub'
  | 'askAnything'
  | 'suppliesBelow'

type Translations = Record<TranslationKey, string>

const en: Translations = {
  welcome: 'Welcome to\nMutare Provincial Hospital',
  subtitle: 'Mauya · Siyakwamukela · Welcome',
  selectLanguage: 'Select your language',
  tapToSpeak: 'Tap to speak',
  listening: 'Listening… speak now',
  speakNow: 'Say what you need — e.g. "I need to see a doctor"',
  or: 'or',
  menuTitle: 'How can I help you today?',
  changeLanguage: 'Change Language',
  seeDoctor: 'See a Doctor',
  seeDoctorSub: 'Doctors & specialists',
  getMedication: 'Get Medication',
  getMedicationSub: 'Check pharmacy stock',
  symptomCheck: 'Symptom Check',
  symptomCheckSub: 'Triage & assessment',
  hospitalInfo: 'Hospital Information',
  hospitalInfoSub: 'Services, fees & policies',
  visitSomeone: 'Visit Someone Admitted',
  visitSomeoneSub: 'Find admitted relatives',
  findFacilities: 'Find Facilities',
  findFacilitiesSub: 'Maps & directions',
  medicalFees: 'Medical Fees & Costs',
  medicalFeesSub: 'Pricing information',
  checkQueue: 'Check My Queue',
  checkQueueSub: 'Wait times & position',
  askAnything: 'Ask me anything',
  suppliesBelow: 'Complimentary supplies available below this kiosk',
}

const sn: Translations = {
  welcome: 'Mauya ku\nMutare Provincial Hospital',
  subtitle: 'Mauya · Siyakwamukela · Welcome',
  selectLanguage: 'Sarudza mutauro wako',
  tapToSpeak: 'Bata kutaura',
  listening: 'Ndinorwa… taura ikozvino',
  speakNow: 'Taura zvaunoda — sekuti "Ndida kuona chiremba"',
  or: 'kana',
  menuTitle: 'Ndingakubatsira sei nhasi?',
  changeLanguage: 'Shandura Mutauro',
  seeDoctor: 'Ona Chiremba',
  seeDoctorSub: 'Vanachiremba nevanachiremba vezvikamu',
  getMedication: 'Tora Mushonga',
  getMedicationSub: 'Tarisa mushonga wephama',
  symptomCheck: 'Tarisa Zvirwere',
  symptomCheckSub: 'Ongorora zvirwere zvako',
  hospitalInfo: 'Ruzivo rweHospitari',
  hospitalInfoSub: 'Masevhisi, mitengo & mitemo',
  visitSomeone: 'Shanya Munhu Akugadzikwa',
  visitSomeoneSub: 'Tsvaga hama dzakugadzikwa',
  findFacilities: 'Tsvaga Nzvimbo',
  findFacilitiesSub: 'Mamepu & nzira',
  medicalFees: 'Mitengo yeMishonga',
  medicalFeesSub: 'Ruzivo rwemitengo',
  checkQueue: 'Tarisa Mutsara Wangu',
  checkQueueSub: 'Nguva yekumirira & chinzvimbo',
  askAnything: 'Ndibvunze chero chinhu',
  suppliesBelow: 'Zvinhu zvemahara zviri pasi pekiosk ino',
}

const nd: Translations = {
  welcome: 'Siyakwamukela e\nMutare Provincial Hospital',
  subtitle: 'Mauya · Siyakwamukela · Welcome',
  selectLanguage: 'Khetha ulimi lwakho',
  tapToSpeak: 'Thepha ukukhuluma',
  listening: 'Ngilalele… khuluma manje',
  speakNow: 'Khuluma lokho ofuna — njengokuthi "Ngifuna ukubona udokotela"',
  or: 'kumbe',
  menuTitle: 'Ngingakusiza njani lamuhla?',
  changeLanguage: 'Shintsha Ulimi',
  seeDoctor: 'Bona uDokotela',
  seeDoctorSub: 'Odokotela lezingcitshi',
  getMedication: 'Thola Umuthi',
  getMedicationSub: 'Hlola isitoko sepharmacy',
  symptomCheck: 'Hlola Izimpawu',
  symptomCheckSub: 'Ukuhlolwa kokuqala',
  hospitalInfo: 'Ulwazi lwesibhedlela',
  hospitalInfoSub: 'Amasevisi, imali & imithetho',
  visitSomeone: 'Vakashela Umuntu Owamukelwe',
  visitSomeoneSub: 'Thola izihlobo eziwamukelwe',
  findFacilities: 'Thola Izindawo',
  findFacilitiesSub: 'Imaphu & izindlela',
  medicalFees: 'Imali Yezokwelapha',
  medicalFeesSub: 'Ulwazi lwamanani',
  checkQueue: 'Hlola Umugqa Wami',
  checkQueueSub: 'Isikhathi sokulinda & indawo',
  askAnything: 'Ngibuze noma ini',
  suppliesBelow: 'Izinto zamahhala zitholakala ngezansi kwe-kiosk',
}

// Fallback: all other languages map to English for now
// (Shona and Ndebele are the main local languages expected)
const fallback = en

const TRANSLATION_MAP: Record<string, Translations> = {
  en,
  sn,
  nd,
  to: { ...en, welcome: 'Mwane ku\nMutare Provincial Hospital', selectLanguage: 'Sola lulimi lwako', tapToSpeak: 'Kanyata kutaala', menuTitle: 'Ndilaabona buti lelo?', changeLanguage: 'Sola Lulimi Bukweli', or: 'nkamu' },
  ch: { ...en, welcome: 'Takulandirani ku\nMutare Provincial Hospital', selectLanguage: 'Sankhani chilankhulo chanu', tapToSpeak: 'Khudumira kulankhula', menuTitle: 'Ndingakuthandizeni bwanji lero?', changeLanguage: 'Sinthani Chilankhulo', or: 'kapena' },
}

export function getTranslations(langCode: string): Translations {
  return TRANSLATION_MAP[langCode] ?? fallback
}

export function t(langCode: string, key: TranslationKey): string {
  return getTranslations(langCode)[key] ?? en[key]
}
