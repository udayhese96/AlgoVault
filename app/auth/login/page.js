'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 relative">
      {/* BG Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-10"
          style={{background:'radial-gradient(circle, #3b82f6, #8b5cf6)'}} />
      </div>

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="glass p-10">
          {/* Logo mark */}
          <div className="flex flex-col items-center mb-8 gap-3">
            <img src="/logo.png" alt="AlgoVault" className="w-14 h-14 rounded-2xl shadow-xl animate-glow object-cover" />
            <span className="font-extrabold text-xl tracking-tight gradient-text">AlgoVault</span>
          </div>

          <h1 className="text-3xl font-black text-center mb-2 tracking-tight">Welcome back</h1>
          <p className="text-center text-sm mb-10" style={{color:'var(--fg-muted)'}}>
            Sign in to your DSA workspace
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl text-sm font-medium"
              style={{background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.2)', color:'#f43f5e'}}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold" style={{color:'var(--fg-muted)'}}>Password</label>
                <Link href="/auth/forgot-password" className="text-xs font-semibold hover:text-primary transition-colors" style={{color:'var(--primary)'}}>
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  Signing in...
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          <p className="text-center text-sm mt-8" style={{color:'var(--fg-muted)'}}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="font-bold hover:text-primary transition-colors" style={{color:'var(--primary)'}}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
