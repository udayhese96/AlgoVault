import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase-admin'
import { hashOTP } from '@/lib/otp'
import { hashPassword, generateToken, getAuthCookieOptions } from '@/lib/auth'

export async function POST(request) {
  try {
    const { email, otp, password } = await request.json()

    if (!email || !otp || !password) {
      return NextResponse.json({ error: 'Email, OTP, and password are required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Find the OTP record
    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('type', 'signup')
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

    // Verify OTP hash
    const inputHash = hashOTP(otp.toUpperCase().trim())
    if (inputHash !== otpRecord.otp_hash) {
      // Increment attempts
      await supabaseAdmin
        .from('otp_codes')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id)

      const remaining = otpRecord.max_attempts - otpRecord.attempts - 1
      return NextResponse.json({ 
        error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` 
      }, { status: 400 })
    }

    // OTP verified! Create user
    const passwordHash = await hashPassword(password)

    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        email: normalizedEmail,
        password_hash: passwordHash,
        email_verified: true,
        last_login_at: new Date().toISOString(),
      })
      .select('id, email')
      .single()

    if (userError) {
      // Check if user was created between OTP send and verify
      if (userError.code === '23505') {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
      }
      console.error('User creation error:', userError)
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }

    // Clean up OTP
    await supabaseAdmin
      .from('otp_codes')
      .delete()
      .eq('email', normalizedEmail)
      .eq('type', 'signup')

    // Generate JWT and set cookie
    const token = generateToken(newUser.id, newUser.email)
    const response = NextResponse.json({ 
      message: 'Account created successfully',
      user: { id: newUser.id, email: newUser.email }
    })

    const cookieOptions = getAuthCookieOptions()
    response.cookies.set('auth_token', token, cookieOptions)

    return response
  } catch (error) {
    console.error('Verify signup error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
