'use client'

interface AuraLogoProps {
  size?: number
  showText?: boolean
  textColor?: string
}

export default function AuraLogo({ size = 52, showText = false, textColor = 'white' }: AuraLogoProps) {
  const id = `aura-grad-${size}`
  return (
    <div className="flex items-center gap-3 select-none">
      <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="AURA Logo">
        <defs>
          <linearGradient id={`${id}-a`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#1e3a8a" />
            <stop offset="50%"  stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
          <linearGradient id={`${id}-b`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id={`${id}-shadow`}>
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1e3a8a" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Outer glow ring */}
        <circle cx="32" cy="32" r="31" fill="none" stroke="#3b82f6" strokeWidth="0.5" strokeOpacity="0.4" />

        {/* Main background circle */}
        <circle cx="32" cy="32" r="29" fill={`url(#${id}-a)`} filter={`url(#${id}-shadow)`} />

        {/* Shine highlight top-half */}
        <ellipse cx="32" cy="22" rx="18" ry="12" fill={`url(#${id}-b)`} />

        {/* Subtle inner ring */}
        <circle cx="32" cy="32" r="26" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.15" />

        {/* A letterform — left leg */}
        <line x1="21" y1="50" x2="32" y2="16" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
        {/* A letterform — right leg */}
        <line x1="43" y1="50" x2="32" y2="16" stroke="white" strokeWidth="4.5" strokeLinecap="round" />

        {/* ECG / heartbeat crossbar (replaces the flat crossbar on the A) */}
        <path
          d="M24 37.5 L26.5 37.5 L28,33 L30 43 L32 36 L33.5 37.5 L40 37.5"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Apex dot */}
        <circle cx="32" cy="16" r="2.5" fill="white" fillOpacity="0.7" />
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className="font-black tracking-[0.12em] text-xl"
            style={{ color: textColor }}
          >
            AURA
          </span>
          <span
            className="text-[10px] font-medium tracking-widest uppercase opacity-75 mt-0.5"
            style={{ color: textColor }}
          >
            Hospital Assistant
          </span>
        </div>
      )}
    </div>
  )
}
