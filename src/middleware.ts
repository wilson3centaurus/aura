import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect doctor dashboard routes
  if (pathname.startsWith('/doctor/dashboard') || pathname.startsWith('/doctor/appointments') || pathname.startsWith('/doctor/queue')) {
    const token = request.cookies.get('aura-token')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/doctor/login', request.url))
    }
    const session = await verifyToken(token)
    if (!session || session.role !== 'DOCTOR') {
      return NextResponse.redirect(new URL('/doctor/login', request.url))
    }
  }

  // Protect admin dashboard routes
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('aura-token')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    const session = await verifyToken(token)
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/doctor/dashboard/:path*', '/doctor/appointments/:path*', '/doctor/queue/:path*', '/admin/((?!login).*)'],
}
