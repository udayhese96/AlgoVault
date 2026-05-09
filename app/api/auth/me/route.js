import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import supabaseAdmin from '@/lib/supabase-admin'

export async function GET(request) {
  try {
    const authUser = await getAuthUser(request)
    
    if (!authUser) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    // Fetch fresh user data from DB
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, email_verified, last_login_at, created_at')
      .eq('id', authUser.userId)
      .single()

    if (error || !user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
