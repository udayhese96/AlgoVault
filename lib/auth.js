import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
const SALT_ROUNDS = 12

// ── Password Hashing ──────────────────────────────────
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

// ── JWT Token Management ──────────────────────────────
export function generateToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

// ── Cookie Helpers ────────────────────────────────────
export function getAuthCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  }
}

// Extract token from request cookies
export function getTokenFromRequest(request) {
  const cookie = request.cookies.get('auth_token')
  return cookie?.value || null
}

// Get authenticated user from request
export async function getAuthUser(request) {
  const token = getTokenFromRequest(request)
  if (!token) return null
  
  const decoded = verifyToken(token)
  if (!decoded) return null
  
  return { userId: decoded.userId, email: decoded.email }
}
