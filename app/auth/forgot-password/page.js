'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="glass p-12 text-center max-w-md w-full">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-8 shadow-xl"
            style={{background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)'}}>
            📬
          </div>
          <h2 className="text-3xl font-black mb-4 tracking-tight">Check your email</h2>
          <p className="mb-3" style={{color:'var(--fg-muted)'}}>
            We sent a password reset link to <strong style={{color:'var(--fg)'}}>{email}</strong>.
          </p>
          <p className="text-sm mb-10" style={{color:'var(--fg-subtle)'}}>
            The link expires in 1 hour. Check your spam folder if you don't see it.
          </p>
          <Link href="/auth/login" className="btn btn-primary w-full py-4">
            Back to Sign In
          </Link>
        </div>
      </div>
    )
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
            <Link href="/auth/login" className="text-sm font-semibold flex items-center gap-2 mb-8 transition-colors hover:text-primary"
              style={{color:'var(--fg-muted)'}}>
              ← Back to Sign In
            </Link>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-6"
              style={{background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)'}}>
              🔑
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2">Forgot password?</h1>
            <p className="text-sm" style={{color:'var(--fg-muted)'}}>
              No worries. Enter your email and we'll send a reset link.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl text-sm font-medium"
              style={{background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.2)', color:'#f43f5e'}}>
              {error}
            </div>
          )}

          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{color:'var(--fg-muted)'}}>Email address</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-4 text-base"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Sending reset link...
                </span>
              ) : 'Send Reset Link →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
