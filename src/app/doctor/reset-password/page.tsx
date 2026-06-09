'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters',       pass: password.length >= 8 },
    { label: 'One uppercase letter (A–Z)',   pass: /[A-Z]/.test(password) },
    { label: 'One lowercase letter (a–z)',   pass: /[a-z]/.test(password) },
    { label: 'One number (0–9)',             pass: /\d/.test(password) },
    { label: 'One special character (!@#…)', pass: /[^A-Za-z0-9]/.test(password) },
  ]
  const passed = checks.filter(c => c.pass).length
  const strength = passed <= 1 ? 'Weak' : passed <= 3 ? 'Fair' : passed === 4 ? 'Good' : 'Strong'
  const barColor = passed <= 1 ? 'bg-red-500' : passed <= 3 ? 'bg-amber-500' : passed === 4 ? 'bg-blue-500' : 'bg-emerald-500'

  if (!password) return null

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-[#222] rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${(passed / 5) * 100}%` }} />
        </div>
        <span className={`text-[11px] font-bold ${barColor.replace('bg-', 'text-')}`}>{strength}</span>
      </div>
      <div className="grid grid-cols-1 gap-1">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-1.5">
            <span className={`text-xs ${c.pass ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600'}`}>
              {c.pass ? '✓' : '○'}
            </span>
            <span className={`text-[11px] ${c.pass ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword
  const passwordValid = newPassword.length >= 8

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) { setError('Invalid reset link. Please request a new one.'); return }
    if (!passwordValid) { setError('Password must be at least 8 characters.'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
      } else {
        setError(data.error || 'Failed to reset password.')
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setLoading(false)
  }

  if (!token) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-black text-gray-900 dark:text-white mb-2">Invalid Reset Link</h2>
        <p className="text-sm text-gray-500 mb-5">This link is missing a reset token. Please go back to the login page and request a new reset link.</p>
        <a href="/doctor/login" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0a4f3f] text-white text-sm font-bold hover:bg-[#093d31] transition-colors">
          ← Back to Login
        </a>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-black text-gray-900 dark:text-white mb-2">Password Updated!</h2>
        <p className="text-sm text-gray-500 mb-6">Your password has been changed successfully. You can now log in with your new password.</p>
        <button onClick={() => router.push('/doctor/login')}
          className="w-full py-3 rounded-xl bg-[#0a4f3f] hover:bg-[#093d31] text-white text-sm font-bold transition-colors shadow-lg">
          Sign In Now
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="mb-7">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Set New Password</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Choose a strong password for your AURA account</p>
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
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">New Password</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              placeholder="Enter your new password"
              autoComplete="new-password"
              className="w-full px-4 py-3 pr-11 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            <button type="button" onClick={() => setShowNew(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              {showNew
                ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              }
            </button>
          </div>
          <PasswordStrength password={newPassword} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              className={`w-full px-4 py-3 pr-11 rounded-xl bg-gray-50 dark:bg-[#111] border text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                confirmPassword
                  ? passwordsMatch
                    ? 'border-emerald-400 focus:ring-emerald-500'
                    : 'border-red-400 focus:ring-red-500'
                  : 'border-gray-200 dark:border-[#222] focus:ring-emerald-500'
              }`}
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              {showConfirm
                ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              }
            </button>
          </div>
          {confirmPassword && (
            <p className={`text-[11px] mt-1 flex items-center gap-1 ${passwordsMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {passwordsMatch ? '✓ Passwords match' : '⚠ Passwords do not match'}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !passwordValid || !passwordsMatch}
          className="w-full py-3 rounded-xl bg-[#0a4f3f] hover:bg-[#093d31] text-white text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20 mt-2"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Updating password...
            </span>
          ) : 'Set New Password'}
        </button>
      </form>

      <div className="mt-5 text-center">
        <a href="/doctor/login" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          ← Back to Login
        </a>
      </div>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-10 bg-gradient-to-br from-[#0a4f3f] via-[#0d6e56] to-[#0f8f70] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute bottom-1/3 -left-32 w-72 h-72 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-4">
          <img src="/coat-of-arms.png" alt="Zimbabwe Coat of Arms" className="h-14 w-14 object-contain drop-shadow-md" />
          <div className="w-px h-10 bg-white/30" />
          <img src="/mohcc-logo.png" alt="MOHCC" className="h-12 w-auto object-contain drop-shadow-md" />
        </div>
        <div className="relative">
          <h1 className="text-4xl font-black text-white leading-tight mb-3">
            Password<br />Reset
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Choose a strong new password to keep your clinical account secure.
          </p>
        </div>
        <div className="relative space-y-2">
          {[
            { icon: '🔐', text: 'Min. 8 characters required' },
            { icon: '🔡', text: 'Mix of upper, lower and numbers' },
            { icon: '⏱️', text: 'Reset link valid for 1 hour' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <span className="text-lg">{icon}</span>
              <span className="text-white/60 text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-[#0a0a0a]">
        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <img src="/coat-of-arms.png" alt="Coat of Arms" className="h-10 w-10 object-contain" />
          <div className="w-px h-8 bg-gray-300 dark:bg-gray-700" />
          <img src="/mohcc-logo.png" alt="MOHCC" className="h-10 w-auto object-contain" />
        </div>
        <div className="w-full max-w-sm">
          <Suspense fallback={<div className="flex items-center justify-center h-32"><div className="w-6 h-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" /></div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
