'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthContext'

export default function Dashboard() {
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('#3b82f6')
  
  // Statistics State
  const [stats, setStats] = useState({ total: 0, easy: 0, medium: 0, hard: 0 })
  const [activityMap, setActivityMap] = useState({})
  const [streaks, setStreaks] = useState({ current: 0, longest: 0 })
  
  const scrollRef = useRef(null)
  const supabase = createClient()
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchFolders()
      fetchStats()
    }
  }, [user])

  useEffect(() => {
    // Scroll heatmap to the far right (most recent day) on load
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
    }
  }, [activityMap])

  const formatDate = (date) => {
    const d = new Date(date)
    let month = '' + (d.getMonth() + 1)
    let day = '' + d.getDate()
    const year = d.getFullYear()
    if (month.length < 2) month = '0' + month
    if (day.length < 2) day = '0' + day
    return [year, month, day].join('-')
  }

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from('questions')
      .select('created_at, difficulty')
      .eq('user_id', user.id)

    if (!error && data) {
      let easy = 0, medium = 0, hard = 0
      const activity = {}

      data.forEach(q => {
        if (q.difficulty === 'Easy') easy++
        else if (q.difficulty === 'Medium') medium++
        else if (q.difficulty === 'Hard') hard++

        if (q.created_at) {
          const dateStr = formatDate(q.created_at)
          activity[dateStr] = (activity[dateStr] || 0) + 1
        }
      })
      
      setStats({ total: data.length, easy, medium, hard })
      setActivityMap(activity)

      // Streak Calculation
      const activeDates = Object.keys(activity).sort()
      let longest = 0
      let current = 0
      
      if (activeDates.length > 0) {
        let tempStreak = 1
        longest = 1
        for (let i = 1; i < activeDates.length; i++) {
          const prev = new Date(activeDates[i-1])
          const curr = new Date(activeDates[i])
          const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24))
          
          if (diffDays === 1) {
             tempStreak++
             longest = Math.max(longest, tempStreak)
          } else if (diffDays > 1) {
             tempStreak = 1
          }
        }
        
        // Current streak
        const today = new Date()
        today.setHours(0,0,0,0)
        let streakCounter = 0
        let dateWalker = new Date(today)
        
        let dateStr = formatDate(dateWalker)
        if (activity[dateStr]) {
            streakCounter++
            dateWalker.setDate(dateWalker.getDate() - 1)
        } else {
            // Check yesterday
            dateWalker.setDate(dateWalker.getDate() - 1)
            dateStr = formatDate(dateWalker)
            if (activity[dateStr]) {
                streakCounter++
                dateWalker.setDate(dateWalker.getDate() - 1)
            }
        }
        
        while(streakCounter > 0) {
            dateStr = formatDate(dateWalker)
            if (activity[dateStr]) {
                streakCounter++
                dateWalker.setDate(dateWalker.getDate() - 1)
            } else {
                break
            }
        }
        current = streakCounter
      }
      setStreaks({ current, longest })
    }
  }

  const fetchFolders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('folders')
      .select(`*, questions:questions(count)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error) setFolders(data)
    setLoading(false)
  }

  const handleCreateFolder = async (e) => {
    e.preventDefault()
    if (!newFolderName.trim() || !user) return

    const { error } = await supabase
      .from('folders')
      .insert([{ name: newFolderName, color: newFolderColor, user_id: user.id }])

    if (!error) {
      setNewFolderName('')
      setShowModal(false)
      fetchFolders()
    }
  }

  const deleteFolder = async (id, e) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Are you sure? This will delete all questions inside this folder.')) {
      const { error } = await supabase.from('folders').delete().eq('id', id)
      if (!error) fetchFolders()
    }
  }

  // Generate LeetCode style heatmap (grouped by month with proper column gaps)
  const generateLeetCodeHeatmap = () => {
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const blocks = []
    
    let currentDate = new Date()
    currentDate.setHours(0,0,0,0)
    currentDate.setFullYear(currentDate.getFullYear() - 1)
    
    const today = new Date()
    today.setHours(0,0,0,0)

    let currentMonthBlock = null

    while (currentDate <= today) {
      const monthIdx = currentDate.getMonth()
      const dayOfWeek = currentDate.getDay() // 0 = Sun, 6 = Sat
      
      if (!currentMonthBlock || currentMonthBlock.monthIdx !== monthIdx) {
         if (currentMonthBlock) {
            // Push the last week if it has days
            if (currentMonthBlock.currentWeek.some(d => d !== null)) {
               currentMonthBlock.weeks.push(currentMonthBlock.currentWeek)
            }
            blocks.push(currentMonthBlock)
         }
         currentMonthBlock = {
            monthIdx: monthIdx,
            label: MONTHS[monthIdx],
            weeks: [],
            currentWeek: Array(7).fill(null)
         }
      }

      const dateStr = formatDate(currentDate)
      currentMonthBlock.currentWeek[dayOfWeek] = {
         date: dateStr,
         count: activityMap[dateStr] || 0
      }

      if (dayOfWeek === 6 || currentDate.getTime() === today.getTime()) {
         currentMonthBlock.weeks.push([...currentMonthBlock.currentWeek])
         currentMonthBlock.currentWeek = Array(7).fill(null)
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    if (currentMonthBlock) {
       if (currentMonthBlock.currentWeek.some(d => d !== null)) {
          currentMonthBlock.weeks.push(currentMonthBlock.currentWeek)
       }
       blocks.push(currentMonthBlock)
    }

    return blocks
  }

  // Calculate SVG stroke dash arrays for the Donut Chart
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const totalSolved = stats.total || 1 // prevent divide by zero
  const easyPct = stats.easy / totalSolved
  const mediumPct = stats.medium / totalSolved
  const hardPct = stats.hard / totalSolved

  // Exact lengths of each segment
  const easyDash = easyPct * circumference
  const mediumDash = mediumPct * circumference
  const hardDash = hardPct * circumference

  // Use a larger gap to account for rounded caps extending outward
  const gap = 12
  const easySegment = easyDash > gap ? easyDash - gap : 0
  const mediumSegment = mediumDash > gap ? mediumDash - gap : 0
  const hardSegment = hardDash > gap ? hardDash - gap : 0

  const easyOffset = 0
  const mediumOffset = -easyDash
  const hardOffset = -(easyDash + mediumDash)

  return (
    <div className="container py-10 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">Your Library</h1>
          <p className="text-muted text-lg max-w-xl">
            Everything you need to master your coding interviews, organized neatly.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary shadow-lg shadow-primary/20 shrink-0">
          <span className="text-xl">+</span> New Topic Vault
        </button>
      </div>

      {/* --- STATISTICS SECTION --- */}
      <div className="mb-14 flex flex-col xl:flex-row gap-6">
        
        {/* LEFT: LeetCode Donut Chart & Streaks */}
        <div className="flex flex-col md:flex-row gap-6 w-full xl:w-auto">
           {/* Donut Chart Card */}
           <div className="glass p-8 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-8 flex-1">
              {/* The Donut */}
              <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                  {/* Background Track */}
                  <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-black/5 dark:text-white/5" />
                  
                  {/* Rings */}
                  {stats.easy > 0 && (
                     <circle cx="80" cy="80" r={radius} stroke="#10b981" strokeWidth="8" fill="transparent"
                       strokeDasharray={`${easySegment} ${circumference}`} strokeDashoffset={easyOffset} className="transition-all duration-1000" strokeLinecap="round" />
                  )}
                  {stats.medium > 0 && (
                     <circle cx="80" cy="80" r={radius} stroke="#f97316" strokeWidth="8" fill="transparent"
                       strokeDasharray={`${mediumSegment} ${circumference}`} strokeDashoffset={mediumOffset} className="transition-all duration-1000" strokeLinecap="round" />
                  )}
                  {stats.hard > 0 && (
                     <circle cx="80" cy="80" r={radius} stroke="#f43f5e" strokeWidth="8" fill="transparent"
                       strokeDasharray={`${hardSegment} ${circumference}`} strokeDashoffset={hardOffset} className="transition-all duration-1000" strokeLinecap="round" />
                  )}
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-black">{stats.total}</span>
                  <span className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Solved</span>
                </div>
              </div>

              {/* The Stats Breakdown */}
              <div className="flex flex-col gap-3 w-full sm:w-40 shrink-0">
                 <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-emerald-500 font-bold text-sm">Easy</span>
                    <span className="text-lg font-black">{stats.easy}</span>
                 </div>
                 <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-orange-500 font-bold text-sm">Med.</span>
                    <span className="text-lg font-black">{stats.medium}</span>
                 </div>
                 <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-rose-500 font-bold text-sm">Hard</span>
                    <span className="text-lg font-black">{stats.hard}</span>
                 </div>
              </div>
           </div>

           {/* Streaks */}
           <div className="flex flex-row md:flex-col gap-4 shrink-0">
             <div className="flex-1 glass rounded-2xl p-5 flex flex-col justify-center items-center text-center">
                <span className="text-2xl mb-1">🔥</span>
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Current</span>
                <span className="text-2xl font-black">{streaks.current} <span className="text-xs font-bold text-muted">Days</span></span>
             </div>
             <div className="flex-1 glass rounded-2xl p-5 flex flex-col justify-center items-center text-center">
                <span className="text-2xl mb-1">👑</span>
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Longest</span>
                <span className="text-2xl font-black">{streaks.longest} <span className="text-xs font-bold text-muted">Days</span></span>
             </div>
           </div>
        </div>

        {/* RIGHT: Heatmap */}
        <div className="glass p-6 rounded-2xl flex-1 flex flex-col overflow-hidden min-w-0">
           <div className="text-sm font-bold text-muted uppercase tracking-widest mb-4 flex justify-between shrink-0">
             <span>Activity Graph</span>
             <span className="text-xs normal-case font-medium">Last 365 Days</span>
           </div>
           
           <div className="w-full overflow-x-auto pb-4 flex-1" ref={scrollRef}>
              <div className="flex gap-4 relative min-w-max">
                {generateLeetCodeHeatmap().map((block, bIdx) => (
                   <div key={bIdx} className="flex flex-col gap-2">
                      {/* Month Grid */}
                      <div className="flex gap-1">
                         {block.weeks.map((week, wIdx) => (
                            <div key={wIdx} className="flex flex-col gap-1">
                               {week.map((day, dIdx) => {
                                  if (!day) {
                                     return <div key={`empty-${dIdx}`} className="w-[13px] h-[13px]" /> // Invisible placeholder for accurate day alignment
                                  }

                                  let intensityClass = 'bg-[#ebedf0] dark:bg-[#161b22]' // High contrast empty square
                                  if (day.count === 1) intensityClass = 'bg-[#9be9a8] dark:bg-[#0e4429]'
                                  else if (day.count === 2) intensityClass = 'bg-[#40c463] dark:bg-[#006d32]'
                                  else if (day.count === 3) intensityClass = 'bg-[#30a14e] dark:bg-[#26a641]'
                                  else if (day.count >= 4) intensityClass = 'bg-[#216e39] dark:bg-[#39d353]'

                                  return (
                                    <div key={day.date} className={`w-[13px] h-[13px] rounded-[2px] ${intensityClass}`} title={`${day.count} submissions on ${day.date}`} />
                                  )
                               })}
                            </div>
                         ))}
                      </div>
                      
                      {/* Month Label (Below grid like LeetCode) */}
                      <span className="text-[11px] text-muted font-medium mt-1">{block.label}</span>
                   </div>
                ))}
              </div>
           </div>
           
           <div className="flex justify-end items-center gap-1.5 mt-2 text-[10px] text-muted shrink-0">
              <span>Less</span>
              <div className="w-[11px] h-[11px] rounded-[2px] bg-[#ebedf0] dark:bg-[#161b22]"></div>
              <div className="w-[11px] h-[11px] rounded-[2px] bg-[#9be9a8] dark:bg-[#0e4429]"></div>
              <div className="w-[11px] h-[11px] rounded-[2px] bg-[#40c463] dark:bg-[#006d32]"></div>
              <div className="w-[11px] h-[11px] rounded-[2px] bg-[#30a14e] dark:bg-[#26a641]"></div>
              <div className="w-[11px] h-[11px] rounded-[2px] bg-[#216e39] dark:bg-[#39d353]"></div>
              <span>More</span>
           </div>
        </div>

      </div>

      <h2 className="text-2xl font-bold mb-6 tracking-tight">Your Vaults</h2>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[1,2,3,4].map(i => (<div key={i} className="glass h-52 animate-pulse" />))}
        </div>
      ) : folders.length === 0 ? (
        <div className="glass p-16 text-center flex flex-col items-center max-w-3xl mx-auto border-dashed border-2">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-4xl mb-6">📂</div>
          <h2 className="text-3xl font-bold mb-4">No Vaults Found</h2>
          <p className="text-muted text-lg mb-10 max-w-md">Start by creating your first folder like "Arrays" or "Recursion". You can customize each with unique colors.</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary px-8">Create My First Vault</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {folders.map(folder => (
            <Link key={folder.id} href={`/folders/${folder.id}`}
              className="glass p-8 group glass-hover relative overflow-hidden"
              style={{ borderTop: `6px solid ${folder.color}` }}>
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${folder.color}15`, color: folder.color }}>📁</div>
                <button onClick={(e) => deleteFolder(folder.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-muted hover:text-red-500 transition-all"
                  aria-label="Delete Folder">✕</button>
              </div>
              <h3 className="text-2xl font-bold mb-2 truncate group-hover:text-primary transition-colors">{folder.name}</h3>
              <div className="flex items-center gap-2 text-muted font-medium">
                <span className="text-sm">{folder.questions?.[0]?.count || 0} Questions</span>
                <span className="w-1 h-1 rounded-full bg-glass-border" />
                <span className="text-xs uppercase tracking-widest group-hover:text-primary transition-colors">View Library →</span>
              </div>
              <div className="absolute -right-10 -bottom-10 w-24 h-24 blur-[60px] opacity-20 transition-opacity group-hover:opacity-40"
                style={{ backgroundColor: folder.color }} />
            </Link>
          ))}
        </div>
      )}

      {/* Create Folder Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="glass p-10 w-full max-w-lg relative z-10 animate-in fade-in zoom-in duration-200">
            <h2 className="text-3xl font-bold mb-8 tracking-tight">Create Topic Vault</h2>
            <form onSubmit={handleCreateFolder} className="space-y-8">
              <div>
                <label className="block text-sm font-semibold mb-3 text-muted">Vault Name</label>
                <input type="text" className="input-field" placeholder="e.g. Dynamic Programming"
                  value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} autoFocus required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-4 text-muted">Accent Identity</label>
                <div className="flex flex-wrap gap-4">
                  {['#3b82f6', '#ec4899', '#f43f5e', '#10b981', '#fb8c00', '#8b5cf6'].map(color => (
                    <button key={color} type="button"
                      className={`w-10 h-10 rounded-2xl border-4 transition-all shadow-md ${newFolderColor === color ? 'scale-125 border-white ring-4 ring-primary/20' : 'border-transparent hover:scale-110'}`}
                      style={{ backgroundColor: color }} onClick={() => setNewFolderColor(color)} />
                  ))}
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost flex-1 py-4">Cancel</button>
                <button type="submit" className="btn btn-primary flex-1 py-4 text-lg">Launch Vault</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
