'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FaChevronLeft, FaUserDoctor, FaMagnifyingGlass, FaCheck, FaTicket } from 'react-icons/fa6'
import { MdLocationOn } from 'react-icons/md'

interface Doctor {
  id: string
  specialty: string
  status: string
  roomNumber: string | null
  user: { name: string }
  department: { name: string }
  _count?: { queueEntries: number }
}

export default function KioskDoctors() {
  const router = useRouter()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [joining, setJoining] = useState<string | null>(null)
  const [ticketInfo, setTicketInfo] = useState<{ ticket: number; position: number; doctor: string } | null>(null)

  useEffect(() => {
    fetch('/api/doctors')
      .then(res => res.json())
      .then(data => { setDoctors(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const joinQueue = async (doctor: Doctor) => {
    setJoining(doctor.id)
    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: 'Walk-in Patient',
          departmentId: (doctor as any).departmentId,
          doctorId: doctor.id,
          priority: 'ROUTINE',
        }),
      })
      const data = await res.json()
      setTicketInfo({ ticket: data.ticketNumber, position: data.position || 1, doctor: doctor.user.name })
    } catch {
      alert('Failed to join queue. Please try again.')
    }
    setJoining(null)
  }

  const statusColors: Record<string, string> = {
    AVAILABLE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    BUSY: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    ON_BREAK: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    OFFLINE: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
  }

  const filtered = doctors.filter(d =>
    d.user.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty.toLowerCase().includes(search.toLowerCase()) ||
    d.department.name.toLowerCase().includes(search.toLowerCase())
  )

  if (ticketInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="bg-white dark:bg-gray-800/90 rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100 dark:border-gray-700">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
            <FaTicket className="text-blue-600 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Queue Ticket</h2>
          <div className="text-6xl font-black text-blue-700 dark:text-blue-400 my-4">
            #{ticketInfo.ticket}
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-1">
            Doctor: <strong>{ticketInfo.doctor}</strong>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Please wait to be called. Your position: #{ticketInfo.position}
          </p>
          <div className="flex gap-3">
            <button onClick={() => router.push('/kiosk/queue')} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 active:scale-95 transition-all">
              Check Queue Status
            </button>
            <button onClick={() => router.push('/kiosk/menu')} className="flex-1 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-95 transition-all">
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">

      {/* Header */}
      <header className="hero-gradient px-5 py-4 flex items-center gap-3 shadow-lg">
        <button
          onClick={() => router.push('/kiosk/menu')}
          className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
        >
          <FaChevronLeft size={14} />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-base leading-tight">See a Doctor</h1>
          <p className="text-white/65 text-xs">View available doctors and join a queue</p>
        </div>
        <FaUserDoctor className="text-white/60 text-2xl" />
      </header>

      <main className="flex-1 p-4">
        {/* Search */}
        <div className="max-w-2xl mx-auto mb-4">
          <div className="relative">
            <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search by name, specialty, or department..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
            />
          </div>
        </div>

        {/* Doctor List */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <FaUserDoctor className="text-4xl animate-pulse-soft" />
              <p className="text-sm font-medium animate-pulse-soft">Loading doctors...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {filtered.map(doctor => (
              <div key={doctor.id} className="bg-white dark:bg-gray-800/90 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">Dr. {doctor.user.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{doctor.specialty}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColors[doctor.status] || statusColors.OFFLINE}`}>
                    {doctor.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                  <MdLocationOn size={14} className="text-gray-400" />
                  {doctor.department.name} {doctor.roomNumber && `· Room ${doctor.roomNumber}`}
                </p>
                {doctor.status === 'AVAILABLE' ? (
                  <button
                    onClick={() => joinQueue(doctor)}
                    disabled={joining === doctor.id}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {joining === doctor.id ? 'Joining...' : <><FaCheck size={12} /> Join Queue</>}
                  </button>
                ) : (
                  <div className="text-center py-2 text-xs text-gray-400 dark:text-gray-500">
                    {doctor.status === 'BUSY' ? 'Currently with a patient' : doctor.status === 'ON_BREAK' ? 'On break' : 'Not available'}
                  </div>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-2 text-center py-10">
                <FaUserDoctor className="text-4xl text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                <p className="text-gray-400 font-medium">No doctors found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
