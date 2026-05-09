'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthContext'

function VerifyOTPContent() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'signup' // 'signup' or 'reset'
  const router = useRouter()
  const { refreshUser } = useAuth()

  const [otp, setOtp] = useState(Array(6).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const inputRefs = useRef([])

  const email = typeof window !== 'undefined' ? sessionStorage.getItem('otp_email') : null

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Redirect if no email stored
  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('otp_email')) {
      router.push(type === 'signup' ? '/auth/register' : '/auth/forgot-password')
    }
  }, [router, type])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleChange = (index, value) => {
    // Only allow A-Z and 0-9
    const char = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!char && value !== '') return

    const newOtp = [...otp]
    newOtp[index] = char
    setOtp(newOtp)
    setError('')

    // Auto-focus next input
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 are filled
    if (char && index === 5 && newOtp.every(c => c !== '')) {
      handleVerify(newOtp.join(''))
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const newOtp = pasted.split('')
      setOtp(newOtp)
      inputRefs.current[5]?.focus()
      handleVerify(pasted)
    }
  }

  const handleVerify = async (code) => {
    if (!email) return
    setLoading(true)
    setError('')

    try {
      if (type === 'signup') {
        const password = sessionStorage.getItem('otp_password')
        const res = await fetch('/api/auth/verify-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp: code, password }),
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Verification failed')
          setOtp(Array(6).fill(''))
          inputRefs.current[0]?.focus()
          setLoading(false)
          return
        }

        // Clean up sessionStorage
        sessionStorage.removeItem('otp_email')
        sessionStorage.removeItem('otp_password')
        
        await refreshUser()
        router.push('/auth/confirmed')
      } else {
        // Reset flow
        const res = await fetch('/api/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp: code }),
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Verification failed')
          setOtp(Array(6).fill(''))
          inputRefs.current[0]?.focus()
          setLoading(false)
          return
        }

        sessionStorage.removeItem('otp_email')
        router.push(`/auth/reset-password?token=${data.reset_token}`)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return
    
    try {
      const endpoint = type === 'signup' ? '/api/auth/register' : '/api/otp/send'
      const body = type === 'signup' 
        ? { email, password: sessionStorage.getItem('otp_password') }
        : { email, type: 'reset' }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setResendCooldown(60)
        setTimeLeft(600)
        setOtp(Array(6).fill(''))
        setError('')
        inputRefs.current[0]?.focus()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to resend OTP')
      }
    } catch {
      setError('Failed to resend OTP')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full blur-3xl opacity-10"
          style={{background:'radial-gradient(circle, #3b82f6, #8b5cf6)'}} />
      </div>

      <div className="w-full max-w-md relative">
        <div className="glass p-10">
          <div className="mb-8">
            <Link href={type === 'signup' ? '/auth/register' : '/auth/forgot-password'}
              className="text-sm font-semibold flex items-center gap-2 mb-8 transition-colors hover:text-primary"
              style={{color:'var(--fg-muted)'}}>
              ← Back
            </Link>

            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto"
              style={{background:'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))', border:'1px solid rgba(59,130,246,0.2)'}}>
              🔐
            </div>

            <h1 className="text-3xl font-black tracking-tight mb-2 text-center">Enter verification code</h1>
            <p className="text-sm text-center" style={{color:'var(--fg-muted)'}}>
              We sent a 6-character code to <strong style={{color:'var(--fg)'}}>{email}</strong>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl text-sm font-medium"
              style={{background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.2)', color:'#f43f5e'}}>
              {error}
            </div>
          )}

          {/* OTP Input Boxes */}
          <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
            {otp.map((char, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                maxLength={1}
                value={char}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-xl font-black rounded-xl outline-none transition-all uppercase"
                style={{
                  background: char ? 'rgba(59,130,246,0.08)' : 'var(--input-bg)',
                  border: char ? '2px solid rgba(59,130,246,0.4)' : '1px solid var(--glass-border)',
                  color: 'var(--fg)',
                  caretColor: 'var(--primary)',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="text-center mb-6">
            {timeLeft > 0 ? (
              <p className="text-sm" style={{color:'var(--fg-muted)'}}>
                Code expires in{' '}
                <span className="font-bold" style={{color: timeLeft < 60 ? '#f43f5e' : '#f59e0b'}}>
                  {formatTime(timeLeft)}
                </span>
              </p>
            ) : (
              <p className="text-sm font-semibold" style={{color:'#f43f5e'}}>
                Code expired. Please request a new one.
              </p>
            )}
          </div>

          {/* Verify Button */}
          <button
            onClick={() => handleVerify(otp.join(''))}
            disabled={loading || otp.some(c => c === '') || timeLeft <= 0}
            className="btn btn-primary w-full py-4 text-base mb-4"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Verifying...
              </span>
            ) : 'Verify Code →'}
          </button>

          {/* Resend */}
          <div className="text-center">
            <p className="text-sm" style={{color:'var(--fg-muted)'}}>
              Didn&apos;t receive the code?{' '}
              {resendCooldown > 0 ? (
                <span className="font-semibold" style={{color:'var(--fg-subtle)'}}>
                  Resend in {resendCooldown}s
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  className="font-bold transition-colors hover:text-primary"
                  style={{color:'var(--primary)'}}>
                  Resend Code
                </button>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  )
}
