import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { signToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const { email, password, role } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  if (role && user.role !== role) {
    return NextResponse.json({ error: `This account is not a ${role.toLowerCase()} account` }, { status: 403 })
  }

  const token = await signToken({ userId: user.id, role: user.role, name: user.name })

  const response = NextResponse.json({ success: true, user: { id: user.id, name: user.name, role: user.role } })
  response.cookies.set('aura-token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  })

  return response
}
