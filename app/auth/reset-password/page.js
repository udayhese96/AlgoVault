'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleReset = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 2500)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="glass p-12 text-center max-w-md w-full">
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{background:'rgba(16,185,129,0.5)'}} />
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center text-3xl"
              style={{background:'linear-gradient(135deg, #10b981, #3b82f6)', boxShadow:'0 0 40px rgba(16,185,129,0.4)'}}>
              ✓
            </div>
          </div>
          <h2 className="text-3xl font-black mb-4 tracking-tight">Password Updated!</h2>
          <p style={{color:'var(--fg-muted)'}}>
            Your password has been changed successfully. Redirecting you to your dashboard...
          </p>
          <div className="mt-6 h-1 rounded-full overflow-hidden" style={{background:'var(--glass-border)'}}>
            <div className="h-full rounded-full bg-primary" style={{animation:'grow 2.5s linear forwards', width:'0%'}} />
          </div>
          <style>{`@keyframes grow { to { width: 100%; } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full blur-3xl opacity-10"
          style={{background:'radial-gradient(circle, #8b5cf6, #3b82f6)'}} />
      </div>

      <div className="w-full max-w-md relative">
        <div className="glass p-10">
          <div className="mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-6"
              style={{background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.2)'}}>
              🔐
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2">Set new password</h1>
            <p className="text-sm" style={{color:'var(--fg-muted)'}}>
              Choose a strong password for your account.
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
              <label className="block text-sm font-semibold mb-2" style={{color:'var(--fg-muted)'}}>New Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{color:'var(--fg-muted)'}}>Confirm New Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              {/* Password strength hint */}
              {password.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-all"
                      style={{
                        background: password.length > i * 3
                          ? (password.length < 6 ? '#f59e0b' : password.length < 10 ? '#3b82f6' : '#10b981')
                          : 'var(--glass-border)'
                      }} />
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-4 text-base mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Updating password...
                </span>
              ) : 'Update Password →'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{color:'var(--fg-muted)'}}>
            Remember it?{' '}
            <Link href="/auth/login" className="font-bold hover:text-primary transition-colors" style={{color:'var(--primary)'}}>
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
