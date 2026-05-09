import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase-admin'
import { generateOTP, hashOTP, sendOTPEmail } from '@/lib/otp'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    // Rate limiting: max 3 OTP requests per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentOTPs } = await supabaseAdmin
      .from('otp_codes')
      .select('id')
      .eq('email', normalizedEmail)
      .eq('type', 'signup')
      .gte('created_at', oneHourAgo)

    if (recentOTPs && recentOTPs.length >= 3) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
    }

    // Invalidate any previous OTPs for this email
    await supabaseAdmin
      .from('otp_codes')
      .delete()
      .eq('email', normalizedEmail)
      .eq('type', 'signup')

    // Generate and store OTP
    const otp = generateOTP()
    const otpHash = hashOTP(otp)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes

    const { error: insertError } = await supabaseAdmin
      .from('otp_codes')
      .insert({
        email: normalizedEmail,
        otp_hash: otpHash,
        type: 'signup',
        expires_at: expiresAt,
      })

    if (insertError) {
      console.error('OTP insert error:', insertError)
      return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 })
    }

    // Send OTP email
    await sendOTPEmail(normalizedEmail, otp, 'signup')

    return NextResponse.json({ message: 'OTP sent successfully' })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
