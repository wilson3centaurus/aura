import { NextRequest, NextResponse } from 'next/server'
import os from 'os'

/**
 * Returns the host IP or header of the incoming request.
 * Used by the kiosk QR code generator to produce scannable URLs
 * that work on the local network (not just localhost).
 */
export async function GET(request: NextRequest) {
  let localIp = '127.0.0.1'
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        // Preferred range or just the first valid one we find
        localIp = iface.address
      }
    }
  }

  // Use the local IP on port 3000
  const origin = `http://${localIp}:3000`

  return NextResponse.json({ host: `${localIp}:3000`, origin })
}
