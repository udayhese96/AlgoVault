'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleChange = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }
    setLoading(true)
    setError('')

    // Supabase doesn't require current password for updateUser when the session is active,
    // but we re-authenticate to verify the current password first
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      setError('Current password is incorrect')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })

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
            <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{background:'rgba(16,185,129,0.5)'}} />
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center text-3xl"
              style={{background:'linear-gradient(135deg, #10b981, #3b82f6)', boxShadow:'0 0 40px rgba(16,185,129,0.4)'}}>
              ✓
            </div>
          </div>
          <h2 className="text-3xl font-black mb-4 tracking-tight">Password Changed!</h2>
          <p style={{color:'var(--fg-muted)'}}>Redirecting you back to your dashboard...</p>
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
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full blur-3xl opacity-8"
          style={{background:'radial-gradient(circle, #3b82f6, #8b5cf6)'}} />
      </div>

      <div className="w-full max-w-md relative">
        <div className="glass p-10">
          <div className="mb-8">
            <Link href="/dashboard" className="text-sm font-semibold flex items-center gap-2 mb-8 transition-colors hover:text-primary"
              style={{color:'var(--fg-muted)'}}>
              ← Back to Dashboard
            </Link>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-6"
              style={{background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)'}}>
              🔒
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2">Change Password</h1>
            <p className="text-sm" style={{color:'var(--fg-muted)'}}>
              Update your account security credentials.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl text-sm font-medium"
              style={{background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.2)', color:'#f43f5e'}}>
              {error}
            </div>
          )}

          <form onSubmit={handleChange} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{color:'var(--fg-muted)'}}>Current Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="h-px" style={{background:'var(--glass-border)'}} />

            <div>
              <label className="block text-sm font-semibold mb-2" style={{color:'var(--fg-muted)'}}>New Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              {/* Strength bar */}
              {newPassword.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{
                        background: newPassword.length > i * 3
                          ? (newPassword.length < 6 ? '#f59e0b' : newPassword.length < 10 ? '#3b82f6' : '#10b981')
                          : 'var(--glass-border)'
                      }} />
                  ))}
                </div>
              )}
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
        </div>
      </div>
    </div>
  )
}
