'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { useTheme } from '@/components/ThemeContext'
import { useAuth } from '@/components/AuthContext'
import { createClient } from '@/lib/supabase'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const isDashboard = pathname === '/dashboard'
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  
  // Streak tracking state
  const [streakInfo, setStreakInfo] = useState({ currentStreak: 0, solvedToday: false })
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState({ folders: [], questions: [] })
  const [isSearching, setIsSearching] = useState(false)
  const searchInputRef = useRef(null)

  const supabase = createClient()

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only allow cmd+k if we are on dashboard where search is visible
      if (isDashboard && (e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!searchQuery.trim() || !user) {
      setSearchResults({ folders: [], questions: [] })
      return
    }

    const fetchSearchResults = async () => {
      setIsSearching(true)
      const [{ data: folders }, { data: questions }] = await Promise.all([
        supabase.from('folders').select('id, name, color').ilike('name', `%${searchQuery}%`).eq('user_id', user.id).limit(3),
        supabase.from('questions').select('id, title, difficulty, folder_id').ilike('title', `%${searchQuery}%`).eq('user_id', user.id).limit(5)
      ])
      
      setSearchResults({
        folders: folders || [],
        questions: questions || []
      })
      setIsSearching(false)
    }

    const debounce = setTimeout(fetchSearchResults, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery, user])

  useEffect(() => {
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
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Date formatting helper for streaks
  const formatDate = (date) => {
    const d = new Date(date)
    let month = '' + (d.getMonth() + 1)
    let day = '' + d.getDate()
    const year = d.getFullYear()
    if (month.length < 2) month = '0' + month
    if (day.length < 2) day = '0' + day
    return [year, month, day].join('-')
  }

  // Fetch streak logic
  useEffect(() => {
    if (user) {
      const fetchStreak = async () => {
        const { data, error } = await supabase
          .from('questions')
          .select('created_at')
          .eq('user_id', user.id)

        if (!error && data) {
          const activity = {}
          data.forEach(q => {
            if (q.created_at) {
              const dateStr = formatDate(q.created_at)
              activity[dateStr] = true
            }
          })
          
          let currentStreak = 0
          let solvedToday = false
          
          const today = new Date()
          today.setHours(0,0,0,0)
          let dateWalker = new Date(today)
          
          let dateStr = formatDate(dateWalker)
          if (activity[dateStr]) {
              solvedToday = true
              currentStreak++
              dateWalker.setDate(dateWalker.getDate() - 1)
          } else {
              // Check yesterday if today is not solved
              dateWalker.setDate(dateWalker.getDate() - 1)
              dateStr = formatDate(dateWalker)
              if (activity[dateStr]) {
                  currentStreak++
                  dateWalker.setDate(dateWalker.getDate() - 1)
              }
          }
          
          while(currentStreak > 0) {
              dateStr = formatDate(dateWalker)
              if (activity[dateStr]) {
                  currentStreak++
                  dateWalker.setDate(dateWalker.getDate() - 1)
              } else {
                  break
              }
          }
          
          setStreakInfo({ currentStreak, solvedToday })
        }
      }
      fetchStreak()
    }
  }, [user])

  const handleLogout = async () => {
    await logout()
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

        {/* Left Section: Logo, Links, Search */}
        <div className="flex items-center gap-4 sm:gap-6 flex-1">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <img
              src="/logo.png"
              alt="AlgoVault Logo"
              className="w-auto h-8 sm:h-10 rounded-xl shadow-lg group-hover:scale-105 transition-transform object-contain"
            />
            <span className="font-extrabold text-lg tracking-tight gradient-text hidden sm:block">AlgoVault</span>
          </Link>

          {/* Logged-in Links & Search */}
          {user && (
            <div className="flex items-center gap-3">
              
              {/* Search Bar Removed from Left */}

              <div className="flex items-center gap-1 px-2 py-1 rounded-2xl border hidden md:flex"
                style={{background:'var(--glass-bg)', borderColor:'var(--glass-border)'}}>
                <Link href="/dashboard"
                  className="px-4 py-1.5 rounded-xl text-sm font-semibold transition-all hover:text-primary"
                  style={{color:'var(--fg-muted)'}}>
                  Dashboard
                </Link>
              </div>

            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 ml-auto">
          
          {/* Search Bar (Right Aligned, Dashboard Only) */}
          {user && isDashboard && (
            <div className="relative hidden md:block group mr-2">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 opacity-50 group-hover:text-primary transition-colors" style={{ color: 'var(--fg-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                ref={searchInputRef}
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vault..." 
                className="block w-48 pl-9 pr-3 py-1.5 border rounded-2xl text-sm transition-all focus:w-64 outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)', color: 'var(--fg)' }}
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors opacity-60" style={{ borderColor: 'var(--glass-border)', background: 'var(--bg-surface)', color: 'var(--fg-muted)' }}>⌘K</span>
              </div>
              
              {/* Search Dropdown Results */}
              {searchQuery.trim().length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border overflow-hidden shadow-2xl z-[200] animate-in fade-in slide-in-from-top-2"
                  style={{background:'var(--bg-surface)', borderColor:'var(--glass-border)', boxShadow:'var(--shadow-float)'}}>
                  {isSearching ? (
                    <div className="p-4 text-center text-sm text-muted">Searching...</div>
                  ) : searchResults.folders.length === 0 && searchResults.questions.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted">No results found for "{searchQuery}"</div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto p-2">
                      {searchResults.folders.length > 0 && (
                        <div className="mb-3">
                          <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted">Vaults</div>
                          {searchResults.folders.map(f => (
                            <Link key={f.id} href={`/folders/${f.id}`} onClick={() => setSearchQuery('')}
                              className="flex items-center gap-3 px-2 py-2 rounded-xl text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                              <span style={{ color: f.color }}>📁</span> <span className="truncate">{f.name}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                      {searchResults.questions.length > 0 && (
                        <div>
                          <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted">Questions</div>
                          {searchResults.questions.map(q => (
                            <Link key={q.id} href={`/folders/${q.folder_id}`} onClick={() => setSearchQuery('')}
                              className="flex flex-col gap-1 px-2 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                              <span className="text-sm font-medium truncate">{q.title}</span>
                              <span className={`text-[10px] font-bold uppercase w-max px-1.5 rounded ${q.difficulty === 'Easy' ? 'text-emerald-500 bg-emerald-500/10' : q.difficulty === 'Medium' ? 'text-orange-500 bg-orange-500/10' : 'text-rose-500 bg-rose-500/10'}`}>{q.difficulty}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Streak Indicator (LeetCode Style) */}
          {user && (
            <div 
              className="flex items-center gap-1.5 font-bold px-2 py-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              title={streakInfo.solvedToday ? "Today's problem solved!" : "Solve a problem today to keep your streak!"}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill={streakInfo.solvedToday ? "currentColor" : "none"} 
                stroke="currentColor" 
                strokeWidth={streakInfo.solvedToday ? "0" : "2"} 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={`w-5 h-5 ${streakInfo.solvedToday ? 'text-orange-500 drop-shadow-md' : 'text-gray-400 dark:text-gray-500'}`}
              >
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
              </svg>
              <span className={`text-[15px] leading-none ${streakInfo.solvedToday ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}>
                {streakInfo.currentStreak}
              </span>
            </div>
          )}

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
                className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                style={{ color: 'var(--fg-subtle)' }}
                aria-label="User Menu"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
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
