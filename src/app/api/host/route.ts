import { NextRequest, NextResponse } from 'next/server'
import os from 'os'

/**
 * Returns the host IP or header of the incoming request.
 * Used by the kiosk QR code generator to produce scannable URLs
 * that work on the local network (not just localhost).
 */
export async function GET(request: NextRequest) {
  // If a public tunnel URL is configured, use it for QR codes (needed for HTTPS mic access on phones)
  const publicUrl = process.env.NEXT_PUBLIC_PUBLIC_URL?.replace(/\/$/, '')
  if (publicUrl) {
    const host = publicUrl.replace(/^https?:\/\//, '')
    return NextResponse.json({ host, origin: publicUrl })
  }

  let localIp = '127.0.0.1'
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIp = iface.address
      }
    }
  }

  const origin = `http://${localIp}:3000`
  return NextResponse.json({ host: `${localIp}:3000`, origin })
}
