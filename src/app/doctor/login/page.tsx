'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DoctorLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSending, setForgotSending] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotEmailSent, setForgotEmailSent] = useState(false)
  const [forgotResetLink, setForgotResetLink] = useState('')
  const [copied, setCopied] = useState(false)

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
      if (!res.ok) setError(data.error || 'Invalid credentials')
      else router.push('/doctor/dashboard')
    } catch {
      setError('Network error. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-10 bg-gradient-to-br from-[#0a4f3f] via-[#0d6e56] to-[#0f8f70] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute bottom-1/3 -left-32 w-72 h-72 rounded-full bg-white/5" />

        <div className="relative flex items-center gap-4">
          <img src="/coat-of-arms.png" alt="Zimbabwe Coat of Arms" className="h-14 w-14 object-contain drop-shadow-md" />
          <div className="w-px h-10 bg-white/30" />
          <img src="/mohcc-logo.png" alt="MOHCC" className="h-12 w-auto object-contain drop-shadow-md" />
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/15 mb-6">
            <svg className="w-3.5 h-3.5 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
            <span className="text-white/80 text-xs font-medium tracking-wide">AURA Clinical Portal</span>
          </div>
          <h1 className="text-4xl font-black text-white leading-tight mb-3">
            Doctor<br />Workstation
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Your clinical workspace. Manage patients, appointments, and queues in real-time. Your email is your username; your ID number is your password.
          </p>
        </div>

        <div className="relative space-y-2">
          {[
            { icon: '📋', text: 'Real-time appointment requests' },
            { icon: '👥', text: 'Patient queue management' },
            { icon: '📊', text: 'Clinical overview & stats' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <span className="text-lg">{icon}</span>
              <span className="text-white/60 text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-[#0a0a0a]">
        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <img src="/coat-of-arms.png" alt="Coat of Arms" className="h-10 w-10 object-contain" />
          <div className="w-px h-8 bg-gray-300 dark:bg-gray-700" />
          <img src="/mohcc-logo.png" alt="MOHCC" className="h-10 w-auto object-contain" />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Doctor Sign In</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Access your clinical dashboard</p>
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
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Username</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="Enter your email address or username"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? (
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end -mt-1">
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#0a4f3f] hover:bg-[#093d31] text-white text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign in to Dashboard'}
            </button>
          </form>

          {/* Forgot Password Modal */}
          {showForgot && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#141414] rounded-2xl w-full max-w-sm shadow-2xl">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-emerald-700 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900 dark:text-white">Forgot Password?</h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">Reset via email or use your default</p>
                    </div>
                    <button onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(''); setForgotResetLink(''); setForgotEmailSent(false); setCopied(false) }}
                      className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#222] transition-colors">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  {forgotSent ? (
                    <div className="space-y-4">
                      {forgotEmailSent ? (
                        <div className="text-center py-4">
                          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm font-black text-gray-900 dark:text-white mb-1">Email sent!</p>
                          <p className="text-[12px] text-gray-500 leading-relaxed">
                            A reset link was sent to <strong>{forgotEmail}</strong>. Check your inbox and spam folder.
                          </p>
                          <p className="text-[11px] text-gray-400 mt-2">The link expires in 1 hour.</p>
                        </div>
                      ) : forgotResetLink ? (
                        <div className="py-2">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs font-black text-amber-700 dark:text-amber-400">Email delivery failed</p>
                              <p className="text-[10px] text-gray-400">Use the link below to reset your password</p>
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-500 mb-1.5 font-semibold">Your password reset link:</p>
                          <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] font-mono text-[10px] text-gray-600 dark:text-gray-300 break-all leading-relaxed mb-2">
                            {forgotResetLink}
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(forgotResetLink)
                              setCopied(true)
                              setTimeout(() => setCopied(false), 2500)
                            }}
                            className="w-full py-2 rounded-xl bg-gray-100 dark:bg-[#222] hover:bg-gray-200 dark:hover:bg-[#333] text-gray-700 dark:text-gray-300 text-xs font-bold transition-colors flex items-center justify-center gap-2"
                          >
                            {copied ? (
                              <><svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Copied!</>
                            ) : (
                              <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy Link</>
                            )}
                          </button>
                          <a
                            href={forgotResetLink}
                            className="mt-2 w-full py-2 rounded-xl bg-[#0a4f3f] hover:bg-[#093d31] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                          >
                            Open Reset Page →
                          </a>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm font-black text-gray-900 dark:text-white mb-1">Request received</p>
                          <p className="text-[12px] text-gray-500 leading-relaxed">
                            If <strong>{forgotEmail}</strong> is registered, a reset link has been sent.
                          </p>
                        </div>
                      )}
                      <button onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(''); setForgotResetLink(''); setForgotEmailSent(false); setCopied(false) }}
                        className="w-full py-2.5 rounded-xl bg-[#0a4f3f] hover:bg-[#093d31] text-white text-sm font-bold transition-colors">
                        Back to Login
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Default password hint */}
                      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                        <p className="text-[11px] font-bold text-blue-800 dark:text-blue-300 mb-1.5">Haven&apos;t changed your password yet?</p>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="px-2 py-1 rounded bg-white dark:bg-[#0a0a0a] border border-blue-200 dark:border-blue-800 text-gray-700 dark:text-gray-300">71-2002414R42</span>
                          <svg className="w-3 h-3 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                          <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-black">712002414r42</span>
                        </div>
                        <p className="text-[10px] text-blue-600/70 dark:text-blue-400/60 mt-1">Your ID without the dash, all lowercase</p>
                      </div>

                      {/* Email reset */}
                      <div className="pt-1">
                        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Or send a reset link to your email</p>
                        <input
                          type="email"
                          placeholder="Your registered email address"
                          value={forgotEmail}
                          onChange={e => setForgotEmail(e.target.value)}
                          onKeyDown={async e => {
                            if (e.key === 'Enter' && forgotEmail.trim()) {
                              setForgotSending(true)
                              try {
                                const r = await fetch('/api/auth/forgot-password', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ email: forgotEmail }),
                                })
                                const d = await r.json()
                                setForgotEmailSent(d.emailSent === true)
                                if (d.resetLink) setForgotResetLink(d.resetLink)
                              } finally {
                                setForgotSending(false)
                                setForgotSent(true)
                              }
                            }
                          }}
                          className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          disabled={!forgotEmail.trim() || forgotSending}
                          onClick={async () => {
                            setForgotSending(true)
                            try {
                              const r = await fetch('/api/auth/forgot-password', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: forgotEmail }),
                              })
                              const d = await r.json()
                              setForgotEmailSent(d.emailSent === true)
                              if (d.resetLink) setForgotResetLink(d.resetLink)
                            } finally {
                              setForgotSending(false)
                              setForgotSent(true)
                            }
                          }}
                          className="w-full mt-2 py-2.5 rounded-xl bg-[#0a4f3f] hover:bg-[#093d31] text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {forgotSending ? (
                            <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Sending...</>
                          ) : 'Send Reset Link'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
            <a href="/kiosk" className="hover:text-gray-600 dark:hover:text-gray-200 transition-colors">← Patient Kiosk</a>
            <span className="text-gray-200 dark:text-gray-700">|</span>
            <a href="/admin/login" className="hover:text-gray-600 dark:hover:text-gray-200 transition-colors">Admin Login →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
