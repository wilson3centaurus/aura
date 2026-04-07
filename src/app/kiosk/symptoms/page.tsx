'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { SYMPTOM_CATEGORIES } from '@/types'
import { FaChevronLeft, FaClipboardList, FaUserDoctor, FaClock, FaCalendarDays, FaCalendarWeek, FaPills, FaStore } from 'react-icons/fa6'
import { MdWarning, MdMedicalServices, MdCheckCircle } from 'react-icons/md'

type Step = 'category' | 'details' | 'result'

interface AssessmentResult {
  urgency: 'EMERGENCY' | 'URGENT' | 'MODERATE' | 'ROUTINE'
  department: string
  message: string
  possibleConditions: string[]
  suggestedMeds: string[]
  goToPharmacy: boolean
}

export default function KioskSymptoms() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('category')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [severity, setSeverity] = useState(5)
  const [duration, setDuration] = useState('')
  const [additionalSymptoms, setAdditionalSymptoms] = useState<string[]>([])
  const [result, setResult] = useState<AssessmentResult | null>(null)

  const additionalOptions = ['Fever', 'Nausea', 'Dizziness', 'Difficulty Breathing', 'Vomiting', 'Fatigue', 'Loss of appetite']

  const toggleSymptom = (s: string) => {
    setAdditionalSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const runAssessment = () => {
    let urgency: AssessmentResult['urgency'] = 'ROUTINE'
    let department = 'General Out-Patient Department (OPD)'
    let possibleConditions: string[] = []
    let suggestedMeds: string[] = []
    let goToPharmacy = false

    const hasFever = additionalSymptoms.includes('Fever')
    const hasBreathing = additionalSymptoms.includes('Difficulty Breathing')
    const hasNausea = additionalSymptoms.includes('Nausea') || additionalSymptoms.includes('Vomiting')
    const hasDizzy = additionalSymptoms.includes('Dizziness')

    if (hasBreathing) {
      urgency = 'EMERGENCY'
      department = 'Emergency Department'
      possibleConditions = ['Severe Asthma Attack', 'Pneumonia', 'Pulmonary Embolism', 'Anaphylaxis']
      goToPharmacy = false
    } else if (selectedCategory === 'injury' && severity >= 8) {
      urgency = 'EMERGENCY'
      department = 'Emergency / Casualty'
      possibleConditions = ['Severe Trauma', 'Fracture', 'Internal Bleeding', 'Head Injury']
      goToPharmacy = false
    } else if (selectedCategory === 'maternity') {
      urgency = 'URGENT'
      department = 'Maternity Ward'
      possibleConditions = ['Active Labour', 'Pre-eclampsia', 'Pregnancy Complications', 'Ectopic Pregnancy']
      goToPharmacy = false
    } else if (selectedCategory === 'fever') {
      if (severity >= 7 || (hasFever && hasNausea && hasDizzy)) {
        urgency = 'URGENT'
        department = 'General Out-Patient Department (OPD)'
        possibleConditions = ['Malaria', 'Typhoid Fever', 'Severe Viral Infection', 'Urinary Tract Infection']
        goToPharmacy = false
      } else {
        urgency = 'MODERATE'
        possibleConditions = ['Malaria', 'Common Flu', 'Typhoid Fever', 'Upper Respiratory Infection']
        suggestedMeds = ['Paracetamol 500 mg (for fever and discomfort)', 'Oral Rehydration Salts (ORS) — stay hydrated']
        goToPharmacy = severity < 6
      }
    } else if (selectedCategory === 'child') {
      if (severity >= 7) {
        urgency = 'URGENT'
        department = 'Paediatrics Ward'
        possibleConditions = ['Paediatric Malaria', 'Severe Pneumonia', 'Febrile Convulsion', 'Meningitis']
        goToPharmacy = false
      } else {
        urgency = 'MODERATE'
        department = 'Paediatrics Clinic'
        possibleConditions = ['Malaria', 'Upper Respiratory Infection', 'Gastroenteritis', 'Chickenpox']
        suggestedMeds = ['Paracetamol syrup (age-appropriate dose)', 'Oral Rehydration Salts (ORS)']
        goToPharmacy = severity < 5
      }
    } else if (selectedCategory === 'pain') {
      if (severity >= 8) {
        urgency = 'URGENT'
        department = 'Internal Medicine / Surgical'
        possibleConditions = hasFever
          ? ['Appendicitis', 'Pyelonephritis (Kidney Infection)', 'Peritonitis']
          : ['Kidney Stones', 'Gallstones', 'Peptic Ulcer', 'Acute Abdomen']
        goToPharmacy = false
      } else if (severity >= 5) {
        urgency = 'MODERATE'
        possibleConditions = ['Tension Headache', 'Gastritis', 'Muscle Strain', 'Menstrual Cramps']
        suggestedMeds = ['Paracetamol 500 mg (for pain)', 'Ibuprofen 400 mg (with food, adults only)']
        goToPharmacy = true
      } else {
        urgency = 'ROUTINE'
        possibleConditions = ['Muscle Tension', 'Mild Headache', 'Minor Bruising']
        suggestedMeds = ['Paracetamol 500 mg as needed', 'Rest and adequate hydration']
        goToPharmacy = true
      }
    } else if (selectedCategory === 'cold') {
      if (severity >= 7 || hasFever) {
        urgency = 'MODERATE'
        department = 'General Out-Patient Department (OPD)'
        possibleConditions = ['Influenza (Flu)', 'Sinusitis', 'Bronchitis', 'Early Pneumonia']
        suggestedMeds = severity >= 7 ? [] : ['Paracetamol 500 mg', 'Vitamin C 500 mg', 'Saline nasal drops']
        goToPharmacy = severity < 7
      } else {
        urgency = 'ROUTINE'
        possibleConditions = ['Common Cold', 'Allergic Rhinitis', 'Sinusitis']
        suggestedMeds = ['Paracetamol 500 mg (for aches)', 'Cetirizine 10 mg (antihistamine)', 'Saline nasal spray', 'Vitamin C supplements']
        goToPharmacy = true
      }
    } else if (selectedCategory === 'injury') {
      if (severity >= 5) {
        urgency = 'URGENT'
        department = 'Emergency / Casualty'
        possibleConditions = ['Laceration / Deep Cut', 'Sprain or Strain', 'Fracture (possible)', 'Concussion']
        goToPharmacy = false
      } else {
        urgency = 'ROUTINE'
        possibleConditions = ['Minor Bruise', 'Superficial Abrasion', 'Soft Tissue Injury']
        suggestedMeds = ['Antiseptic cream (e.g. Savlon) for cuts', 'Ibuprofen gel (for bruising)', 'Adhesive bandage / plaster']
        goToPharmacy = true
      }
    } else if (selectedCategory === 'chronic') {
      urgency = severity >= 7 ? 'URGENT' : 'MODERATE'
      department = 'Chronic Disease Clinic'
      possibleConditions = ['Diabetes Follow-up', 'Hypertension Management', 'Asthma Control', 'HIV/ARV Review']
      suggestedMeds = urgency === 'MODERATE' ? ['Continue your prescribed medication — do not skip doses'] : []
      goToPharmacy = urgency === 'MODERATE'
    } else {
      if (severity >= 7 || hasFever) {
        urgency = 'URGENT'
        possibleConditions = ['Systemic Infection', 'Viral Illness', 'Malaria (rule out)']
        goToPharmacy = false
      } else {
        urgency = 'ROUTINE'
        possibleConditions = ['Minor Illness', 'Viral Syndrome', 'Nutritional Deficiency']
        suggestedMeds = ['Paracetamol 500 mg (for discomfort)', 'Multivitamin supplement']
        goToPharmacy = true
      }
    }

    const messages: Record<string, string> = {
      EMERGENCY: 'Go to Emergency immediately or alert a nearby staff member now.',
      URGENT: 'Please see a doctor as soon as possible — join the OPD queue now.',
      MODERATE: severity >= 5 ? 'See a doctor today. You may manage mild symptoms temporarily.' : 'Visit a doctor soon or try OTC remedies from the pharmacy first.',
      ROUTINE: 'You can visit the pharmacy for over-the-counter treatment, or book a routine appointment.',
    }

    setResult({ urgency, department, message: messages[urgency], possibleConditions, suggestedMeds, goToPharmacy })
    setStep('result')
  }

  const urgencyColors: Record<string, string> = {
    EMERGENCY: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30',
    URGENT: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30',
    MODERATE: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/30',
    ROUTINE: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30',
  }

  const urgencyDots: Record<string, string> = {
    EMERGENCY: 'bg-red-500',
    URGENT: 'bg-orange-500',
    MODERATE: 'bg-yellow-500',
    ROUTINE: 'bg-emerald-500',
  }

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <header className="hero-gradient px-5 py-4 flex items-center gap-3 shadow-lg">
        <button
          onClick={() => step === 'category' ? router.push('/kiosk/menu') : setStep(step === 'details' ? 'category' : 'details')}
          className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
        >
          <FaChevronLeft size={14} />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-base leading-tight">Symptom Check</h1>
          <p className="text-white/65 text-xs">
            {step === 'category' ? 'Select your main concern' : step === 'details' ? 'Tell us more' : 'Assessment results'}
          </p>
        </div>
        <FaClipboardList className="text-white/60 text-2xl" />
      </header>

      {/* Disclaimer */}
      <div className="mx-4 mt-3 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 flex items-center gap-2">
        <MdWarning className="text-amber-500 flex-shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-400">This is not a diagnosis. Please consult a doctor for medical advice.</p>
      </div>

      <main className="flex-1 p-4 overflow-y-auto">

        {step === 'category' && (
          <div className="max-w-2xl mx-auto">
            <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
              What brings you to the hospital today?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {SYMPTOM_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setStep('details') }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-gray-800/90 shadow-sm hover:shadow-md active:scale-[0.97] transition-all border border-gray-100 dark:border-gray-700"
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-100 text-left">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="max-w-lg mx-auto space-y-6">
            <div>
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                How severe is it? (1-10)
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xl">😊</span>
                <input
                  type="range" min="1" max="10" value={severity}
                  onChange={e => setSeverity(parseInt(e.target.value))}
                  className="flex-1 h-3 rounded-full appearance-none bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 cursor-pointer"
                />
                <span className="text-xl">😫</span>
                <span className="text-2xl font-black text-gray-800 dark:text-gray-100 w-8 text-center">{severity}</span>
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                How long have you had this?
              </label>
              <div className="flex gap-3">
                {[
                  { v: 'today', l: 'Today', icon: FaClock },
                  { v: 'days', l: 'Few Days', icon: FaCalendarDays },
                  { v: 'weeks', l: 'Weeks+', icon: FaCalendarWeek },
                ].map(opt => {
                  const Icon = opt.icon
                  return (
                    <button key={opt.v} onClick={() => setDuration(opt.v)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all ${
                        duration === opt.v
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                      }`}>
                      <Icon size={14} /> {opt.l}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Additional symptoms?
              </label>
              <div className="flex flex-wrap gap-2">
                {additionalOptions.map(s => (
                  <button key={s} onClick={() => toggleSymptom(s)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      additionalSymptoms.includes(s)
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={runAssessment}
              className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all shadow-lg">
              Get Assessment
            </button>
          </div>
        )}

        {step === 'result' && result && (
          <div className="max-w-2xl mx-auto space-y-4">

            {/* Urgency banner */}
            <div className={`p-5 rounded-2xl border-2 ${urgencyColors[result.urgency]}`}>
              <div className="flex items-center gap-2 mb-1">
                <MdMedicalServices className="text-xl" />
                <h2 className="text-base font-bold">Assessment Result</h2>
              </div>
              <div className="flex items-center gap-2 text-2xl font-black my-2">
                <div className={`w-4 h-4 rounded-full ${urgencyDots[result.urgency]} flex-shrink-0`} />
                {result.urgency}
              </div>
              <p className="font-semibold text-sm">Recommended: {result.department}</p>
              <p className="text-sm mt-1 opacity-90">{result.message}</p>
            </div>

            {/* Possible conditions */}
            {result.possibleConditions.length > 0 && (
              <div className="bg-white dark:bg-gray-800/90 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-xs font-black">?</span>
                  Possible Conditions
                </h3>
                <ul className="space-y-1.5">
                  {result.possibleConditions.map((c, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <MdCheckCircle className="text-blue-400 flex-shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] text-gray-400 mt-3">* These are possibilities based on your symptoms — only a doctor can diagnose you.</p>
              </div>
            )}

            {/* Pharmacy OTC suggestions */}
            {result.goToPharmacy && result.suggestedMeds.length > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-900/30 shadow-sm">
                <h3 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm mb-3 flex items-center gap-2">
                  <FaPills className="text-emerald-600" />
                  Over-the-Counter Options (Pharmacy)
                </h3>
                <ul className="space-y-1.5">
                  {result.suggestedMeds.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-emerald-800 dark:text-emerald-300">
                      <span className="text-emerald-500 font-bold flex-shrink-0">•</span>
                      {m}
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 opacity-80 mt-2">
                  Ask the hospital pharmacist before taking any medication. Follow label dosage instructions.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              {result.urgency === 'EMERGENCY' || result.urgency === 'URGENT' ? (
                <button onClick={() => router.push('/kiosk/doctors')}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 active:scale-95 transition-all">
                  <FaUserDoctor size={16} /> Find a Doctor Now
                </button>
              ) : result.goToPharmacy ? (
                <>
                  <button onClick={() => router.push('/kiosk/facilities')}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 active:scale-95 transition-all">
                    <FaStore size={14} /> Find Pharmacy
                  </button>
                  <button onClick={() => router.push('/kiosk/doctors')}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 active:scale-95 transition-all">
                    <FaUserDoctor size={14} /> See a Doctor
                  </button>
                </>
              ) : (
                <button onClick={() => router.push('/kiosk/doctors')}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 active:scale-95 transition-all">
                  <FaUserDoctor size={16} /> Find a Doctor
                </button>
              )}
              <button onClick={() => router.push('/kiosk/menu')}
                className="px-6 py-3.5 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-95 transition-all">
                Menu
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}