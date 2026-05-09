import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase-admin'
import { hashOTP, generateResetToken } from '@/lib/otp'

export async function POST(request) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Find the OTP record for reset type
    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('type', 'reset')
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpRecord) {
      return NextResponse.json({ error: 'No OTP found. Please request a new one.' }, { status: 400 })
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      await supabaseAdmin.from('otp_codes').delete().eq('id', otpRecord.id)
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 })
    }

    // Check max attempts
    if (otpRecord.attempts >= otpRecord.max_attempts) {
      await supabaseAdmin.from('otp_codes').delete().eq('id', otpRecord.id)
      return NextResponse.json({ error: 'Too many incorrect attempts. Please request a new OTP.' }, { status: 400 })
    }

    // Verify OTP
    const inputHash = hashOTP(otp.toUpperCase().trim())
    if (inputHash !== otpRecord.otp_hash) {
      await supabaseAdmin
        .from('otp_codes')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id)

      const remaining = otpRecord.max_attempts - otpRecord.attempts - 1
      return NextResponse.json({ 
        error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` 
      }, { status: 400 })
    }

    // OTP verified! Generate reset token
    const resetToken = generateResetToken()
    const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes

    await supabaseAdmin
      .from('otp_codes')
      .update({ 
        verified: true, 
        reset_token: resetToken,
        reset_token_expires_at: resetTokenExpiresAt,
      })
      .eq('id', otpRecord.id)

    return NextResponse.json({ 
      message: 'OTP verified successfully',
      reset_token: resetToken,
    })
  } catch (error) {
    console.error('OTP verify error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
