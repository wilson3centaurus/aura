'use client'

import { useTheme } from '@/components/ThemeProvider'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { MdDashboard, MdQueue, MdCalendarToday, MdLogout, MdDarkMode, MdLightMode, MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md'

const NAV_ITEMS = [
  { href: '/doctor/dashboard', label: 'Dashboard', icon: MdDashboard },
  { href: '/doctor/dashboard/queue', label: 'My Queue', icon: MdQueue },
  { href: '/doctor/dashboard/appointments', label: 'Appointments', icon: MdCalendarToday },
]

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [profile, setProfile] = useState<{ name: string; specialty: string } | null>(null)

  const isLoginPage = pathname === '/doctor/login'
  const isSetupPage = pathname === '/doctor/setup'

  useEffect(() => {
    if (!isLoginPage && !isSetupPage) {
      fetch('/api/doctors/me').then(r => r.ok ? r.json() : null).then(d => {
        if (d) {
          setProfile({ name: d.user?.name || 'Doctor', specialty: d.specialty || '' })
          if (!d.is_activated) router.push('/doctor/setup')
        }
      }).catch(() => {})
    }
  }, [isLoginPage, isSetupPage])

  if (isLoginPage || isSetupPage) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
        <button onClick={toggleTheme} className="fixed top-3 right-3 z-50 p-2 rounded-full bg-white/80 dark:bg-[#222]/80 shadow-md text-lg text-gray-600 dark:text-gray-400" aria-label="Toggle theme">
          {theme === 'light' ? <MdDarkMode /> : <MdLightMode />}
        </button>
        {children}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-[68px]' : 'w-[240px]'} bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-[#222] flex flex-col h-screen sticky top-0 transition-all duration-200`}>
        <div className={`p-4 border-b border-gray-200 dark:border-[#222] flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <img src="/coat-of-arms.png" alt="" className="w-8 h-8 object-contain" />
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate">AURA</h1>
              <p className="text-[10px] text-gray-500 truncate">Doctor Portal</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
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
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-14 border-b border-gray-200 dark:border-[#222] bg-white dark:bg-[#0a0a0a] flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="text-[13px] text-gray-500">
            {pathname.split('/').filter(Boolean).map((seg, i, arr) => (
              <span key={i}>{i > 0 && ' / '}<span className={i === arr.length - 1 ? 'text-gray-900 dark:text-white font-medium' : ''}>{seg.charAt(0).toUpperCase() + seg.slice(1)}</span></span>
            ))}
          </div>
          {profile && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[13px] font-medium text-gray-900 dark:text-white">Dr. {profile.name}</p>
                <p className="text-[10px] text-gray-500">{profile.specialty}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-black text-xs font-bold">
                {profile.name.charAt(0)}
              </div>
            </div>
          )}
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
