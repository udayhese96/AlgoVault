import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase-admin'
import { hashPassword } from '@/lib/auth'

export async function POST(request) {
  try {
    const { reset_token, password } = await request.json()

    if (!reset_token || !password) {
      return NextResponse.json({ error: 'Reset token and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Find the OTP record with this reset token
    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('reset_token', reset_token)
      .eq('verified', true)
      .eq('type', 'reset')
      .single()

    if (otpError || !otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    // Check reset token expiry
    if (new Date(otpRecord.reset_token_expires_at) < new Date()) {
      await supabaseAdmin.from('otp_codes').delete().eq('id', otpRecord.id)
      return NextResponse.json({ error: 'Reset link has expired. Please request a new OTP.' }, { status: 400 })
    }

    // Find the user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', otpRecord.email)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update password
    const passwordHash = await hashPassword(password)
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    }

    // Clean up — delete the OTP record (single-use)
    await supabaseAdmin
      .from('otp_codes')
      .delete()
      .eq('id', otpRecord.id)

    return NextResponse.json({ message: 'Password reset successfully' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
