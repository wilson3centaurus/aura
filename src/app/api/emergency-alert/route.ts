import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  const { symptoms, severity, department } = await request.json()

  const alertTime = new Date().toISOString()
  const hospitalName = process.env.NEXT_PUBLIC_HOSPITAL_NAME || 'Mutare Provincial Hospital'

  // Fetch all available doctors' emails to notify them
  const { data: availableDoctors } = await supabase
    .from('doctors')
    .select('user:users!doctors_user_id_fkey(email, name)')
    .eq('status', 'AVAILABLE')
    .limit(10)

  const adminEmails = process.env.EMERGENCY_ALERT_EMAILS?.split(',').map(e => e.trim()).filter(Boolean) || []

  const allEmails = [
    ...adminEmails,
    ...(availableDoctors?.map((d: Record<string, unknown>) => {
      const user = d.user as Record<string, unknown> | null
      return user?.email ? String(user.email) : ''
    }).filter(Boolean) ?? []),
  ]

  const emailSent = allEmails.length > 0 && process.env.SMTP_USER && process.env.SMTP_PASS

  if (emailSent) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })

      await transporter.sendMail({
        from: `"AURA Emergency System" <${process.env.SMTP_USER}>`,
        to: allEmails.join(', '),
        subject: `🚨 EMERGENCY ALERT — Patient Needs Immediate Help — ${hospitalName}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
            <div style="background:#dc2626;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
              <h1 style="color:white;margin:0;font-size:24px;">🚨 EMERGENCY ALERT</h1>
              <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">${hospitalName} — AURA Kiosk</p>
            </div>
            <div style="background:#fff;padding:24px;border:1px solid #fee2e2;border-top:none;border-radius:0 0 12px 12px;">
              <p style="font-size:16px;font-weight:bold;color:#dc2626;">⚠️ A patient at the kiosk has been flagged as EMERGENCY and requires immediate assistance.</p>
              <table style="width:100%;border-collapse:collapse;margin-top:16px;">
                <tr><td style="padding:8px;background:#fef2f2;font-size:12px;font-weight:bold;text-transform:uppercase;color:#dc2626;">Time</td><td style="padding:8px;font-size:13px;">${new Date(alertTime).toLocaleString()}</td></tr>
                <tr><td style="padding:8px;background:#fef2f2;font-size:12px;font-weight:bold;text-transform:uppercase;color:#dc2626;">Symptoms</td><td style="padding:8px;font-size:13px;">${symptoms || 'Not specified'}</td></tr>
                <tr><td style="padding:8px;background:#fef2f2;font-size:12px;font-weight:bold;text-transform:uppercase;color:#dc2626;">Severity</td><td style="padding:8px;font-size:13px;">${severity || 'N/A'}/10</td></tr>
                <tr><td style="padding:8px;background:#fef2f2;font-size:12px;font-weight:bold;text-transform:uppercase;color:#dc2626;">Dept</td><td style="padding:8px;font-size:13px;">${department || 'Emergency'}</td></tr>
              </table>
              <p style="margin-top:20px;font-size:13px;color:#7f1d1d;">Please proceed to the AURA kiosk at the hospital entrance immediately.</p>
            </div>
          </div>
        `,
      })
    } catch (err) {
      console.error('[EmergencyAlert] Email failed:', err)
    }
  }

  console.log(`[EmergencyAlert] ${alertTime} — severity: ${severity}, symptoms: ${symptoms}, dept: ${department}`)

  return NextResponse.json({ success: true, notified: allEmails.length })
}
