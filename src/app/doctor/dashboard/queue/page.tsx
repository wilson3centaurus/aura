'use client'

import { useEffect, useState, useCallback } from 'react'

interface QueueItem {
  id: string
  ticket_number: number
  patient_name: string
  status: string
  priority: string
  symptoms: string | null
  created_at: string
  doctor?: { user: { name: string } } | null
  department?: { name: string } | null
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  EMERGENCY: { label: 'Emergency', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-950/40' },
  URGENT:    { label: 'Urgent',    color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/40' },
  NORMAL:    { label: 'Normal',    color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-[#333]' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  WAITING:     { label: 'Waiting',     color: 'text-amber-700 dark:text-amber-400' },
  CALLED:      { label: 'Called',      color: 'text-blue-700 dark:text-blue-400' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-emerald-700 dark:text-emerald-400' },
  COMPLETED:   { label: 'Completed',   color: 'text-gray-500 dark:text-gray-500' },
  SKIPPED:     { label: 'Skipped',     color: 'text-rose-600 dark:text-rose-400' },
}

export default function DoctorQueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('active')
  const [updating, setUpdating] = useState<string | null>(null)

  const loadQueue = useCallback(async () => {
    const res = await fetch('/api/queue?mine=true')
    if (res.ok) setQueue(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    loadQueue()
    const interval = setInterval(loadQueue, 8000)
    return () => clearInterval(interval)
  }, [loadQueue])

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    await fetch(`/api/queue/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await loadQueue()
    setUpdating(null)
  }

  const filtered = queue.filter(q => {
    if (filter === 'active') return ['WAITING', 'CALLED', 'IN_PROGRESS'].includes(q.status)
    if (filter === 'completed') return ['COMPLETED', 'SKIPPED'].includes(q.status)
    return true
  })

  const waiting = queue.filter(q => q.status === 'WAITING').length
  const inProgress = queue.filter(q => q.status === 'IN_PROGRESS').length
  const completed = queue.filter(q => q.status === 'COMPLETED').length

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-[#0a4f3f] border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">My Queue</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage your patient queue in real time</p>
        </div>
        <button onClick={loadQueue}
          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#333] text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Waiting', value: waiting, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' },
          { label: 'In Progress', value: inProgress, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' },
          { label: 'Completed', value: completed, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-[#222]' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-3 ${s.bg}`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-[#111] rounded-xl w-fit">
        {[
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Done' },
          { key: 'all', label: 'All' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === tab.key
                ? 'bg-white dark:bg-[#222] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Queue list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <span className="text-4xl mb-3">🎫</span>
            <p className="text-sm">No patients {filter === 'active' ? 'in queue' : filter === 'completed' ? 'completed' : 'found'}</p>
          </div>
        ) : (
          filtered.map(q => {
            const pri = PRIORITY_CONFIG[q.priority] || PRIORITY_CONFIG.NORMAL
            const sta = STATUS_CONFIG[q.status] || { label: q.status, color: 'text-gray-500' }
            const isActive = ['WAITING', 'CALLED', 'IN_PROGRESS'].includes(q.status)
            return (
              <div key={q.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  q.status === 'IN_PROGRESS'
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                    : q.priority === 'EMERGENCY'
                    ? 'bg-red-50 dark:bg-red-950/10 border-red-200 dark:border-red-900/30'
                    : 'bg-white dark:bg-[#111] border-gray-200 dark:border-[#222]'
                }`}>
                {/* Ticket number */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black ${pri.bg} ${pri.color}`}>
                  #{q.ticket_number}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{q.patient_name}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${pri.bg} ${pri.color} flex-shrink-0`}>
                      {pri.label}
                    </span>
                  </div>
                  {q.symptoms && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{q.symptoms}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-[11px] font-semibold ${sta.color}`}>{sta.label}</span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(q.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {isActive && (
                  <div className="flex gap-2 flex-shrink-0">
                    {q.status === 'WAITING' && (
                      <button
                        onClick={() => updateStatus(q.id, 'IN_PROGRESS')}
                        disabled={updating === q.id}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold transition-colors disabled:opacity-50">
                        {updating === q.id ? '...' : 'Start'}
                      </button>
                    )}
                    {q.status === 'CALLED' && (
                      <button
                        onClick={() => updateStatus(q.id, 'IN_PROGRESS')}
                        disabled={updating === q.id}
                        className="px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-bold transition-colors disabled:opacity-50">
                        {updating === q.id ? '...' : 'Begin'}
                      </button>
                    )}
                    {q.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => updateStatus(q.id, 'COMPLETED')}
                        disabled={updating === q.id}
                        className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-800 dark:bg-gray-200 dark:hover:bg-white text-white dark:text-gray-900 text-[11px] font-bold transition-colors disabled:opacity-50">
                        {updating === q.id ? '...' : 'Complete'}
                      </button>
                    )}
                    {q.status !== 'IN_PROGRESS' && (
                      <button
                        onClick={() => updateStatus(q.id, 'SKIPPED')}
                        disabled={updating === q.id}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#333] text-gray-500 dark:text-gray-400 hover:border-red-300 dark:hover:border-red-900 hover:text-red-500 dark:hover:text-red-400 text-[11px] font-bold transition-colors disabled:opacity-50">
                        Skip
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
