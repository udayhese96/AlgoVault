import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase-admin'
import { generateOTP, hashOTP, sendOTPEmail } from '@/lib/otp'

export async function POST(request) {
  try {
    const { email, type } = await request.json()

    if (!email || !type) {
      return NextResponse.json({ error: 'Email and type are required' }, { status: 400 })
    }

    if (!['signup', 'reset'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // For reset: check user exists
    if (type === 'reset') {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', normalizedEmail)
        .single()

      if (!user) {
        // Don't reveal if email exists for security
        return NextResponse.json({ message: 'If an account exists, an OTP has been sent.' })
      }
    }

    // Rate limiting: max 3 OTP requests per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentOTPs } = await supabaseAdmin
      .from('otp_codes')
      .select('id')
      .eq('email', normalizedEmail)
      .eq('type', type)
      .gte('created_at', oneHourAgo)

    if (recentOTPs && recentOTPs.length >= 3) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
    }

    // Invalidate previous OTPs
    await supabaseAdmin
      .from('otp_codes')
      .delete()
      .eq('email', normalizedEmail)
      .eq('type', type)

    // Generate and store OTP
    const otp = generateOTP()
    const otpHash = hashOTP(otp)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { error: insertError } = await supabaseAdmin
      .from('otp_codes')
      .insert({
        email: normalizedEmail,
        otp_hash: otpHash,
        type,
        expires_at: expiresAt,
      })

    if (insertError) {
      console.error('OTP insert error:', insertError)
      return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 })
    }

    // Send OTP email
    await sendOTPEmail(normalizedEmail, otp, type)

    return NextResponse.json({ message: 'OTP sent successfully' })
  } catch (error) {
    console.error('OTP send error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
