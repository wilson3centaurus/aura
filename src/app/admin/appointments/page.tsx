'use client'

import { useEffect, useState } from 'react'
import { MdSearch, MdRefresh, MdQrCode2 } from 'react-icons/md'

interface Appointment {
  id: string
  patient_name: string
  patient_phone: string | null
  symptoms: string | null
  status: string
  qr_code: string
  scheduled_at: string | null
  decline_reason: string | null
  accepted_at: string | null
  created_at: string
  doctor: {
    id: string
    specialty: string
    user: { name: string }
  } | null
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:     'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  ACCEPTED:    'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  DECLINED:    'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400',
  IN_PROGRESS: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  COMPLETED:   'bg-gray-100 text-gray-500 dark:bg-[#222] dark:text-gray-400',
  CANCELLED:   'bg-gray-100 text-gray-400 dark:bg-[#222] dark:text-gray-500',
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-ZW', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtTime(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-ZW', { hour: '2-digit', minute: '2-digit' })
}

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showQR, setShowQR] = useState<string | null>(null)

  const loadData = async () => {
    const data = await fetch('/api/appointments').then(r => r.json())
    setAppointments(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const filtered = appointments.filter(a => {
    if (search && !a.patient_name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatus && a.status !== filterStatus) return false
    return true
  })

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 rounded-full border-2 border-gray-900 dark:border-white border-t-transparent animate-spin" /></div>

  const pending = appointments.filter(a => a.status === 'PENDING').length
  const today = appointments.filter(a => {
    if (!a.scheduled_at) return false
    const d = new Date(a.scheduled_at)
    const n = new Date()
    return d.toDateString() === n.toDateString()
  }).length

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Appointments</h1>
          <p className="text-xs text-gray-500">{appointments.length} total &middot; {pending} pending &middot; {today} today</p>
        </div>
        <button onClick={() => { setLoading(true); loadData() }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400 text-xs font-medium hover:bg-gray-200 dark:hover:bg-[#333] transition-all">
          <MdRefresh size={14} /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by patient name..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] text-sm text-gray-900 dark:text-white" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] text-xs text-gray-600 dark:text-gray-400">
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="DECLINED">Declined</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-[#222]">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Patient</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Doctor</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Date & Time</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">QR</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(apt => (
              <tr key={apt.id} className="border-b border-gray-50 dark:border-[#1a1a1a] last:border-0 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 dark:text-white text-[13px]">{apt.patient_name}</p>
                  <p className="text-[11px] text-gray-400">{apt.patient_phone || '—'}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-[13px] text-gray-600 dark:text-gray-400">{apt.doctor?.user?.name || '—'}</p>
                  <p className="text-[11px] text-gray-400">{apt.doctor?.specialty || ''}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-[13px] text-gray-600 dark:text-gray-400">{fmtDate(apt.scheduled_at)}</p>
                  <p className="text-[11px] text-gray-400">{fmtTime(apt.scheduled_at)}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${STATUS_COLORS[apt.status] || 'bg-gray-100 text-gray-500'}`}>
                    {apt.status.replace('_', ' ')}
                  </span>
                  {apt.decline_reason && <p className="text-[10px] text-red-400 mt-0.5">{apt.decline_reason}</p>}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setShowQR(showQR === apt.id ? null : apt.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#222] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all">
                    <MdQrCode2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No appointments found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* QR Modal */}
      {showQR && (() => {
        const apt = appointments.find(a => a.id === showQR)
        if (!apt) return null
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowQR(null)}>
            <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] p-6 w-80 text-center" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{apt.patient_name}</h3>
              <p className="text-[11px] text-gray-400 mb-4">{fmtDate(apt.scheduled_at)} {fmtTime(apt.scheduled_at)}</p>
              <div className="bg-white p-4 rounded-xl inline-block mb-3">
                <div className="w-40 h-40 bg-gray-100 dark:bg-gray-200 rounded-lg flex items-center justify-center">
                  <MdQrCode2 size={100} className="text-gray-900" />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 font-mono break-all">{apt.qr_code}</p>
              <button onClick={() => setShowQR(null)}
                className="mt-4 px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-semibold w-full">
                Close
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
