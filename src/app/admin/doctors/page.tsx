'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Doctor {
  id: string
  specialty: string
  status: string
  room_number: string | null
  phone: string | null
  latitude: number | null
  longitude: number | null
  is_activated: boolean
  user: { name: string; email: string; profile_image: string | null; password_changed: boolean }
  department: { id: string; name: string }
  _count?: { queueEntries: number }
}

interface Department { id: string; name: string }

interface CreatedCredentials {
  name: string; email: string; password: string
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string }> = {
  AVAILABLE: { label: 'Available', dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' },
  BUSY:      { label: 'Busy',      dot: 'bg-amber-500',  bg: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
  ON_BREAK:  { label: 'On Break',  dot: 'bg-blue-500',   bg: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
  OFFLINE:   { label: 'Offline',   dot: 'bg-gray-400',   bg: 'bg-gray-100 text-gray-500 dark:bg-[#222] dark:text-gray-500' },
}

const SPECIALTIES = [
  'General Practice', 'Emergency Medicine', 'Obstetrics/Gynaecology', 'Paediatrics',
  'Surgery', 'Internal Medicine', 'Radiology', 'Pathology', 'Pharmacy',
  'Ophthalmology', 'ENT', 'Orthopaedics', 'Dermatology', 'Psychiatry',
]

// Mutare, Zimbabwe coordinate bounds
const MUTARE = { latMin: -19.2, latMax: -18.7, lngMin: 32.4, lngMax: 32.9 }

const EMAIL_SUGGESTIONS = [
  '@gmail.com', '@yahoo.com', '@proton.me', '@mutareprovincial.co.zw', '@yahoo.co.uk',
]

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

function avatarColor(name: string) {
  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500']
  return colors[name.charCodeAt(0) % colors.length]
}

// Validate Zimbabwean National ID: 63-123456A78
function validateIdNumber(id: string) {
  return /^\d{2}-\d{6}[A-Za-z]\d{2}$/.test(id.trim())
}

// Phone: 10 digits starting with 0 (Zimbabwe format 07XXXXXXXX)
function validatePhone(phone: string) {
  return /^0\d{9}$/.test(phone.replace(/\s/g, ''))
}

function validateEmail(email: string) {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim())
}

function validateCoords(lat: string, lng: string) {
  const la = parseFloat(lat), lo = parseFloat(lng)
  if (isNaN(la) || isNaN(lo)) return 'Please enter valid numbers.'
  if (la < MUTARE.latMin || la > MUTARE.latMax) return `Latitude must be within Mutare bounds (${MUTARE.latMin} to ${MUTARE.latMax}).`
  if (lo < MUTARE.lngMin || lo > MUTARE.lngMax) return `Longitude must be within Mutare bounds (${MUTARE.lngMin} to ${MUTARE.lngMax}).`
  return null
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1"><span>⚠</span>{msg}</p>
}

function FieldOk({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1"><span>✓</span>{msg}</p>
}

export default function AdminDoctors() {
  const router = useRouter()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const emptyForm = { name: '', email: '', idNumber: '', specialty: '', departmentId: '', roomNumber: '', phone: '0' }
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [emailSuggestion, setEmailSuggestion] = useState('')
  const [saving, setSaving] = useState(false)
  const [createdCreds, setCreatedCreds] = useState<CreatedCredentials | null>(null)

  const [editDoctor, setEditDoctor] = useState<Doctor | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', idNumber: '', specialty: '', departmentId: '', roomNumber: '', phone: '', status: '', latitude: '', longitude: '' })
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [editSaving, setEditSaving] = useState(false)

  const [deleteDoctor, setDeleteDoctor] = useState<Doctor | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Impersonate
  const [impersonateDoctor, setImpersonateDoctor] = useState<Doctor | null>(null)
  const [impersonateKey, setImpersonateKey] = useState('')
  const [impersonating, setImpersonating] = useState(false)
  const [impersonateError, setImpersonateError] = useState('')

  const loadData = async () => {
    const [docsRes, depsRes] = await Promise.all([
      fetch('/api/doctors').then(r => r.json()),
      fetch('/api/departments').then(r => r.json()),
    ])
    setDoctors(Array.isArray(docsRes) ? docsRes : [])
    setDepartments(Array.isArray(depsRes) ? depsRes : [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  // Live form validation
  const validateForm = (f: typeof form) => {
    const errors: Record<string, string> = {}
    if (!f.name.trim()) errors.name = 'Full name is required.'
    if (!f.email.trim()) {
      errors.email = 'Login email is required.'
    } else if (!validateEmail(f.email)) {
      errors.email = 'Enter a valid email address.'
    }
    if (!f.idNumber.trim()) {
      errors.idNumber = 'National ID number is required.'
    } else if (!validateIdNumber(f.idNumber)) {
      errors.idNumber = 'Format must be: 63-123456A78 (2 digits, dash, 6 digits, letter, 2 digits).'
    }
    if (!f.specialty) errors.specialty = 'Select a specialty.'
    if (!f.departmentId) errors.departmentId = 'Select a department.'
    if (f.phone && !validatePhone(f.phone)) {
      errors.phone = 'Phone must be 10 digits starting with 0 (e.g. 0771234567).'
    }
    return errors
  }

  const addDoctor = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validateForm(form)
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }
    setSaving(true)
    const password = form.idNumber.trim().toLowerCase().replace(/\s+/g, '')
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password,
          rawPassword: password,
          specialty: form.specialty,
          departmentId: form.departmentId,
          roomNumber: form.roomNumber,
          phone: form.phone,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setCreatedCreds({ name: form.name, email: form.email.trim().toLowerCase(), password })
        setForm(emptyForm)
        setFormErrors({})
        setEmailSuggestion('')
        setShowForm(false)
        loadData()
      } else {
        setFormErrors({ _general: data.error || 'Failed to create doctor.' })
      }
    } catch { setFormErrors({ _general: 'Network error. Please try again.' }) }
    setSaving(false)
  }

  const filtered = doctors.filter(d => {
    const matchSearch = !search || d.user.name.toLowerCase().includes(search.toLowerCase()) || d.specialty.toLowerCase().includes(search.toLowerCase()) || d.department?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || d.status === filterStatus
    return matchSearch && matchStatus
  })

  const openEdit = (doc: Doctor) => {
    setEditDoctor(doc)
    setEditErrors({})
    setEditForm({
      name: doc.user.name,
      email: doc.user.email,
      idNumber: '',
      specialty: doc.specialty,
      departmentId: doc.department?.id || '',
      roomNumber: doc.room_number || '',
      phone: doc.phone || '0',
      status: doc.status,
      latitude: doc.latitude != null ? String(doc.latitude) : '',
      longitude: doc.longitude != null ? String(doc.longitude) : '',
    })
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editDoctor) return
    const errors: Record<string, string> = {}
    if (!editForm.name.trim()) errors.name = 'Full name is required.'
    if (!editForm.email.trim() || !validateEmail(editForm.email)) errors.email = 'Valid email required.'
    if (editForm.phone && !validatePhone(editForm.phone)) errors.phone = 'Phone must be 10 digits starting with 0.'
    if (editForm.latitude && editForm.longitude) {
      const coordErr = validateCoords(editForm.latitude, editForm.longitude)
      if (coordErr) errors.coords = coordErr
    } else if (editForm.latitude || editForm.longitude) {
      errors.coords = 'Both latitude and longitude are required.'
    }
    if (Object.keys(errors).length > 0) { setEditErrors(errors); return }

    setEditSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: editForm.name.trim(),
        email: editForm.email.trim().toLowerCase(),
        specialty: editForm.specialty,
        departmentId: editForm.departmentId,
        roomNumber: editForm.roomNumber,
        phone: editForm.phone,
        status: editForm.status,
      }
      if (editForm.idNumber.trim()) {
        if (!validateIdNumber(editForm.idNumber)) {
          setEditErrors({ idNumber: 'Format: 63-123456A78' })
          setEditSaving(false)
          return
        }
        payload.password = editForm.idNumber.trim().toLowerCase().replace(/\s+/g, '')
      }
      if (editForm.latitude !== '') payload.latitude = parseFloat(editForm.latitude)
      if (editForm.longitude !== '') payload.longitude = parseFloat(editForm.longitude)
      const res = await fetch(`/api/doctors/${editDoctor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) { setEditDoctor(null); loadData() }
      else {
        const d = await res.json()
        setEditErrors({ _general: d.error || 'Save failed.' })
      }
    } catch { setEditErrors({ _general: 'Network error.' }) }
    setEditSaving(false)
  }

  const confirmDelete = async () => {
    if (!deleteDoctor) return
    setDeleting(true)
    try {
      await fetch(`/api/doctors/${deleteDoctor.id}`, { method: 'DELETE' })
      setDeleteDoctor(null)
      loadData()
    } catch {}
    setDeleting(false)
  }

  const doImpersonate = async () => {
    if (!impersonateDoctor || !impersonateKey.trim()) return
    setImpersonating(true)
    setImpersonateError('')
    try {
      const res = await fetch('/api/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: impersonateDoctor.id, key: impersonateKey }),
      })
      const data = await res.json()
      if (res.ok) {
        setImpersonateDoctor(null)
        setImpersonateKey('')
        router.push('/doctor/dashboard')
      } else {
        setImpersonateError(data.error || 'Invalid key.')
      }
    } catch { setImpersonateError('Network error.') }
    setImpersonating(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-[#003d73] border-t-transparent animate-spin" />
    </div>
  )

  const counts = Object.fromEntries(
    ['AVAILABLE', 'BUSY', 'ON_BREAK', 'OFFLINE'].map(s => [s, doctors.filter(d => d.status === s).length])
  )

  return (
    <div className="max-w-6xl space-y-5">
      {/* Credential display after creation */}
      {createdCreds && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div className="flex-1">
              <p className="text-sm font-black text-emerald-800 dark:text-emerald-300 mb-1">Doctor account created for {createdCreds.name}</p>
              <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/70 mb-3">A welcome email has been sent to the doctor with login instructions.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-[#0a0a0a] rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mb-1">Login Username (Email)</p>
                  <p className="text-sm font-mono font-bold text-gray-900 dark:text-white break-all">{createdCreds.email}</p>
                </div>
                <div className="bg-white dark:bg-[#0a0a0a] rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mb-1">Temp Password (ID lowercase)</p>
                  <p className="text-sm font-mono font-bold text-gray-900 dark:text-white">{createdCreds.password}</p>
                </div>
              </div>
              <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/60 mt-2">
                ⚠️ Share credentials securely only if email did not reach them.
              </p>
            </div>
            <button onClick={() => setCreatedCreds(null)} className="text-emerald-500 hover:text-emerald-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Medical Staff</h1>
          <p className="text-xs text-gray-500 mt-0.5">{doctors.length} registered doctors</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setFormErrors({}); setForm(emptyForm) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#003d73] hover:bg-[#002d57] text-white text-xs font-bold transition-colors shadow-md shadow-blue-900/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Doctor
        </button>
      </div>

      {/* Status strip */}
      <div className="grid grid-cols-4 gap-3">
        {[['AVAILABLE', '🟢'], ['BUSY', '🟡'], ['ON_BREAK', '🔵'], ['OFFLINE', '⚫']].map(([s, emoji]) => {
          const cfg = STATUS_CONFIG[s]
          return (
            <div key={s} className={`rounded-xl border p-3 text-center ${cfg.bg.split(' ').slice(0, 2).join(' ')} border-current/20`}>
              <p className="text-lg">{emoji}</p>
              <p className={`text-xl font-black ${cfg.bg.split(' ')[1]} ${cfg.bg.split(' ')[3]}`}>{counts[s]}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{cfg.label}</p>
            </div>
          )
        })}
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141414] rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h2 className="text-sm font-black text-gray-900 dark:text-white">Register New Doctor</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">Enter the doctor&apos;s details. The ID number (lowercase, no spaces) becomes the initial login password.</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#222] transition-colors ml-3 flex-shrink-0">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={addDoctor} className="p-5 space-y-4">
              {formErrors._general && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                  {formErrors._general}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1.5">Full Name *</label>
                <input
                  placeholder="Dr. Jane Mutasa"
                  value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormErrors(fe => ({ ...fe, name: '' })) }}
                  required
                  className={`w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73] ${formErrors.name ? 'border-red-400' : 'border-gray-200 dark:border-[#333]'}`}
                />
                <FieldError msg={formErrors.name} />
              </div>

              {/* Login Email */}
              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1.5">Login Email (Username) *</label>
                <input
                  type="text"
                  placeholder="doctor@gmail.com"
                  value={form.email}
                  onChange={e => {
                    const val = e.target.value
                    setForm(f => ({ ...f, email: val }))
                    setFormErrors(fe => ({ ...fe, email: '' }))
                    // Show domain suggestion if @ typed with no domain
                    const atIdx = val.lastIndexOf('@')
                    if (atIdx > 0 && val.slice(atIdx).length < 5) {
                      setEmailSuggestion(val.slice(0, atIdx))
                    } else {
                      setEmailSuggestion('')
                    }
                  }}
                  required
                  className={`w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73] font-mono ${formErrors.email ? 'border-red-400' : 'border-gray-200 dark:border-[#333]'}`}
                />
                {/* Email domain suggestions */}
                {emailSuggestion !== '' && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {EMAIL_SUGGESTIONS.map(domain => (
                      <button key={domain} type="button"
                        onClick={() => { setForm(f => ({ ...f, email: emailSuggestion + domain })); setEmailSuggestion('') }}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[11px] font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                        {emailSuggestion + domain}
                      </button>
                    ))}
                  </div>
                )}
                <FieldError msg={formErrors.email} />
                {form.email && !formErrors.email && validateEmail(form.email) && <FieldOk msg="Valid email address" />}
              </div>

              {/* ID Number */}
              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1.5">National ID Number * (becomes password)</label>
                <input
                  placeholder="63-123456A78"
                  value={form.idNumber}
                  onChange={e => { setForm(f => ({ ...f, idNumber: e.target.value })); setFormErrors(fe => ({ ...fe, idNumber: '' })) }}
                  required
                  className={`w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73] font-mono uppercase ${formErrors.idNumber ? 'border-red-400' : 'border-gray-200 dark:border-[#333]'}`}
                />
                <p className="text-[10px] text-gray-400 mt-1">Format: 2 digits – 6 digits – 1 letter – 2 digits (e.g. 63-123456A78)</p>
                <FieldError msg={formErrors.idNumber} />
                {form.idNumber && !formErrors.idNumber && validateIdNumber(form.idNumber) && (
                  <FieldOk msg={`Valid ID · Password will be: ${form.idNumber.toLowerCase().replace(/\s+/g, '')}`} />
                )}
              </div>

              {/* Specialty + Department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1.5">Specialty *</label>
                  <select value={form.specialty} onChange={e => { setForm(f => ({ ...f, specialty: e.target.value })); setFormErrors(fe => ({ ...fe, specialty: '' })) }} required
                    className={`w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73] ${formErrors.specialty ? 'border-red-400' : 'border-gray-200 dark:border-[#333]'}`}>
                    <option value="">Select Specialty</option>
                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <FieldError msg={formErrors.specialty} />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1.5">Department *</label>
                  <select value={form.departmentId} onChange={e => { setForm(f => ({ ...f, departmentId: e.target.value })); setFormErrors(fe => ({ ...fe, departmentId: '' })) }} required
                    className={`w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73] ${formErrors.departmentId ? 'border-red-400' : 'border-gray-200 dark:border-[#333]'}`}>
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <FieldError msg={formErrors.departmentId} />
                </div>
              </div>

              {/* Room + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1.5">Room Number</label>
                  <input placeholder="e.g. A-12" value={form.roomNumber} onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1.5">Phone (10 digits)</label>
                  <input
                    placeholder="0771234567"
                    value={form.phone}
                    maxLength={10}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '')
                      setForm(f => ({ ...f, phone: val || '0' }))
                      setFormErrors(fe => ({ ...fe, phone: '' }))
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73] font-mono ${formErrors.phone ? 'border-red-400' : 'border-gray-200 dark:border-[#333]'}`}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">10 digits · starts with 0</p>
                  <FieldError msg={formErrors.phone} />
                  {form.phone && form.phone.length === 10 && validatePhone(form.phone) && <FieldOk msg="Valid phone number" />}
                </div>
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-3 rounded-xl bg-[#003d73] hover:bg-[#002d57] text-white text-sm font-black transition-colors shadow-md shadow-blue-900/20 disabled:opacity-50">
                {saving ? 'Creating Account & Sending Email...' : 'Create Doctor Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, specialty or department..."
            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] text-xs text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73]">
          <option value="">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="BUSY">Busy</option>
          <option value="ON_BREAK">On Break</option>
          <option value="OFFLINE">Offline</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-[#222] bg-gray-50 dark:bg-[#0a0a0a]">
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Doctor</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Specialty</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Department</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Room</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Activation</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Queue</th>
              <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(doc => {
              const sc = STATUS_CONFIG[doc.status] || STATUS_CONFIG.OFFLINE
              const av = avatarColor(doc.user.name)
              return (
                <tr key={doc.id} className="border-b border-gray-50 dark:border-[#1a1a1a] last:border-0 hover:bg-gray-50/50 dark:hover:bg-[#1a1a1a] transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {doc.user.profile_image
                        ? <img src={doc.user.profile_image} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                        : <div className={`w-9 h-9 rounded-xl ${av} flex items-center justify-center text-xs font-black text-white flex-shrink-0`}>{initials(doc.user.name)}</div>
                      }
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-[13px]">{doc.user.name}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{doc.user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">{doc.specialty}</span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-gray-600 dark:text-gray-400">{doc.department?.name || '—'}</td>
                  <td className="px-4 py-3 text-[12px] text-gray-600 dark:text-gray-400">{doc.room_number || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${sc.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${doc.status === 'AVAILABLE' ? 'animate-pulse' : ''}`} />
                      {sc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {doc.is_activated ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Active
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        {[{ done: !!doc.user.profile_image, tip: 'Photo' }, { done: doc.latitude != null, tip: 'Location' }, { done: doc.user.password_changed, tip: 'Password' }].map(s => (
                          <span key={s.tip} title={s.tip} className={`w-2 h-2 rounded-full ${s.done ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-[#333]'}`} />
                        ))}
                        <span className="ml-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                          {[!!doc.user.profile_image, doc.latitude != null, doc.user.password_changed].filter(Boolean).length}/3
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {(doc._count?.queueEntries ?? 0) > 0 ? (
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[11px] font-bold">
                        {doc._count?.queueEntries} in queue
                      </span>
                    ) : (
                      <span className="text-[12px] text-gray-300 dark:text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(doc)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all">
                        Edit
                      </button>
                      <button onClick={() => { setImpersonateDoctor(doc); setImpersonateKey(''); setImpersonateError('') }}
                        title="Login as this doctor"
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all">
                        Impersonate
                      </button>
                      <button onClick={() => setDeleteDoctor(doc)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <p className="text-3xl mb-2">👨‍⚕️</p>
                  <p className="text-sm text-gray-400">No doctors found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Doctor Modal */}
      {editDoctor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141414] rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-[#222]">
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white">Edit Doctor</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">{editDoctor.user.name}</p>
              </div>
              <button onClick={() => setEditDoctor(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#222] transition-colors">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={saveEdit} className="p-5 space-y-3">
              {editErrors._general && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 text-sm text-red-600">{editErrors._general}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Dr. Jane Smith"
                    className={`w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73] ${editErrors.name ? 'border-red-400' : 'border-gray-200 dark:border-[#333]'}`} />
                  <FieldError msg={editErrors.name} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Login Email *</label>
                  <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="doctor@hospital.co.zw"
                    className={`w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73] ${editErrors.email ? 'border-red-400' : 'border-gray-200 dark:border-[#333]'}`} />
                  <FieldError msg={editErrors.email} />
                </div>
              </div>

              {/* ID Number for password reset */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">New National ID (leave blank to keep password)</label>
                <input
                  placeholder="63-123456A78 (optional — resets password)"
                  value={editForm.idNumber}
                  onChange={e => { setEditForm(f => ({ ...f, idNumber: e.target.value })); setEditErrors(fe => ({ ...fe, idNumber: '' })) }}
                  className={`w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#003d73] font-mono uppercase ${editErrors.idNumber ? 'border-red-400' : 'border-gray-200 dark:border-[#333]'}`}
                />
                <p className="text-[10px] text-gray-400 mt-1">Format: 63-123456A78 · Filling this resets the doctor&apos;s password</p>
                <FieldError msg={editErrors.idNumber} />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73]">
                  <option value="AVAILABLE">Available</option>
                  <option value="BUSY">Busy</option>
                  <option value="ON_BREAK">On Break</option>
                  <option value="OFFLINE">Offline</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Specialty</label>
                  <select value={editForm.specialty} onChange={e => setEditForm(f => ({ ...f, specialty: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73]">
                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Department</label>
                  <select value={editForm.departmentId} onChange={e => setEditForm(f => ({ ...f, departmentId: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73]">
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Room Number</label>
                  <input value={editForm.roomNumber} onChange={e => setEditForm(f => ({ ...f, roomNumber: e.target.value }))}
                    placeholder="e.g. A-12"
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Phone (10 digits)</label>
                  <input value={editForm.phone}
                    placeholder="0771234567" maxLength={10}
                    onChange={e => { const v = e.target.value.replace(/\D/g, ''); setEditForm(f => ({ ...f, phone: v || '0' })); setEditErrors(fe => ({ ...fe, phone: '' })) }}
                    className={`w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#003d73] ${editErrors.phone ? 'border-red-400' : 'border-gray-200 dark:border-[#333]'}`} />
                  <FieldError msg={editErrors.phone} />
                </div>
              </div>

              {/* Coordinates — locked to Mutare */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Office Location (Mutare only · lat {MUTARE.latMin} to {MUTARE.latMax} · lng {MUTARE.lngMin} to {MUTARE.lngMax})
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input type="number" step="any"
                      value={editForm.latitude}
                      onChange={e => { setEditForm(f => ({ ...f, latitude: e.target.value })); setEditErrors(fe => ({ ...fe, coords: '' })) }}
                      placeholder="-18.9718"
                      className={`w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73] ${editErrors.coords ? 'border-red-400' : 'border-gray-200 dark:border-[#333]'}`} />
                    <p className="text-[10px] text-gray-400 mt-1">Latitude</p>
                  </div>
                  <div>
                    <input type="number" step="any"
                      value={editForm.longitude}
                      onChange={e => { setEditForm(f => ({ ...f, longitude: e.target.value })); setEditErrors(fe => ({ ...fe, coords: '' })) }}
                      placeholder="32.6703"
                      className={`w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73] ${editErrors.coords ? 'border-red-400' : 'border-gray-200 dark:border-[#333]'}`} />
                    <p className="text-[10px] text-gray-400 mt-1">Longitude</p>
                  </div>
                </div>
                <FieldError msg={editErrors.coords} />
                {editForm.latitude && editForm.longitude && !editErrors.coords && validateCoords(editForm.latitude, editForm.longitude) === null && (
                  <FieldOk msg="Valid Mutare coordinates" />
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setEditDoctor(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={editSaving}
                  className="flex-1 py-2.5 rounded-xl bg-[#003d73] hover:bg-[#002d57] text-white text-sm font-bold transition-colors disabled:opacity-50">
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Impersonate Modal */}
      {impersonateDoctor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141414] rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
                  <svg className="w-6 h-6 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">Admin Impersonation</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Login as {impersonateDoctor.user.name}</p>
                </div>
              </div>
              <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-xl p-3 mb-4">
                <p className="text-[11px] text-violet-700 dark:text-violet-400 leading-relaxed">
                  🔐 This action creates a temporary session as <strong>{impersonateDoctor.user.name}</strong> without their password.
                  Enter your admin impersonator key (set in the .env file) to proceed.
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1.5">Impersonator Key</label>
                  <input
                    type="password"
                    placeholder="Enter ADMIN_IMPERSONATOR_KEY..."
                    value={impersonateKey}
                    onChange={e => { setImpersonateKey(e.target.value); setImpersonateError('') }}
                    onKeyDown={e => e.key === 'Enter' && doImpersonate()}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  {impersonateError && <p className="text-[11px] text-red-500 mt-1">⚠ {impersonateError}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setImpersonateDoctor(null); setImpersonateKey('') }}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                    Cancel
                  </button>
                  <button onClick={doImpersonate} disabled={impersonating || !impersonateKey.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
                    {impersonating ? 'Logging in...' : 'Login as Doctor'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteDoctor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141414] rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">Remove Doctor?</h3>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{deleteDoctor.user.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{deleteDoctor.specialty}</p>
              <p className="text-xs text-gray-400 mt-3">This will permanently delete their account and login credentials.</p>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setDeleteDoctor(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-[#333] text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                  Cancel
                </button>
                <button onClick={confirmDelete} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
                  {deleting ? 'Removing...' : 'Remove Doctor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
