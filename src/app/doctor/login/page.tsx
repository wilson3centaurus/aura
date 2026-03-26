'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DoctorLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'DOCTOR' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
      } else {
        router.push('/doctor/dashboard')
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-4 mb-8">
          <img src="/coat-of-arms.png" alt="Coat of Arms" className="w-14 h-14 object-contain" />
          <div className="w-px h-10 bg-gray-200 dark:bg-[#333]" />
          <img src="/mohcc-logo.png" alt="MOHCC" className="w-14 h-14 object-contain" />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Doctor Login</h1>
          <p className="text-xs text-gray-500 mt-1">Mutare Provincial Hospital</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#222] p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="doctor@mutareprovincial.co.zw"
              className="w-full px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Password (ID Number)</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-4 text-[11px] text-gray-400">
          <a href="/kiosk" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Back to Kiosk</a>
          {' · '}
          <a href="/admin/login" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Admin Login</a>
        </p>
      </div>
    </div>
  )
}
