'use client'

import { useTheme } from '@/components/ThemeProvider'
import PresenceDetector from '@/components/PresenceDetector'

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} h-screen w-screen overflow-hidden bg-white dark:bg-[#0a0a0a] flex flex-col`}>
      {/* Camera presence detection — no auto-redirect */}
      <PresenceDetector enabled={true} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}

