import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase-admin'
import { verifyPassword, generateToken, getAuthCookieOptions } from '@/lib/auth'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Find user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash, email_verified')
      .eq('email', normalizedEmail)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Check email verification
    if (!user.email_verified) {
      return NextResponse.json({ error: 'Please verify your email first' }, { status: 403 })
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Update last_login_at
    await supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)

    // Generate JWT and set cookie
    const token = generateToken(user.id, user.email)
    const response = NextResponse.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email }
    })

    const cookieOptions = getAuthCookieOptions()
    response.cookies.set('auth_token', token, cookieOptions)

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
