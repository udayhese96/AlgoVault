'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { useTheme } from '@/components/ThemeContext'

export default function Navbar() {
  const supabase = createClient()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [user, setUser] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)

    // Close dropdown on outside click
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setDropdownOpen(false)
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300"
      style={{
        background: scrolled ? 'var(--nav-bg)' : 'transparent',
        backdropFilter: scrolled ? 'blur(32px) saturate(180%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(32px) saturate(180%)' : 'none',
        borderBottom: scrolled ? '1px solid var(--glass-border)' : '1px solid transparent',
      }}
    >
      <nav className="container h-16 flex justify-between items-center gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <img
            src="/logo.png"
            alt="AlgoVault Logo"
            className="w-8 h-8 rounded-xl shadow-lg group-hover:scale-110 transition-transform object-cover"
          />
          <span className="font-extrabold text-lg tracking-tight gradient-text hidden sm:block">AlgoVault</span>
        </Link>

        {/* Center Nav (logged in) */}
        {user && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-2xl border"
            style={{background:'var(--glass-bg)', borderColor:'var(--glass-border)'}}>
            <Link href="/dashboard"
              className="px-4 py-1.5 rounded-xl text-sm font-semibold transition-all hover:text-primary"
              style={{color:'var(--fg-muted)'}}>
              Dashboard
            </Link>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all hover:scale-110 active:scale-95"
            style={{background:'var(--glass-bg)', borderColor:'var(--glass-border)'}}>
            <span className="text-base select-none">{theme === 'dark' ? '☀️' : '🌙'}</span>
          </button>

          <div className="w-px h-5 shrink-0" style={{background:'var(--glass-border)'}} />

          {user ? (
            <div className="relative" ref={dropdownRef}>
              {/* User Avatar Button */}
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-2xl border transition-all hover:border-primary"
                style={{background:'var(--glass-bg)', borderColor:'var(--glass-border)'}}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                  style={{background:'linear-gradient(135deg, #3b82f6, #8b5cf6)'}}>
                  {user.email?.[0]?.toUpperCase()}
                </div>
                <span className="text-xs font-semibold hidden sm:block max-w-[100px] truncate" style={{color:'var(--fg-muted)'}}>
                  {user.email?.split('@')[0]}
                </span>
                <span className="text-xs" style={{color:'var(--fg-subtle)'}}>▾</span>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border overflow-hidden shadow-2xl z-50"
                  style={{background:'var(--bg-surface)', borderColor:'var(--glass-border)', boxShadow:'var(--shadow-float)'}}>
                  
                  {/* User info header */}
                  <div className="px-4 py-3 border-b" style={{borderColor:'var(--glass-border)'}}>
                    <p className="text-xs font-bold" style={{color:'var(--fg-muted)'}}>Signed in as</p>
                    <p className="text-sm font-semibold truncate">{user.email}</p>
                  </div>

                  <div className="p-2 space-y-0.5">
                    <Link href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:text-primary"
                      style={{color:'var(--fg-muted)'}}>
                      <span>📊</span> Dashboard
                    </Link>

                    <Link href="/auth/change-password"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:text-primary"
                      style={{color:'var(--fg-muted)'}}>
                      <span>🔒</span> Change Password
                    </Link>

                    <div className="h-px my-1" style={{background:'var(--glass-border)'}} />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-red-500/10"
                      style={{color:'#f43f5e'}}>
                      <span>🚪</span> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login"
                className="hidden sm:block text-sm font-semibold px-4 py-2 rounded-xl transition-colors hover:text-primary"
                style={{color:'var(--fg-muted)'}}>
                Sign In
              </Link>
              <Link href="/auth/register" className="btn btn-primary !py-2 !px-5 text-sm">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
