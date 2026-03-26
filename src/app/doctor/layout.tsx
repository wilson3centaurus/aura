'use client'

import { useTheme } from '@/components/ThemeProvider'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { MdDashboard, MdQueue, MdCalendarToday, MdLogout, MdDarkMode, MdLightMode, MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md'

const NAV_ITEMS = [
  { href: '/doctor/dashboard', label: 'Dashboard', icon: MdDashboard },
  { href: '/doctor/dashboard/queue', label: 'My Queue', icon: MdQueue },
  { href: '/doctor/dashboard/appointments', label: 'Appointments', icon: MdCalendarToday },
]

interface Profile {
  name: string
  specialty: string
  profile_image: string | null
  email: string
}

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const SIZE = 400
        const canvas = document.createElement('canvas')
        canvas.width = SIZE; canvas.height = SIZE
        const ctx = canvas.getContext('2d')!
        const scale = Math.max(SIZE / img.width, SIZE / img.height)
        const sw = img.width * scale, sh = img.height * scale
        ctx.drawImage(img, (SIZE - sw) / 2, (SIZE - sh) / 2, sw, sh)
        resolve(canvas.toDataURL('image/jpeg', 0.75))
      }
      img.onerror = reject
      img.src = ev.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function EditProfileModal({ profile, onClose, onSaved }: { profile: Profile; onClose: () => void; onSaved: (p: Profile) => void }) {
  const [tab, setTab] = useState<'info' | 'photo' | 'password'>('info')
  const [name, setName] = useState(profile.name)
  const [email, setEmail] = useState(profile.email)
  const [photoPreview, setPhotoPreview] = useState<string | null>(profile.profile_image)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setError('')
    try { setPhotoPreview(await resizeImage(file)) } catch { setError('Could not process image.') }
    if (fileRef.current) fileRef.current.value = ''
  }

  const saveInfo = async () => {
    if (!name.trim()) { setError('Name is required.'); return }
    setSaving(true); setError(''); setSuccess('')
    const res = await fetch('/api/doctors/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email }) })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to save.'); setSaving(false); return }
    onSaved({ ...profile, name, email })
    setSuccess('Profile updated!'); setSaving(false)
  }

  const savePhoto = async () => {
    if (!photoPreview) return
    setSaving(true); setError(''); setSuccess('')
    const res = await fetch('/api/doctors/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileImage: photoPreview }) })
    if (!res.ok) { setError('Failed to save photo.'); setSaving(false); return }
    onSaved({ ...profile, profile_image: photoPreview })
    setSuccess('Photo updated!'); setSaving(false)
  }

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('')
    if (newPw.length < 8) { setError('New password must be at least 8 characters.'); return }
    if (newPw !== confirmPw) { setError('Passwords do not match.'); return }
    setSaving(true)
    const res = await fetch('/api/doctors/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: currentPw, password: newPw }) })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Failed to update password.'); setSaving(false); return }
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
    setSuccess('Password updated!'); setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111] rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-[#222]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#222]">
          <h3 className="text-sm font-black text-gray-900 dark:text-white">Edit Profile</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#222]">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex border-b border-gray-100 dark:border-[#222]">
          {(['info', 'photo', 'password'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); setSuccess('') }}
              className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors
                ${tab === t ? 'text-[#003d73] dark:text-blue-400 border-b-2 border-[#003d73] dark:border-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
              {t === 'info' ? 'Name & Email' : t === 'photo' ? 'Profile Photo' : 'Password'}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === 'info' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Dr. ..."
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              {success && <p className="text-xs text-emerald-500">{success}</p>}
              <button onClick={saveInfo} disabled={saving}
                className="w-full py-2.5 rounded-xl bg-[#003d73] hover:bg-[#002d57] disabled:opacity-40 text-white text-sm font-black transition-colors">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {tab === 'photo' && (
            <div className="space-y-3">
              <div className="flex justify-center">
                <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#1a1a1a] border-2 border-dashed border-gray-300 dark:border-[#333] flex items-center justify-center">
                  {photoPreview
                    ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    : <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  }
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 dark:border-[#333] text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Upload
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                </label>
                <label className="flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 dark:border-[#333] text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Camera
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
                </label>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              {success && <p className="text-xs text-emerald-500">{success}</p>}
              <button onClick={savePhoto} disabled={!photoPreview || saving}
                className="w-full py-2.5 rounded-xl bg-[#003d73] hover:bg-[#002d57] disabled:opacity-40 text-white text-sm font-black transition-colors">
                {saving ? 'Saving...' : 'Update Photo'}
              </button>
            </div>
          )}

          {tab === 'password' && (
            <form onSubmit={savePassword} className="space-y-3">
              <div className="relative">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Current Password</label>
                <input type={showPw ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)} required
                  className="w-full px-3 py-2.5 pr-10 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-[30px] text-gray-400">
                  {showPw
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                </button>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">New Password</label>
                <input type={showPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8}
                  className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                <input type={showPw ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required
                  className={`w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#003d73] ${confirmPw && confirmPw !== newPw ? 'border-red-400' : 'border-gray-200 dark:border-[#333]'}`} />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              {success && <p className="text-xs text-emerald-500">{success}</p>}
              <button type="submit" disabled={saving}
                className="w-full py-2.5 rounded-xl bg-[#003d73] hover:bg-[#002d57] disabled:opacity-40 text-white text-sm font-black transition-colors">
                {saving ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showEditProfile, setShowEditProfile] = useState(false)

  const isLoginPage = pathname === '/doctor/login'
  const isSetupPage = pathname === '/doctor/setup'

  const loadProfile = () => {
    fetch('/api/doctors/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d) {
        setProfile({ name: d.user?.name || 'Doctor', specialty: d.specialty || '', profile_image: d.user?.profile_image || null, email: d.user?.email || '' })
        if (!d.is_activated) router.push('/doctor/setup')
      }
    }).catch(() => {})
  }

  useEffect(() => {
    if (!isLoginPage && !isSetupPage) loadProfile()
  }, [isLoginPage, isSetupPage])

  if (isLoginPage || isSetupPage) {
    return (
      <div className="h-screen overflow-y-auto bg-gray-50 dark:bg-[#0a0a0a]">
        <button onClick={toggleTheme} className="fixed top-3 right-3 z-50 p-2 rounded-full bg-white/80 dark:bg-[#222]/80 shadow-md text-lg text-gray-600 dark:text-gray-400" aria-label="Toggle theme">
          {theme === 'light' ? <MdDarkMode /> : <MdLightMode />}
        </button>
        {children}
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden">
      {showEditProfile && profile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditProfile(false)}
          onSaved={updated => { setProfile(updated); setShowEditProfile(false) }}
        />
      )}

      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-[68px]' : 'w-[240px]'} bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-[#222] flex flex-col h-full flex-shrink-0 transition-all duration-200`}>
        <div className={`p-4 border-b border-gray-200 dark:border-[#222] flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <img src="/coat-of-arms.png" alt="" className="w-8 h-8 object-contain" />
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate">AURA</h1>
              <p className="text-[10px] text-gray-500 truncate">Doctor Portal</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <button key={item.href} onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all
                  ${active ? 'bg-gray-900 dark:bg-white text-white dark:text-black' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#111]'}
                  ${collapsed ? 'justify-center px-2' : ''}`}>
                <Icon size={18} />
                {!collapsed && item.label}
              </button>
            )
          })}
        </nav>

        <div className="p-2 border-t border-gray-200 dark:border-[#222] space-y-0.5">
          <button onClick={toggleTheme}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#111] ${collapsed ? 'justify-center px-2' : ''}`}>
            {theme === 'light' ? <MdDarkMode size={18} /> : <MdLightMode size={18} />}
            {!collapsed && (theme === 'light' ? 'Dark Mode' : 'Light Mode')}
          </button>
          <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/doctor/login') }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 ${collapsed ? 'justify-center px-2' : ''}`}>
            <MdLogout size={18} />
            {!collapsed && 'Logout'}
          </button>
        </div>

        <button onClick={() => setCollapsed(!collapsed)}
          className="p-2 border-t border-gray-200 dark:border-[#222] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          {collapsed ? <MdKeyboardArrowRight size={18} /> : <MdKeyboardArrowLeft size={18} />}
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-14 border-b border-gray-200 dark:border-[#222] bg-white dark:bg-[#0a0a0a] flex items-center justify-between px-6 flex-shrink-0 z-10">
          <div className="text-[13px] text-gray-500">
            {pathname.split('/').filter(Boolean).map((seg, i, arr) => (
              <span key={i}>{i > 0 && ' / '}<span className={i === arr.length - 1 ? 'text-gray-900 dark:text-white font-medium' : ''}>{seg.charAt(0).toUpperCase() + seg.slice(1)}</span></span>
            ))}
          </div>
          {profile && (
            <button onClick={() => setShowEditProfile(true)} className="flex items-center gap-3 group">
              <div className="text-right">
                <p className="text-[13px] font-medium text-gray-900 dark:text-white group-hover:text-[#003d73] dark:group-hover:text-blue-400 transition-colors">Dr. {profile.name}</p>
                <p className="text-[10px] text-gray-500">{profile.specialty}</p>
              </div>
              {profile.profile_image ? (
                <img src={profile.profile_image} alt="Profile" className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-200 dark:ring-[#333] group-hover:ring-[#003d73] transition-all" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-black text-sm font-bold ring-2 ring-gray-200 dark:ring-[#333] group-hover:ring-[#003d73] transition-all">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
            </button>
          )}
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
