'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const handleRegister = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="glass p-12 text-center max-w-md w-full">
          <div className="text-5xl mb-6">📬</div>
          <h2 className="text-3xl font-black mb-4 tracking-tight">Check your inbox</h2>
          <p className="mb-8" style={{color:'var(--fg-muted)'}}>
            We sent a confirmation link to <strong style={{color:'var(--fg)'}}>{email}</strong>.
            Click it to activate your account.
          </p>
          <Link href="/auth/login" className="btn btn-primary w-full py-4">
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 relative">
      {/* BG Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-10"
          style={{background:'radial-gradient(circle, #8b5cf6, #3b82f6)'}} />
      </div>

      <div className="w-full max-w-md relative">
        <div className="glass p-10">
          <div className="flex flex-col items-center mb-8 gap-3">
            <img src="/logo.png" alt="AlgoVault" className="w-14 h-14 rounded-2xl shadow-xl object-cover" />
            <span className="font-extrabold text-xl tracking-tight gradient-text">AlgoVault</span>
          </div>

          <h1 className="text-3xl font-black text-center mb-2 tracking-tight">Create your vault</h1>
          <p className="text-center text-sm mb-10" style={{color:'var(--fg-muted)'}}>
            Free forever. No credit card required.
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl text-sm font-medium"
              style={{background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.2)', color:'#f43f5e'}}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{color:'var(--fg-muted)'}}>Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{color:'var(--fg-muted)'}}>Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{color:'var(--fg-muted)'}}>Confirm Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-4 text-base mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Free Account →'}
            </button>
          </form>

          <p className="text-center text-sm mt-8" style={{color:'var(--fg-muted)'}}>
            Already have an account?{' '}
            <Link href="/auth/login" className="font-bold hover:text-primary transition-colors" style={{color:'var(--primary)'}}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
