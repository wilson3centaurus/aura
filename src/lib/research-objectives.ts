export type ResearchObjectiveId = 'objective-1' | 'objective-2' | 'objective-3' | 'objective-4'

export interface ResearchObjective {
  id: ResearchObjectiveId
  number: string
  title: string
  summary: string
  tapHint: string
  openHint: string
  showcaseRoute: string
  primaryFeature: string
  featureRoutes: Array<{ label: string; href: string; description: string }>
}

export const RESEARCH_OBJECTIVES: ResearchObjective[] = [
  {
    id: 'objective-1',
    number: '01',
    title: 'Develop a touch-based patient kiosk with queueing, doctor availability, patient search, and secure interfaces.',
    summary: 'Touch-first booking, appointment tracking, doctor availability, and patient search are demonstrated across the kiosk flow.',
    tapHint: 'Tap once to preview this objective.',
    openHint: 'Double tap to open the showcase.',
    showcaseRoute: '/kiosk/showcase/objective-1',
    primaryFeature: 'Touch kiosk operations',
    featureRoutes: [
      { label: 'Book Appointment', href: '/kiosk/doctors?demo=objective-1', description: 'Shows doctor availability, appointment capture, and validation.' },
      { label: 'Track Queue', href: '/kiosk/track', description: 'Demonstrates queue and appointment status tracking.' },
      { label: 'Patient Search', href: '/kiosk/visit', description: 'Shows admitted-patient search and visitor verification.' },
    ],
  },
  {
    id: 'objective-2',
    number: '02',
    title: 'Enable multilingual voice and touch interaction for most Zimbabwean languages.',
    summary: 'Language selection persists through the kiosk and the assistant responds in the chosen language for touch and voice journeys.',
    tapHint: 'Tap once to preview this objective.',
    openHint: 'Double tap to open the showcase.',
    showcaseRoute: '/kiosk/showcase/objective-2',
    primaryFeature: 'Multilingual voice + touch',
    featureRoutes: [
      { label: 'Voice Assistant', href: '/kiosk/assistant?demo=objective-2', description: 'Live multimodal assistant with language-aware responses.' },
      { label: 'Main Menu', href: '/kiosk/menu', description: 'Touch navigation in the currently selected language.' },
      { label: 'Phone Voice Demo', href: '/patient/assistant?voice=true', description: 'Seamless phone-based voice conversation experience.' },
    ],
  },
  {
    id: 'objective-3',
    number: '03',
    title: 'Implement AI-based symptom assessment and triage for patient prioritisation.',
    summary: 'The symptom checker uses AI-assisted triage and urgency scoring to recommend the right department and next step.',
    tapHint: 'Tap once to preview this objective.',
    openHint: 'Double tap to open the showcase.',
    showcaseRoute: '/kiosk/showcase/objective-3',
    primaryFeature: 'AI symptom triage',
    featureRoutes: [
      { label: 'Symptom Checker', href: '/kiosk/symptoms?demo=objective-3', description: 'Severity scoring, AI triage, and department recommendation.' },
      { label: 'Doctor Booking', href: '/kiosk/doctors?demo=objective-3', description: 'Moves patients from symptom reasoning into doctor assignment.' },
      { label: 'AI Assistant', href: '/kiosk/assistant?demo=objective-3', description: 'Voice/chat assistant can continue symptom-driven booking.' },
    ],
  },
  {
    id: 'objective-4',
    number: '04',
    title: 'Provide real-time hospital information on drugs, fees, and navigation.',
    summary: 'Live medication, fees, and navigation data are presented through searchable pages, maps, QR directions, and voice guidance.',
    tapHint: 'Tap once to preview this objective.',
    openHint: 'Double tap to open the showcase.',
    showcaseRoute: '/kiosk/showcase/objective-4',
    primaryFeature: 'Live hospital information',
    featureRoutes: [
      { label: 'Hospital Information', href: '/kiosk/information?demo=objective-4', description: 'Fees, policies, and operating information from the live database.' },
      { label: 'Find Facilities', href: '/kiosk/facilities?demo=objective-4', description: 'Step-by-step navigation with maps and QR directions.' },
      { label: 'Medication Search', href: '/kiosk/medication', description: 'Drug lookup and pharmacy-related information.' },
    ],
  },
]

export function getResearchObjective(objectiveId?: string | null) {
  return RESEARCH_OBJECTIVES.find(objective => objective.id === objectiveId) || null
}