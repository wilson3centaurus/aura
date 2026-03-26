'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'ADMIN' }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error || 'Invalid credentials')
      else router.push('/admin/dashboard')
    } catch {
      setError('Network error. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-10 bg-gradient-to-br from-[#003d73] via-[#005a9e] to-[#0077cc] relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -right-32 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 left-1/4 w-64 h-64 rounded-full bg-white/5" />

        {/* Top logos */}
        <div className="relative flex items-center gap-4">
          <img src="/coat-of-arms.png" alt="Zimbabwe Coat of Arms" className="h-14 w-14 object-contain drop-shadow-md" />
          <div className="w-px h-10 bg-white/30" />
          <img src="/mohcc-logo.png" alt="MOHCC" className="h-12 w-auto object-contain drop-shadow-md" />
        </div>

        {/* Center text */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/15 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/80 text-xs font-medium tracking-wide">AURA Hospital Management System</span>
          </div>
          <h1 className="text-4xl font-black text-white leading-tight mb-3">
            Mutare<br />Provincial<br />Hospital
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Ministry of Health and Child Care — Zimbabwe. Providing quality healthcare to the Manicaland province and surrounding communities.
          </p>
        </div>

        {/* Bottom info */}
        <div className="relative flex items-center gap-6">
          {[['10+', 'Departments'], ['50+', 'Doctors'], ['300+', 'Beds']].map(([n, l]) => (
            <div key={l}>
              <p className="text-2xl font-black text-white">{n}</p>
              <p className="text-white/50 text-xs">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-[#0a0a0a]">
        {/* Mobile logos */}
        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <img src="/coat-of-arms.png" alt="Coat of Arms" className="h-10 w-10 object-contain" />
          <div className="w-px h-8 bg-gray-300 dark:bg-gray-700" />
          <img src="/mohcc-logo.png" alt="MOHCC" className="h-10 w-auto object-contain" />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Admin Portal</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to manage the hospital system</p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@mutareprovincial.co.zw"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  {showPassword ? (
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#003d73] hover:bg-[#002d57] text-white text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign in to Admin Portal'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
            <a href="/kiosk" className="hover:text-gray-600 dark:hover:text-gray-200 transition-colors">← Patient Kiosk</a>
            <span className="text-gray-200 dark:text-gray-700">|</span>
            <a href="/doctor/login" className="hover:text-gray-600 dark:hover:text-gray-200 transition-colors">Doctor Login →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
