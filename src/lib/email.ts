import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendDoctorWelcomeEmail({
  toEmail,
  doctorName,
  username,
  password,
}: {
  toEmail: string
  doctorName: string
  username: string
  password: string
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('[Email] SMTP not configured — would have sent welcome to:', toEmail)
    return { success: false, reason: 'SMTP not configured' }
  }

  const hospitalName = process.env.NEXT_PUBLIC_HOSPITAL_NAME || 'Mutare Provincial Hospital'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f7fb; margin: 0; padding: 20px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #003d73 0%, #0066cc 100%); padding: 36px 32px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 0.5px; }
    .header p { color: rgba(255,255,255,0.75); margin: 6px 0 0; font-size: 13px; }
    .body { padding: 32px; }
    .greeting { font-size: 18px; font-weight: bold; color: #1a202c; margin-bottom: 12px; }
    .text { color: #4a5568; line-height: 1.6; margin-bottom: 20px; font-size: 14px; }
    .cred-box { background: #f0f7ff; border: 1px solid #bee3f8; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .cred-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .cred-row:last-child { margin-bottom: 0; }
    .cred-label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #3182ce; letter-spacing: 0.8px; }
    .cred-value { font-family: monospace; font-size: 14px; font-weight: bold; color: #1a202c; background: #ffffff; padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .steps { background: #f7fafc; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .step { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
    .step:last-child { margin-bottom: 0; }
    .step-num { width: 24px; height: 24px; background: #003d73; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; flex-shrink: 0; }
    .step-text { color: #4a5568; font-size: 13px; line-height: 1.5; }
    .warning { background: #fffbeb; border: 1px solid #f6e05e; border-radius: 10px; padding: 14px 16px; margin: 20px 0; font-size: 13px; color: #744210; }
    .footer { padding: 20px 32px; background: #f7fafc; border-top: 1px solid #e2e8f0; text-align: center; }
    .footer p { font-size: 11px; color: #a0aec0; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 ${hospitalName}</h1>
      <p>AURA Staff Portal — Welcome Onboard</p>
    </div>
    <div class="body">
      <p class="greeting">Welcome, ${doctorName}!</p>
      <p class="text">
        Your staff account has been created on the AURA Hospital Management System at
        <strong>${hospitalName}</strong>. You can now access your doctor portal to manage appointments,
        view your queue, and update your profile.
      </p>

      <div class="cred-box">
        <div class="cred-row">
          <span class="cred-label">Login Username (Email)</span>
          <span class="cred-value">${username}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Temporary Password</span>
          <span class="cred-value">${password}</span>
        </div>
      </div>

      <p class="text"><strong>Your password is your National ID number</strong> in lowercase with no spaces.</p>

      <div class="steps">
        <p style="font-weight:bold;color:#1a202c;margin:0 0 12px;font-size:13px;">Getting Started</p>
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-text">Navigate to the AURA Doctor Portal login page</div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-text">Sign in using the email and password above</div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-text">Complete your onboarding: upload a profile photo and set your office location</div>
        </div>
        <div class="step">
          <div class="step-num">4</div>
          <div class="step-text">Change your password to something secure via Settings</div>
        </div>
      </div>

      <div class="warning">
        ⚠️ <strong>Security Notice:</strong> Please change your password immediately after your first login.
        Do not share your credentials with anyone. If you suspect unauthorised access, contact the system administrator.
      </div>

      <p class="text">
        If you have any questions or need assistance with the system, please contact the hospital IT administration.
      </p>
      <p class="text">Welcome to the team!<br><strong>AURA System Administrator</strong><br>${hospitalName}</p>
    </div>
    <div class="footer">
      <p>This is an automated message from AURA — ${hospitalName} · Do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`

  try {
    await transporter.sendMail({
      from: `"AURA - ${hospitalName}" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `Welcome to ${hospitalName} — Your AURA Staff Account`,
      html,
    })
    return { success: true }
  } catch (err) {
    console.error('[Email] Failed to send welcome email:', err)
    return { success: false, reason: String(err) }
  }
}
