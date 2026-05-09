import crypto from 'crypto'
import nodemailer from 'nodemailer'

// ── OTP Generation ────────────────────────────────────
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const OTP_LENGTH = 6

export function generateOTP() {
  let otp = ''
  const bytes = crypto.randomBytes(OTP_LENGTH)
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += CHARSET[bytes[i] % CHARSET.length]
  }
  return otp
}

// ── Hashing ───────────────────────────────────────────
export function hashOTP(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex')
}

// ── Reset Token ───────────────────────────────────────
export function generateResetToken() {
  return crypto.randomBytes(32).toString('hex')
}

// ── SMTP Transporter ──────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false, // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

// ── Send OTP Email ────────────────────────────────────
export async function sendOTPEmail(email, otp, type = 'signup') {
  const transporter = createTransporter()

  const subject = type === 'signup'
    ? 'Verify your AlgoVault account'
    : 'Reset your AlgoVault password'

  const heading = type === 'signup'
    ? 'Verify Your Email'
    : 'Reset Your Password'

  const description = type === 'signup'
    ? 'Use the verification code below to complete your account setup.'
    : 'Use the code below to reset your password. If you didn\'t request this, ignore this email.'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#070810;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
      <div style="max-width:480px;margin:40px auto;padding:0 20px;">
        <!-- Header -->
        <div style="text-align:center;padding:32px 0 24px;">
          <h1 style="margin:0;font-size:24px;font-weight:800;color:#f1f5f9;letter-spacing:-0.5px;">
            ⚡ AlgoVault
          </h1>
        </div>

        <!-- Card -->
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:40px 32px;text-align:center;">
          
          <!-- Icon -->
          <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);margin:0 auto 24px;display:flex;align-items:center;justify-content:center;">
            <span style="font-size:28px;line-height:1;">${type === 'signup' ? '✉️' : '🔑'}</span>
          </div>

          <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#f1f5f9;letter-spacing:-0.3px;">
            ${heading}
          </h2>
          
          <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;line-height:1.6;">
            ${description}
          </p>

          <!-- OTP Code -->
          <div style="background:rgba(59,130,246,0.08);border:2px dashed rgba(59,130,246,0.3);border-radius:16px;padding:20px;margin:0 0 28px;">
            <div style="font-size:36px;font-weight:900;letter-spacing:12px;color:#3b82f6;font-family:'Courier New',monospace;">
              ${otp}
            </div>
          </div>

          <p style="margin:0 0 6px;font-size:12px;color:#64748b;">
            This code expires in <strong style="color:#f59e0b;">10 minutes</strong>
          </p>
          <p style="margin:0;font-size:12px;color:#475569;">
            Do not share this code with anyone.
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align:center;padding:24px 0;font-size:11px;color:#475569;">
          <p style="margin:0;">This email was sent by AlgoVault</p>
          <p style="margin:4px 0 0;color:#334155;">If you didn't request this, you can safely ignore it.</p>
        </div>
      </div>
    </body>
    </html>
  `

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject,
    html,
  })
}
