'use client'

import { useTheme } from '@/components/ThemeProvider'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  MdDashboard, MdPeople, MdLocalHospital, MdMedication,
  MdPayment, MdPersonPin, MdMap, MdLogout,
  MdLightMode, MdDarkMode, MdBed, MdCalendarMonth,
  MdMenu, MdClose, MdKeyboardArrowDown, MdSettings,
  MdBarChart,
} from 'react-icons/md'

const NAV_ITEMS = [
  { href: '/admin/dashboard',   label: 'Dashboard',        icon: MdDashboard },
  { href: '/admin/doctors',     label: 'Doctors',          icon: MdPeople },
  { href: '/admin/departments', label: 'Departments',      icon: MdLocalHospital },
  { href: '/admin/wards',       label: 'Wards & Beds',     icon: MdBed },
  { href: '/admin/medications', label: 'Medications',      icon: MdMedication },
  { href: '/admin/fees',        label: 'Fees & Pricing',   icon: MdPayment },
  { href: '/admin/patients',    label: 'Patients',         icon: MdPersonPin },
  { href: '/admin/appointments',label: 'Appointments',     icon: MdCalendarMonth },
  { href: '/admin/map',         label: 'Map',              icon: MdMap },
  { href: '/admin/reports',     label: 'Reports',          icon: MdBarChart },
  { href: '/admin/settings',    label: 'Settings',         icon: MdSettings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [userName, setUserName] = useState('Admin')

  useEffect(() => {
    // Attempt to get the user's name from the cookie/session
    fetch('/api/doctors/me').catch(() => {})
  }, [])

  if (pathname === '/admin/login') {
    return (
      <div className="dashboard-container bg-slate-50 dark:bg-gray-950">
        <button onClick={toggleTheme}
          className="fixed top-3 right-3 z-50 w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-md text-gray-600 dark:text-gray-300">
          {theme === 'light' ? <MdDarkMode size={17} /> : <MdLightMode size={17} />}
        </button>
        {children}
      </div>
    )
  }

  return (
    <div className="dashboard-container flex bg-[#fafbfc] dark:bg-[#0a0a0a]">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-[68px]' : 'w-[240px]'} flex flex-col h-screen sticky top-0 bg-white dark:bg-[#111] border-r border-gray-200 dark:border-[#222] transition-all duration-200`}>
        {/* Header */}
        <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'px-4'} py-3 border-b border-gray-100 dark:border-[#222]`}>
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <img src="/coat-of-arms.png" alt="CoA" className="h-8 w-8 object-contain flex-shrink-0" />
              <img src="/mohcc-logo.png" alt="MOHCC" className="h-8 w-auto object-contain flex-shrink-0" />
              <div className="min-w-0 ml-1">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest leading-none">MOHCC</p>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">Mutare Provincial</p>
              </div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
            {collapsed ? <MdMenu size={18} /> : <MdClose size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
            return (
              <button key={item.href} onClick={() => router.push(item.href)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150
                  ${active
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] hover:text-gray-900 dark:hover:text-gray-200'
                  }`}>
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-gray-100 dark:border-[#222] space-y-0.5">
          <button onClick={toggleTheme}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]`}>
            {theme === 'light' ? <MdDarkMode size={18} /> : <MdLightMode size={18} />}
            {!collapsed && (theme === 'light' ? 'Dark Mode' : 'Light Mode')}
          </button>
          <button
            onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/admin/login') }}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10`}>
            <MdLogout size={18} />
            {!collapsed && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between h-12 px-6 bg-white/80 dark:bg-[#111]/80 backdrop-blur-xl border-b border-gray-200 dark:border-[#222]">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">
              {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
            </h1>
          </div>
          <div className="relative">
            <button onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-[13px] text-gray-600 dark:text-gray-400">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold">
                A
              </div>
              <span className="font-medium">{userName}</span>
              <MdKeyboardArrowDown size={16} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-200 dark:border-[#333] py-1 z-50">
                <button onClick={() => { setProfileOpen(false); router.push('/admin/dashboard') }}
                  className="w-full text-left px-3 py-2 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222]">
                  Dashboard
                </button>
                <hr className="my-1 border-gray-100 dark:border-[#333]" />
                <button
                  onClick={async () => { setProfileOpen(false); await fetch('/api/auth/logout', { method: 'POST' }); router.push('/admin/login') }}
                  className="w-full text-left px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10">
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

