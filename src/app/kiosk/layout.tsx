'use client'

import { useTheme } from '@/components/ThemeProvider'
import PresenceDetector from '@/components/PresenceDetector'
import { FiSun, FiMoon } from 'react-icons/fi'

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className={`kiosk-container ${theme === 'dark' ? 'bg-kiosk-dark dark' : 'bg-kiosk-light'}`}>
      {/* Camera-based presence detection */}
      <PresenceDetector enabled={true} />

      {/* Header with dual logos */}
      <div className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-200/50 dark:border-[#222]/50">
        <div className="flex items-center gap-3">
          <img src="/coat-of-arms.png" alt="Coat of Arms" className="w-9 h-9 object-contain" />
          <div className="w-px h-7 bg-gray-200 dark:bg-[#333]" />
          <img src="/mohcc-logo.png" alt="MOHCC" className="w-9 h-9 object-contain" />
        </div>
        <p className="text-xs font-semibold text-gray-900 dark:text-white tracking-wide">Mutare Provincial Hospital</p>
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333] transition-all"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <FiMoon size={16} /> : <FiSun size={16} />}
        </button>
      </div>

      <div className="pt-14">
        {children}
      </div>
    </div>
  )
}

