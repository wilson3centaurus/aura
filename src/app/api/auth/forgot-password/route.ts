import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { signResetToken } from '@/lib/auth'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  // Look up doctor by email — always return success to prevent email enumeration
  const { data: user } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('email', email.toLowerCase().trim())
    .eq('role', 'DOCTOR')
    .single()

  if (user) {
    const token = await signResetToken({ userId: user.id, email: user.email })
    const baseUrl = process.env.NEXT_PUBLIC_PUBLIC_URL || `http://localhost:3000`
    const resetLink = `${baseUrl}/doctor/reset-password?token=${token}`

    const result = await sendPasswordResetEmail({
      toEmail: user.email,
      doctorName: user.name,
      resetLink,
    })

    // If email failed, return the reset link directly so it can be used as fallback
    if (!result.success) {
      console.error('[ForgotPassword] Email failed:', result.reason)
      return NextResponse.json({
        success: true,
        emailSent: false,
        resetLink,
        smtpError: result.reason,
      })
    }

    return NextResponse.json({ success: true, emailSent: true })
  }

  // User not found — still return generic success (prevents email enumeration)
  return NextResponse.json({ success: true, emailSent: false })
}
