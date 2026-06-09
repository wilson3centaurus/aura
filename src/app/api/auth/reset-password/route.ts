import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { verifyResetToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const { token, newPassword } = await request.json()

  if (!token || !newPassword) {
    return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 })
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const payload = await verifyResetToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'This reset link is invalid or has expired. Please request a new one.' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  const { error } = await supabase
    .from('users')
    .update({ password: hashedPassword, password_changed: true })
    .eq('id', payload.userId)
    .eq('role', 'DOCTOR')

  if (error) {
    return NextResponse.json({ error: 'Failed to update password. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
