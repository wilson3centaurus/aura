'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MdLock, MdEmail } from 'react-icons/md'

export default function AdminLogin() {
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
        body: JSON.stringify({ email, password, role: 'ADMIN' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
      } else {
        router.push('/admin/dashboard')
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-[#fafbfc] dark:bg-[#0a0a0a]">
      <div className="w-full max-w-sm">
        {/* Logos */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <img src="/coat-of-arms.png" alt="Zimbabwe Coat of Arms" className="h-14 w-14 object-contain" />
          <div className="w-px h-10 bg-gray-300 dark:bg-gray-700" />
          <img src="/mohcc-logo.png" alt="MOHCC" className="h-14 w-auto object-contain" />
        </div>
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Mutare Provincial Hospital</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">AURA Hospital System — Admin Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111] rounded-xl p-6 space-y-4 border border-gray-200 dark:border-[#222] shadow-sm">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Email</label>
            <div className="relative">
              <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="admin@mutareprovincial.co.zw"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Password</label>
            <div className="relative">
              <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent" />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-black text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
          <a href="/kiosk" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">← Kiosk</a>
          <span>•</span>
          <a href="/doctor/login" className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Doctor Login →</a>
        </div>
      </div>
    </div>
  )
}
