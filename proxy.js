import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function proxy(request) {
  const token = request.cookies.get('auth_token')?.value

  // Verify JWT if present
  let user = null
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET)
      const { payload } = await jwtVerify(token, secret)
      user = { userId: payload.userId, email: payload.email }
    } catch {
      // Invalid token — treat as not logged in
      user = null
    }
  }

  // Protect dashboard, folders, questions routes
  const protectedRoutes = ['/dashboard', '/folders', '/questions']
  const isProtected = protectedRoutes.some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Redirect auth pages if already logged in (except certain pages)
  const allowedAuthPaths = ['/auth/confirmed', '/auth/change-password', '/auth/verify-otp']
  const isAllowedAuthPath = allowedAuthPaths.some(p => request.nextUrl.pathname.startsWith(p))
  
  if (user && request.nextUrl.pathname.startsWith('/auth/') && !isAllowedAuthPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
