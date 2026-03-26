'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { SYMPTOM_CATEGORIES } from '@/types'
import { FaChevronLeft, FaClipboardList, FaUserDoctor, FaClock, FaCalendarDays, FaCalendarWeek } from 'react-icons/fa6'
import { MdWarning, MdMedicalServices } from 'react-icons/md'

type Step = 'category' | 'details' | 'result'

interface AssessmentResult {
  urgency: 'EMERGENCY' | 'URGENT' | 'MODERATE' | 'ROUTINE'
  department: string
  message: string
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
    let department = 'Provincial Practitioner'

    if (selectedCategory === 'injury' && severity >= 8) {
      urgency = 'EMERGENCY'
      department = 'Emergency Department'
    } else if (additionalSymptoms.includes('Difficulty Breathing')) {
      urgency = 'EMERGENCY'
      department = 'Emergency Department'
    } else if (selectedCategory === 'maternity') {
      urgency = 'URGENT'
      department = 'Maternity Ward'
    } else if (selectedCategory === 'child') {
      urgency = severity >= 7 ? 'URGENT' : 'MODERATE'
      department = 'Pediatrics'
    } else if (severity >= 7) {
      urgency = 'URGENT'
      department = selectedCategory === 'pain' ? 'Internal Medicine' : 'Provincial Practitioner'
    } else if (severity >= 4) {
      urgency = 'MODERATE'
    }

    const messages: Record<string, string> = {
      EMERGENCY: 'Please proceed to Emergency immediately or alert staff nearby.',
      URGENT: 'You should see a doctor soon. We recommend joining the queue now.',
      MODERATE: 'Please see a doctor at your earliest convenience.',
      ROUTINE: 'You can schedule a routine appointment.',
    }

    setResult({ urgency, department, message: messages[urgency] })
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
    <div className="flex flex-col min-h-screen">

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

      <main className="flex-1 p-4">

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
          <div className="max-w-lg mx-auto space-y-4">
            <div className={`p-6 rounded-2xl border-2 ${urgencyColors[result.urgency]}`}>
              <div className="flex items-center gap-2 mb-2">
                <MdMedicalServices className="text-xl" />
                <h2 className="text-lg font-bold">Assessment Results</h2>
              </div>
              <div className="flex items-center gap-2 text-2xl font-black my-2">
                <div className={`w-4 h-4 rounded-full ${urgencyDots[result.urgency]}`} />
                {result.urgency}
              </div>
              <p className="font-medium">Recommended: {result.department}</p>
              <p className="text-sm mt-2">{result.message}</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => router.push('/kiosk/doctors')}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 active:scale-95 transition-all">
                <FaUserDoctor size={16} /> Find a Doctor
              </button>
              <button onClick={() => router.push('/kiosk/menu')}
                className="flex-1 py-3 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-95 transition-all">
                Back to Menu
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
