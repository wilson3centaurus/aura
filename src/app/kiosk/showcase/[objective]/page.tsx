'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { FaArrowRight, FaChevronLeft, FaFlask, FaGlobe, FaMicrophoneLines, FaRoute, FaStethoscope, FaTableCellsLarge } from 'react-icons/fa6'
import { useBatchTranslation } from '@/components/useBatchTranslation'
import { useKioskLanguage } from '@/components/useKioskLanguage'
import { getResearchObjective } from '@/lib/research-objectives'

const ICONS = {
  'objective-1': FaTableCellsLarge,
  'objective-2': FaGlobe,
  'objective-3': FaStethoscope,
  'objective-4': FaRoute,
} as const

export default function KioskObjectiveShowcasePage() {
  const router = useRouter()
  const params = useParams<{ objective: string }>()
  const { language } = useKioskLanguage()
  const objective = getResearchObjective(params?.objective)

  if (!objective) {
    return (
      <div className="flex h-full items-center justify-center bg-white dark:bg-[#0a0a0a] p-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-xl dark:border-[#222] dark:bg-[#111]">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-gray-400">Showcase</p>
          <h1 className="mt-3 text-2xl font-black text-gray-900 dark:text-white">Objective not found</h1>
          <button
            onClick={() => router.push('/kiosk')}
            className="mt-5 rounded-2xl bg-[#003d73] px-5 py-3 text-sm font-bold text-white"
          >
            Back to language selector
          </button>
        </div>
      </div>
    )
  }

  const Icon = ICONS[objective.id]
  const texts = useBatchTranslation([
    'Dissertation Showcase',
    objective.title,
    objective.summary,
    'Live Demonstration Areas',
    'Open the pages below to present the objective with real data, validation, and interaction.',
    'Double back to return to the language selector.',
    objective.primaryFeature,
    ...objective.featureRoutes.flatMap(route => [route.label, route.description]),
  ], language)

  const [eyebrow, title, summary, sectionTitle, sectionBody, footerHint, primaryFeature, ...featureText] = texts

  return (
    <div className="flex h-full flex-col bg-[radial-gradient(circle_at_top,_rgba(0,61,115,0.18),_transparent_46%),linear-gradient(180deg,#f7fbff_0%,#eef6fb_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(0,119,204,0.16),_transparent_40%),linear-gradient(180deg,#050b14_0%,#09111d_100%)]">
      <header className="px-5 py-5">
        <div className="mx-auto flex max-w-5xl items-center gap-3 rounded-[2rem] border border-white/60 bg-white/85 px-4 py-4 shadow-xl shadow-blue-950/5 backdrop-blur dark:border-white/10 dark:bg-white/5">
          <button
            onClick={() => router.push('/kiosk')}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#003d73] text-white"
          >
            <FaChevronLeft size={14} />
          </button>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#003d73] dark:text-blue-300">{eyebrow}</p>
            <h1 className="mt-1 text-xl font-black text-gray-900 dark:text-white">Objective {objective.number}</h1>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-[#003d73]/8 px-4 py-2 text-[#003d73] dark:bg-blue-500/10 dark:text-blue-300">
            <Icon size={16} />
            <span className="text-xs font-bold">{primaryFeature}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 pb-6">
        <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-blue-950/5 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#003d73] to-[#1f9cff] text-white shadow-lg shadow-blue-900/25">
                <Icon size={24} />
              </div>
              <div className="flex-1">
                <p className="text-[11px] font-black uppercase tracking-[0.35em] text-gray-400">Objective {objective.number}</p>
                <h2 className="mt-2 text-3xl font-black leading-tight text-gray-900 dark:text-white">{title}</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600 dark:text-gray-300">{summary}</p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.75rem] border border-dashed border-[#003d73]/20 bg-[#003d73]/5 p-5 dark:border-blue-400/20 dark:bg-blue-500/5">
              <div className="flex items-center gap-3 text-[#003d73] dark:text-blue-300">
                <FaFlask size={16} />
                <p className="text-sm font-black uppercase tracking-[0.28em]">{sectionTitle}</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-gray-700 dark:text-gray-300">{sectionBody}</p>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-xl shadow-blue-950/5 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white">
                <FaMicrophoneLines size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-400">Presenter Flow</p>
                <h3 className="mt-1 text-xl font-black text-gray-900 dark:text-white">Open a live feature</h3>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {objective.featureRoutes.map((featureRoute, index) => {
                const label = featureText[index * 2]
                const description = featureText[index * 2 + 1]
                return (
                  <Link
                    key={featureRoute.href}
                    href={featureRoute.href}
                    className="group block rounded-[1.5rem] border border-gray-200 bg-white/80 p-4 transition-all hover:-translate-y-0.5 hover:border-[#003d73] hover:shadow-lg dark:border-white/10 dark:bg-[#0f1724]/80"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#003d73]/10 text-[#003d73] dark:bg-blue-500/10 dark:text-blue-300">
                        <FaArrowRight size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-black text-gray-900 dark:text-white">{label}</p>
                        <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">{description}</p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            <p className="mt-5 text-xs leading-6 text-gray-400 dark:text-gray-500">{footerHint}</p>
          </section>
        </div>
      </main>
    </div>
  )
}