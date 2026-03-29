import { NextRequest, NextResponse } from 'next/server'

/**
 * Returns the host header of the incoming request.
 * Used by the kiosk QR code generator to produce scannable URLs
 * that work on the local network (not just localhost).
 */
export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000'
  const proto = request.headers.get('x-forwarded-proto') || 'http'
  return NextResponse.json({ host, proto, origin: `${proto}://${host}` })
}
