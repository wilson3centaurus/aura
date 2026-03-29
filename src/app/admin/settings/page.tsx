'use client'

import { useEffect, useState } from 'react'

interface Settings {
  workStartTime?: string
  workEndTime?: string
  lunchStartTime?: string
  lunchEndTime?: string
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({
    workStartTime: '06:00',
    workEndTime: '19:00',
    lunchStartTime: '13:00',
    lunchEndTime: '14:00',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setSettings(prev => ({ ...prev, ...data }))
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const TimeInput = ({ label, field, hint }: { label: string; field: keyof Settings; hint?: string }) => (
    <div>
      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type="time"
        value={settings[field] || ''}
        onChange={e => setSettings(prev => ({ ...prev, [field]: e.target.value }))}
        className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73]"
      />
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-[#003d73] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-900 dark:text-white">Hospital Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Configure operating hours. Doctor statuses update automatically based on these rules.
        </p>
      </div>

      {/* Work Hours */}
      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xl">🏥</span>
          <div>
            <h2 className="text-sm font-black text-gray-900 dark:text-white">Operating Hours</h2>
            <p className="text-xs text-gray-500">Doctors outside these hours will appear <strong>Offline</strong></p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TimeInput label="Opens At" field="workStartTime" hint="Doctors go Online" />
          <TimeInput label="Closes At" field="workEndTime" hint="Doctors go Offline" />
        </div>
      </div>

      {/* Lunch Break */}
      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xl">🍽️</span>
          <div>
            <h2 className="text-sm font-black text-gray-900 dark:text-white">Lunch Break</h2>
            <p className="text-xs text-gray-500">All doctors will show <strong>On Break</strong> during this window</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TimeInput label="Break Starts" field="lunchStartTime" />
          <TimeInput label="Break Ends" field="lunchEndTime" />
        </div>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 p-4">
        <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">ℹ️ How Auto-Status Works</p>
        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
          <li>Outside work hours → all doctors shown as <strong>Offline</strong></li>
          <li>During lunch window → all doctors shown as <strong>On Break</strong></li>
          <li>Doctor accepts appointment → automatically set to <strong>Busy</strong></li>
          <li>Doctor ends appointment → automatically restored to <strong>Available</strong></li>
          <li>Doctors can still manually override their own status</li>
          <li><strong>Busy</strong> status is always protected — it won't be overridden by schedule</li>
        </ul>
      </div>

      {/* Save */}
      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3.5 rounded-2xl bg-[#003d73] hover:bg-[#002d57] disabled:opacity-50 text-white font-black text-sm transition-colors flex items-center justify-center gap-2"
      >
        {saving ? (
          <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving...</>
        ) : saved ? (
          <>✅ Settings Saved!</>
        ) : (
          'Save Settings'
        )}
      </button>
    </div>
  )
}
