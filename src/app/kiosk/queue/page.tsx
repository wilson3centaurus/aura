'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FaChevronLeft, FaTicket, FaMagnifyingGlass } from 'react-icons/fa6'
import { MdCampaign } from 'react-icons/md'

interface QueueItem {
  id: string
  ticket_number: number
  patient_name: string
  status: string
  priority: string
  doctor: { user: { name: string } } | null
  department: { name: string }
  created_at: string
}

export default function KioskQueue() {
  const router = useRouter()
  const [ticketSearch, setTicketSearch] = useState('')
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/queue?status=WAITING,CALLED,IN_PROGRESS')
      .then(res => res.json())
      .then(data => { setQueue(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))

    const interval = setInterval(() => {
      fetch('/api/queue?status=WAITING,CALLED,IN_PROGRESS')
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setQueue(data) })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const statusStyles: Record<string, string> = {
    WAITING: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    CALLED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  }

  const priorityColors: Record<string, string> = {
    EMERGENCY: 'bg-red-500',
    URGENT: 'bg-orange-500',
    ROUTINE: 'bg-emerald-500',
  }

  const filtered = ticketSearch
    ? queue.filter(q => q.ticket_number && q.ticket_number.toString().includes(ticketSearch))
    : queue

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <header className="hero-gradient px-5 py-4 flex items-center gap-3 shadow-lg">
        <button
          onClick={() => router.push('/kiosk/menu')}
          className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
        >
          <FaChevronLeft size={14} />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-base leading-tight">Queue Status</h1>
          <p className="text-white/65 text-xs">Check your position in the queue</p>
        </div>
        <FaTicket className="text-white/60 text-2xl" />
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        {/* Search */}
        <div className="max-w-2xl mx-auto mb-4">
          <div className="relative">
            <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Enter your ticket number..."
              value={ticketSearch}
              onChange={e => setTicketSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
            />
          </div>
        </div>

        {/* Currently Called */}
        {queue.filter(q => q.status === 'CALLED').length > 0 && (
          <div className="max-w-2xl mx-auto mb-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400 mb-2">
              <MdCampaign className="text-xl" />
              Now Calling:
            </div>
            {queue.filter(q => q.status === 'CALLED').map(q => (
              <div key={q.id} className="text-lg font-black text-emerald-800 dark:text-emerald-300">
                Ticket #{q.ticket_number} — {q.department.name}
                {q.doctor && <span className="text-sm font-normal ml-2">({q.doctor.user.name})</span>}
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <FaTicket className="text-4xl animate-pulse-soft" />
              <p className="text-sm font-medium animate-pulse-soft">Loading queue...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-2">
            {filtered.map(item => (
              <div key={item.id} className={`flex items-center gap-4 p-3.5 rounded-2xl bg-white dark:bg-gray-800/90 shadow-sm border border-gray-100 dark:border-gray-700 ${item.status === 'CALLED' ? 'ring-2 ring-emerald-400' : ''}`}>
                <div className="text-center min-w-[50px]">
                  <div className="text-xl font-black text-gray-800 dark:text-gray-100">#{item.ticket_number}</div>
                  <div className={`w-3 h-3 rounded-full mx-auto mt-1 ${priorityColors[item.priority] || 'bg-gray-400'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.department.name}</p>
                  {item.doctor && <p className="text-xs text-gray-500 dark:text-gray-400">Dr. {item.doctor.user.name}</p>}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusStyles[item.status] || ''}`}>
                  {item.status}
                </span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-10">
                <FaTicket className="text-4xl text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                <p className="text-gray-400 font-medium">
                  {ticketSearch ? 'No ticket found with that number.' : 'No patients in queue currently.'}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="max-w-2xl mx-auto mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
          Queue updates automatically every 15 seconds
        </div>
      </main>
    </div>
  )
}
