/**
 * AURA Kiosk Ã¢â‚¬â€œ lightweight i18n translations
 * Covers all 16 official Zimbabwean languages + Sign Language (en fallback).
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

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ English Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const en: Translations = {
  welcome: 'Welcome to\nMutare Provincial Hospital',
  subtitle: 'Mauya Ã‚Â· Siyakwamukela Ã‚Â· Welcome',
  selectLanguage: 'Select your language',
  tapToSpeak: 'Tap to speak',
  listening: 'ListeningÃ¢â‚¬Â¦ speak now',
  speakNow: 'Say what you need Ã¢â‚¬â€ e.g. "I need to see a doctor"',
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

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Shona (ChiShona) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const sn: Translations = {
  welcome: 'Mauya ku\nMutare Provincial Hospital',
  subtitle: 'Mauya Ã‚Â· Siyakwamukela Ã‚Â· Welcome',
  selectLanguage: 'Sarudza mutauro wako',
  tapToSpeak: 'Bata kutaura',
  listening: 'NdinorwaÃ¢â‚¬Â¦ taura ikozvino',
  speakNow: 'Taura zvaunoda Ã¢â‚¬â€ sekuti "Ndikuda kuona chiremba"',
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

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Ndebele (isiNdebele) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const nd: Translations = {
  welcome: 'Siyakwamukela e\nMutare Provincial Hospital',
  subtitle: 'Mauya Ã‚Â· Siyakwamukela Ã‚Â· Welcome',
  selectLanguage: 'Khetha ulimi lwakho',
  tapToSpeak: 'Thepha ukukhuluma',
  listening: 'NgilaleleÃ¢â‚¬Â¦ khuluma manje',
  speakNow: 'Khuluma lokho ofuna Ã¢â‚¬â€ njengokuthi "Ngifuna ukubona udokotela"',
  or: 'kumbe',
  menuTitle: 'Ngingakusiza njani lamuhla?',
  changeLanguage: 'Shintsha Ulimi',
  seeDoctor: 'Bona uDokotela',
  seeDoctorSub: 'Odokotela lezingcitshi',
  getMedication: 'Thola Umuthi',
  getMedicationSub: 'Hlola isitoko sepharmacy',
  symptomCheck: 'Hlola Izimpawu',
  symptomCheckSub: 'Ukuhlolwa kokuqala',
  hospitalInfo: 'Ulwazi lweSibhedlela',
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

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Tonga (chiTonga) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const to: Translations = {
  welcome: 'Muyoo ku\nMutare Provincial Hospital',
  subtitle: 'Mauya Ã‚Â· Siyakwamukela Ã‚Â· Welcome',
  selectLanguage: 'Sola ciimo cabo',
  tapToSpeak: 'Kanya kutaala',
  listening: 'NdinobwezaÃ¢â‚¬Â¦ taala kuli lino',
  speakNow: 'Taala naakuyanda Ã¢â‚¬â€ "Ndinayanda kubona udokotela"',
  or: 'nokuba',
  menuTitle: 'Ndinagwasya buti lelo?',
  changeLanguage: 'Sola Ciimo Cibeela',
  seeDoctor: 'Bona Udokotela',
  seeDoctorSub: 'Badokotela bansimba',
  getMedication: 'Bona Mankhwala',
  getMedicationSub: 'Langa mankhwala aa pharmacy',
  symptomCheck: 'Langa Zikolwe',
  symptomCheckSub: 'Langisya zikolwe zyako',
  hospitalInfo: 'Ciindi ca Chipatala',
  hospitalInfoSub: 'Mabonelo, ndalama & milawo',
  visitSomeone: 'Endeenda Muntu Ulazilwe',
  visitSomeoneSub: 'Sala banakwe balazilwe',
  findFacilities: 'Sala Nzila',
  findFacilitiesSub: 'Mapu & nzila',
  medicalFees: 'Ndalama zyachipatala',
  medicalFeesSub: 'Ciindi ca mitengo',
  checkQueue: 'Langa Queue Yangu',
  checkQueueSub: 'Ciindi cabindila & ndawo',
  askAnything: 'Buzya chilichonse',
  suppliesBelow: 'Zintu zyamayi ziri pansi pa kiosk',
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Chibarwe Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Closely related to Korekore/Shona (northeastern Zimbabwe)
const cb: Translations = {
  welcome: 'Mauya ku\nMutare Provincial Hospital',
  subtitle: 'Mauya Ã‚Â· Siyakwamukela Ã‚Â· Welcome',
  selectLanguage: 'Sarudza rurimi rwako',
  tapToSpeak: 'Bata kutaura',
  listening: 'NdinorwaÃ¢â‚¬Â¦ taura zvino',
  speakNow: 'Taura zvaunoda Ã¢â‚¬â€ "Ndida kuona chiremba"',
  or: 'kana',
  menuTitle: 'Ndinokubatsira sei nhasi?',
  changeLanguage: 'Shandura Rurimi',
  seeDoctor: 'Ona Chiremba',
  seeDoctorSub: 'Vanachiremba vezvikamu',
  getMedication: 'Tora Mushonga',
  getMedicationSub: 'Tarisa mushonga wephama',
  symptomCheck: 'Tarisa Zvirwere',
  symptomCheckSub: 'Ongorora zvirwere zvako',
  hospitalInfo: 'Ruzivo rweChipatala',
  hospitalInfoSub: 'Masevhisi, mitengo & mitemo',
  visitSomeone: 'Shanya Munhu Akugadzikwa',
  visitSomeoneSub: 'Tsvaga hama dzakugadzikwa',
  findFacilities: 'Tsvaga Nzvimbo',
  findFacilitiesSub: 'Mamepu & nzira',
  medicalFees: 'Mitengo yeMishonga',
  medicalFeesSub: 'Ruzivo rwemitengo',
  checkQueue: 'Tarisa Mutsara Wangu',
  checkQueueSub: 'Nguva yekumirira & chinzvimbo',
  askAnything: 'Ndibvunze chinhu chipi nechipi',
  suppliesBelow: 'Zvinhu zvemahara zviri pasi pekiosk ino',
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Kalanga Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Spoken in Bulilimamangwe/Plumtree area, related to Shona with Ndebele influence
const kl: Translations = {
  welcome: 'Tivha ku\nMutare Provincial Hospital',
  subtitle: 'Mauya Ã‚Â· Siyakwamukela Ã‚Â· Welcome',
  selectLanguage: 'Khoroya luambo lwako',
  tapToSpeak: 'Dzama kutaura',
  listening: 'NdinorwaÃ¢â‚¬Â¦ taura hanu',
  speakNow: 'Taura zwaundoda Ã¢â‚¬â€ "Ndida kubona ndotela"',
  or: 'kana',
  menuTitle: 'Ndinogwasya buti lhelo?',
  changeLanguage: 'Shandura Luambo',
  seeDoctor: 'Bona Ndotela',
  seeDoctorSub: 'Vantotela vebhizamu',
  getMedication: 'Tora Mushonga',
  getMedicationSub: 'Tarisa mushonga we pharmacy',
  symptomCheck: 'Tarisa Zvirwere',
  symptomCheckSub: 'Ongorora zvirwere zvako',
  hospitalInfo: 'Ruzivo rweChipatala',
  hospitalInfoSub: 'Masevhisi, ndalama & mitemo',
  visitSomeone: 'Shanya Munhu Akugadzikwa',
  visitSomeoneSub: 'Tsvaga hama dzakugadzikwa',
  findFacilities: 'Tsvaga Nzvimbo',
  findFacilitiesSub: 'Mamepu & nzira',
  medicalFees: 'Mitengo yeMushonga',
  medicalFeesSub: 'Ruzivo rwemitengo',
  checkQueue: 'Tarisa Queue Yangu',
  checkQueueSub: 'Nguva yekumirira & chinzvimbo',
  askAnything: 'Ndibvunze chinhu chipi nechipi',
  suppliesBelow: 'Zvinhu zvemahara pasi pekiosk ino',
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Koisan Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Khoisan community in Zimbabwe Ã¢â‚¬â€ Khoisan-speaking communities are typically
// also fluent in Ndebele; English used as interface language here.
const ko: Translations = { ...en }

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Nambya Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Bantu language spoken in Hwange/Lupane area, related to Kalanga
const nm: Translations = {
  welcome: 'Kalotika ku\nMutare Provincial Hospital',
  subtitle: 'Mauya Ã‚Â· Siyakwamukela Ã‚Â· Welcome',
  selectLanguage: 'Khetha olimi olwako',
  tapToSpeak: 'Tsusya kukhuluuma',
  listening: 'NdinorwaÃ¢â‚¬Â¦ khuluuma zwino',
  speakNow: 'Khuluuma zwaundoda Ã¢â‚¬â€ "Ndida kubona udokotela"',
  or: 'nkamu',
  menuTitle: 'Ndinobona buti elo?',
  changeLanguage: 'Shandura Olimi',
  seeDoctor: 'Bona Udokotela',
  seeDoctorSub: 'Vadokotela vamazamu',
  getMedication: 'Tora Mushonga',
  getMedicationSub: 'Langa mushonga we pharmacy',
  symptomCheck: 'Langa Zvirwere',
  symptomCheckSub: 'Ongorora zvirwere zvako',
  hospitalInfo: 'Ruzivo rweChipatala',
  hospitalInfoSub: 'Masevhisi, ndalama & mitemo',
  visitSomeone: 'Shanya Munhu Akugadzikwa',
  visitSomeoneSub: 'Tsvaga hama dzakugadzikwa',
  findFacilities: 'Tsvaga Nzvimbo',
  findFacilitiesSub: 'Mamepu & nzira',
  medicalFees: 'Mitengo yeMushonga',
  medicalFeesSub: 'Ruzivo rwemitengo',
  checkQueue: 'Langa Queue Yangu',
  checkQueueSub: 'Nguva yekumirira & chinzvimbo',
  askAnything: 'Ndibvunze chinhu chipi nechipi',
  suppliesBelow: 'Zvinhu zvemahara pasi pekiosk ino',
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Ndau Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Shona dialect spoken in Chimanimani/Chipinge area
const na: Translations = {
  welcome: 'Mauya ku\nMutare Provincial Hospital',
  subtitle: 'Mauya Ã‚Â· Tichaririwa Ã‚Â· Welcome',
  selectLanguage: 'Sarudza rurimi rurako',
  tapToSpeak: 'Bata kutaura',
  listening: 'NdinorwaÃ¢â‚¬Â¦ taura zvino',
  speakNow: 'Taura zvaunoda Ã¢â‚¬â€ "Ndida kuona chiremba"',
  or: 'kana',
  menuTitle: 'Ndinogona kukubatsira sei nhasi?',
  changeLanguage: 'Chinja Rurimi',
  seeDoctor: 'Ona Chiremba',
  seeDoctorSub: 'Vanachiremba vezvikamu',
  getMedication: 'Tora Mushonga',
  getMedicationSub: 'Tarisa mushonga wephama',
  symptomCheck: 'Tarisa Zvirwere',
  symptomCheckSub: 'Ongorora zvirwere zvako',
  hospitalInfo: 'Ruzivo rweChipatala',
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

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Shangani Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Tsonga/Shangaan language spoken in Matabeleland South near Beit Bridge
const sh: Translations = {
  welcome: 'U amukarisiwa eka\nMutare Provincial Hospital',
  subtitle: 'Mauya Ã‚Â· Siyakwamukela Ã‚Â· Welcome',
  selectLanguage: 'Hlawula ririmi ra wena',
  tapToSpeak: 'Tshova ku vulavula',
  listening: 'Ndzi twananaÃ¢â‚¬Â¦ vulavula sweswi',
  speakNow: 'Vulavula loko u swi lavaka Ã¢â‚¬â€ "Ndzi lava ku vona dokotela"',
  or: 'kumbe',
  menuTitle: 'Ndzi nga ku pfuneta njhani namuntlha?',
  changeLanguage: 'Cinca Ririmi',
  seeDoctor: 'Vona Dokotela',
  seeDoctorSub: 'Swirho swa matimba',
  getMedication: 'Hola Mankhwala',
  getMedicationSub: 'Kuma mankhwala ya pharmacy',
  symptomCheck: 'Hlola Swibyelelo',
  symptomCheckSub: 'Kuma vuxokoxoko',
  hospitalInfo: 'Vurimi Bya Hospitala',
  hospitalInfoSub: 'Mitirho, mali & milawu',
  visitSomeone: 'Endzela Munhu Loyi a Amukela',
  visitSomeoneSub: 'Kuma banghana lavo amukeriwaka',
  findFacilities: 'Kuma Tindhawu',
  findFacilitiesSub: 'Timaphu & swirhendzelo',
  medicalFees: 'Tinhlamulo ta Vuvabyi',
  medicalFeesSub: 'Vurimi bya tindhawu',
  checkQueue: 'Hlola Queue Ya Mina',
  checkQueueSub: 'Nkarhi wa ku rindza & ndhawu',
  askAnything: 'Navelisa swivutiwa',
  suppliesBelow: 'Switirhisiwa swa mahala swi kona ehansi ka kiosk',
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Sotho (Sesotho) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const st: Translations = {
  welcome: 'Re a o amohela ho\nMutare Provincial Hospital',
  subtitle: 'Mauya Ã‚Â· Siyakwamukela Ã‚Â· Re a o amohela',
  selectLanguage: 'Khetha puo ea hao',
  tapToSpeak: 'Tobetsa ho bua',
  listening: 'Ke utloaÃ¢â‚¬Â¦ bua hona joale',
  speakNow: 'Bua seo o se batlang Ã¢â‚¬â€ "Ke batla ho bona ngaka"',
  or: 'kapa',
  menuTitle: 'Nka u thusa joang kajeno?',
  changeLanguage: 'Fetola Puo',
  seeDoctor: 'Bona Ngaka',
  seeDoctorSub: 'Lingaka le lineheli',
  getMedication: 'Fumana Meriana',
  getMedicationSub: 'Hlahloba serapo sa pharmacy',
  symptomCheck: 'Hlahloba Matshwao',
  symptomCheckSub: 'Hlahloba triage',
  hospitalInfo: 'Tsebo ya Sepetlele',
  hospitalInfoSub: 'Lits\'ebeletso, lichelete & molao',
  visitSomeone: 'Etela Motho ea Nkuoang',
  visitSomeoneSub: 'Fumana bafo ba nkuoang',
  findFacilities: 'Fumana Dibaka',
  findFacilitiesSub: 'Liforomo & mekhoa',
  medicalFees: 'Lichelete tsa Balaoli',
  medicalFeesSub: 'Tsebo ya litheko',
  checkQueue: 'Hlola Queue ea Ka',
  checkQueueSub: 'Nako le sebaka',
  askAnything: 'Buza nthoe efe kapa efe',
  suppliesBelow: 'Lintho tsa mahala li fumaneha ka tlaase ho kiosk',
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Venda (Tshivenda) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const ve: Translations = {
  welcome: 'Ri a ni tanganedza kha\nMutare Provincial Hospital',
  subtitle: 'Mauya Ã‚Â· Siyakwamukela Ã‚Â· Ri a ni tanganedza',
  selectLanguage: 'Nanga luambo lwau',
  tapToSpeak: 'Kanda u amba',
  listening: 'Ndi pfaÃ¢â‚¬Â¦ amba zwino',
  speakNow: 'Amba zwe na wanala Ã¢â‚¬â€ "Ndi toda u vhona tshiremba"',
  or: 'kana',
  menuTitle: 'Ndi nga ni thusa hani Ã¡Â¹â€¹amusi?',
  changeLanguage: 'Shandukisa Luambo',
  seeDoctor: 'Vhona Tshiremba',
  seeDoctorSub: 'Vhadzimeli na vhashumi',
  getMedication: 'Wana Mushonga',
  getMedicationSub: 'Sedzesa khethe ya pharmacy',
  symptomCheck: 'Langa Zwibveledzwa',
  symptomCheckSub: 'Sedzesa zwibveledzwa zwau',
  hospitalInfo: 'Mafhungo a Hospitala',
  hospitalInfoSub: 'Tshumelo, ndalama & ndaulo',
  visitSomeone: 'Vhona MuÃ¡Â¹â€¦we Mutu',
  visitSomeoneSub: 'Wana vhane vha vho nangwa',
  findFacilities: 'Wana NÃ¡Â¸â€œila',
  findFacilitiesSub: 'Mapu na nÃ¡Â¸â€œila dza u ya',
  medicalFees: 'Ndalama dza Vhulamueli',
  medicalFeesSub: 'Mafhungo a ndalama',
  checkQueue: 'Ã¡Â¹Â°ariÃ¡Â¹Â±a Queue Yanga',
  checkQueueSub: 'Tshifhinga na ndaedzo',
  askAnything: 'Vhudzisa ndivho nndwe',
  suppliesBelow: 'Zwithu zwi mahala zwi wanala fhasi ha kiosk',
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Xhosa (isiXhosa) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const xh: Translations = {
  welcome: 'Wamkelekile e\nMutare Provincial Hospital',
  subtitle: 'Mauya Ã‚Â· Siyakwamukela Ã‚Â· Wamkelekile',
  selectLanguage: 'Khetha ulwimi lwakho',
  tapToSpeak: 'Cofa ukukhuluma',
  listening: 'NdiphulaphuleÃ¢â‚¬Â¦ thetha ngoku',
  speakNow: 'Thetha ofuna ukuthethwa Ã¢â‚¬â€ "Ndifuna ukubona ugqirha"',
  or: 'okanye',
  menuTitle: 'Ndinokunceda njani namhlanje?',
  changeLanguage: 'Tshintsha Ulwimi',
  seeDoctor: 'Bona uGqirha',
  seeDoctorSub: 'Oogqirha nezingcali',
  getMedication: 'Fumana Iyeza',
  getMedicationSub: 'Jonga isitoko sepharmacy',
  symptomCheck: 'Hlola Iimpawu',
  symptomCheckSub: 'Uvavanyo lokuqala',
  hospitalInfo: 'Ulwazi lweSibhedlela',
  hospitalInfoSub: 'Iinkonzo, imali & imigaqo',
  visitSomeone: 'Ndwendwela Omnye Umntu',
  visitSomeoneSub: 'Fumana izihlobo ezihleli',
  findFacilities: 'Fumana Iindawo',
  findFacilitiesSub: 'Iimapi & iindlela',
  medicalFees: 'Imali Yezonyango',
  medicalFeesSub: 'Ulwazi lwamanani',
  checkQueue: 'Jonga Umgca Wam',
  checkQueueSub: 'Ixesha lokulinda & indawo',
  askAnything: 'Buza nayiphi na into',
  suppliesBelow: 'Izinto zamahhala zifumaneka phantsi kwekiosk',
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Chewa (Chichewa / Nyanja) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const ch: Translations = {
  welcome: 'Takulandirani ku\nMutare Provincial Hospital',
  subtitle: 'Mauya Ã‚Â· Siyakwamukela Ã‚Â· Takulandirani',
  selectLanguage: 'Sankhani chilankhulo chanu',
  tapToSpeak: 'Khudumira kulankhula',
  listening: 'NdikumvaÃ¢â‚¬Â¦ lankhula hanaho',
  speakNow: 'Lankhula chomwe mukufuna Ã¢â‚¬â€ "Ndikufuna kukumana ndi dokotala"',
  or: 'kapena',
  menuTitle: 'Ndingakuthandizeni bwanji lero?',
  changeLanguage: 'Sinthani Chilankhulo',
  seeDoctor: 'Onani Dokotala',
  seeDoctorSub: 'Madokotala ndi akatswiri',
  getMedication: 'Yerekezerani Mankhwala',
  getMedicationSub: 'Onani mankhwala a phama',
  symptomCheck: 'Onani Zizindikiro',
  symptomCheckSub: 'Kuyesedwa koyamba',
  hospitalInfo: 'Chidziwitso cha Chipatala',
  hospitalInfoSub: 'Ntchito, ndalama & malamulo',
  visitSomeone: 'Chipikireni Munthu Wolaza',
  visitSomeoneSub: 'Pezani abale alaza',
  findFacilities: 'Pezani Malo',
  findFacilitiesSub: 'Mapu & njira',
  medicalFees: 'Ndalama za Chipatala',
  medicalFeesSub: 'Chidziwitso cha mitengo',
  checkQueue: 'Onani Mzere Wanga',
  checkQueueSub: 'Nthawi kuyangana & malo',
  askAnything: 'Fumbanitsani chilichonse',
  suppliesBelow: 'Zinthu zamayi zinapezeka pansi pa kiosk',
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Tswana (Setswana) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const ts: Translations = {
  welcome: 'O amogetswe kwa\nMutare Provincial Hospital',
  subtitle: 'Mauya Ã‚Â· Siyakwamukela Ã‚Â· O amogetswe',
  selectLanguage: 'Tlhopha puo ya gago',
  tapToSpeak: 'Kgontsha go bua',
  listening: 'Ke a go utlwaÃ¢â‚¬Â¦ bua jaanong',
  speakNow: 'Bua se o se batlang Ã¢â‚¬â€ "Ke batla go bona ngaka"',
  or: 'gongwe',
  menuTitle: 'Nka go thusa jang gompieno?',
  changeLanguage: 'Fetola Puo',
  seeDoctor: 'Bona Ngaka',
  seeDoctorSub: 'Dingaka le dingaka tsa makgaolakgang',
  getMedication: 'Bona Ditlhare',
  getMedicationSub: 'Tlhatlhoba ditlhare tsa pharmacy',
  symptomCheck: 'Tlhatlhoba Matshwao',
  symptomCheckSub: 'Tlhatlhoba triage',
  hospitalInfo: 'Tshedimosetso ya Sepetlhele',
  hospitalInfoSub: 'Ditirelo, madi le melao',
  visitSomeone: 'Etela Motho yo o Tsangwang',
  visitSomeoneSub: 'Bona ba lelapa jo ba tsangwang',
  findFacilities: 'Bona Dibaka',
  findFacilitiesSub: 'Dimmapa le ditsela',
  medicalFees: 'Madi a Kalafi',
  medicalFeesSub: 'Tshedimosetso ya ditlhelo',
  checkQueue: 'Leba Queue ya Me',
  checkQueueSub: 'Nako ya go letela & lefelo',
  askAnything: 'Botsa se se leng gone',
  suppliesBelow: 'Dilo tsa mahala di kwa fa tlase ga kiosk',
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Sign Language Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Sign Language mode redirects to camera mode; falls back to English UI text
const sl: Translations = { ...en }

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ Translation map Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const TRANSLATION_MAP: Record<string, Translations> = {
  en, sn, nd, to, cb, kl, ko, nm, na, sh, st, ve, xh, ch, ts, sl,
}

export function getTranslations(langCode: string): Translations {
  return TRANSLATION_MAP[langCode] ?? en
}

export function t(langCode: string, key: TranslationKey): string {
  return getTranslations(langCode)[key] ?? en[key]
}
