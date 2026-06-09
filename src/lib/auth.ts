import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function signToken(payload: { userId: string; role: string; name: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(secret)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as { userId: string; role: string; name: string }
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('aura-token')?.value
  if (!token) return null
  return verifyToken(token)
}

// Password reset tokens — 1-hour expiry, separate from session tokens
export async function signResetToken(payload: { userId: string; email: string }) {
  return new SignJWT({ ...payload, purpose: 'password-reset' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .sign(secret)
}

export async function verifyResetToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret)
    if (payload.purpose !== 'password-reset') return null
    return payload as { userId: string; email: string; purpose: string }
  } catch {
    return null
  }
}
