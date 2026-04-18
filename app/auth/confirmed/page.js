'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ConfirmedContent() {
  const searchParams = useSearchParams()
  const isError = searchParams.get('error') === 'true'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 relative">
      {/* BG Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-15"
          style={{background: isError
            ? 'radial-gradient(circle, #f43f5e, #f97316)'
            : 'radial-gradient(circle, #10b981, #3b82f6)'}} />
      </div>

      <div className="w-full max-w-md relative">
        <div className="glass p-12 text-center">
          {isError ? (
            <>
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-8 shadow-xl"
                style={{background:'rgba(244,63,94,0.12)', border:'1px solid rgba(244,63,94,0.2)'}}>
                ❌
              </div>
              <h1 className="text-3xl font-black mb-4 tracking-tight">Confirmation Failed</h1>
              <p className="text-lg mb-10" style={{color:'var(--fg-muted)'}}>
                The confirmation link has expired or is invalid. Please request a new one.
              </p>
              <Link href="/auth/register" className="btn btn-primary w-full py-4 text-base">
                Back to Sign Up
              </Link>
            </>
          ) : (
            <>
              {/* Animated checkmark ring */}
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full animate-ping opacity-20"
                  style={{background:'rgba(16,185,129,0.5)'}} />
                <div className="relative w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-2xl"
                  style={{background:'linear-gradient(135deg, #10b981, #3b82f6)', boxShadow:'0 0 40px rgba(16,185,129,0.4)'}}>
                  ✓
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
                style={{background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', color:'#10b981'}}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Authentication Successful
              </div>

              <h1 className="text-4xl font-black mb-4 tracking-tight">You&apos;re in! 🎉</h1>
              <p className="text-lg mb-3" style={{color:'var(--fg-muted)'}}>
                Your email has been verified and your account is now active.
              </p>
              <p className="text-sm mb-10" style={{color:'var(--fg-subtle)'}}>
                Welcome to DSAPlatform — your personal DSA learning workspace is ready.
              </p>

              <Link href="/dashboard" className="btn btn-primary w-full py-5 text-base mb-4"
                style={{boxShadow:'0 8px 30px rgba(59,130,246,0.35)'}}>
                Enter Your Workspace →
              </Link>
              <Link href="/" className="btn btn-ghost w-full py-4 text-sm">
                Back to Home
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ConfirmedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <ConfirmedContent />
    </Suspense>
  )
}
