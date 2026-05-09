'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useAuth } from '@/components/AuthContext'
import { useTheme } from '@/components/ThemeContext'

// Dynamically import Monaco to avoid SSR issues
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then(m => m.default),
  { ssr: false, loading: () => (
    <div className="flex-1 flex items-center justify-center" style={{background:'#1e1e1e'}}>
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )}
)

export default function QuestionDetail() {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const params = useParams()
  const questionId = params.id
  const { user } = useAuth()
  const { theme } = useTheme()

  const [question, setQuestion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeLang, setActiveLang] = useState('java')
  const [activeTab, setActiveTab] = useState('description') // 'description' | 'approach'
  const [outputExpanded, setOutputExpanded] = useState(true)

  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [approach, setApproach] = useState('')
  const [terminalOutput, setTerminalOutput] = useState('')

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [sidebarData, setSidebarData] = useState([])
  const [expandedFolders, setExpandedFolders] = useState({})

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (questionId) fetchQuestionData()
  }, [questionId])

  useEffect(() => {
    if (user) fetchSidebarData()
  }, [user])

  const fetchSidebarData = async () => {
    const { data, error } = await supabase
      .from('folders')
      .select('*, questions(id, title, difficulty)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      
    if (!error && data) {
      setSidebarData(data)
      const allExpanded = {}
      data.forEach(f => allExpanded[f.id] = true)
      setExpandedFolders(allExpanded)
    }
  }

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({...prev, [folderId]: !prev[folderId]}))
  }

  const fetchQuestionData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('questions')
      .select('*, folder:folders(name, id, color)')
      .eq('id', questionId)
      .single()

    if (error) { router.push('/dashboard'); return }

    setQuestion(data)
    const lang = data.last_language || 'java'
    setActiveLang(lang)
    setCode(lang === 'python' ? (data.code_python || '') : (data.code_java || ''))
    setDescription(data.description || '')
    setApproach(data.solving_approach || '')
    setTerminalOutput(data.terminal_output || '')
    setLoading(false)
  }

  const handleLanguageChange = (lang) => {
    if (activeLang === 'java') setQuestion(prev => ({ ...prev, code_java: code }))
    else setQuestion(prev => ({ ...prev, code_python: code }))
    setActiveLang(lang)
    setCode(lang === 'python' ? (question?.code_python || '') : (question?.code_java || ''))
  }

  const saveQuestion = async () => {
    setSaving(true)
    const updateData = {
      description,
      solving_approach: approach,
      terminal_output: terminalOutput,
      last_language: activeLang,
      updated_at: new Date().toISOString(),
    }
    if (activeLang === 'java') updateData.code_java = code
    else updateData.code_python = code

    const { error } = await supabase
      .from('questions')
      .update(updateData)
      .eq('id', questionId)

    setSaving(false)
    if (!error) {
      setQuestion(prev => ({ ...prev, ...updateData }))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center" style={{height:'calc(100vh - 64px)'}}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm" style={{color:'var(--fg-muted)'}}>Loading workspace...</span>
      </div>
    </div>
  )

  return (
    // Full viewport height minus 64px navbar
    <div className="flex flex-col" style={{height:'calc(100vh - 64px)', overflow:'hidden'}}>

      {/* ── TOP BAR (LeetCode style) ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{
          background:'var(--bg-surface)',
          borderColor:'var(--glass-border)',
          minHeight:'48px'
        }}>

        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-[var(--glass-bg)] rounded-md transition-colors text-[var(--fg-muted)] hover:text-[var(--fg)]" aria-label="Toggle Sidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs font-semibold"
            style={{color:'var(--fg-muted)'}}>
            <Link href="/dashboard" className="hover:text-primary transition-colors">Library</Link>
            <span style={{color:'var(--fg-subtle)'}}>/</span>
            <Link href={`/folders/${question.folder?.id}`} className="hover:text-primary transition-colors">
              {question.folder?.name}
            </Link>
            <span style={{color:'var(--fg-subtle)'}}>/</span>
            <span style={{color:'var(--fg)', fontWeight:700}}>{question.title}</span>
            <span className={`ml-2 badge ${question.difficulty}`}>{question.difficulty}</span>
          </nav>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <span className="text-xs hidden sm:block" style={{color:'var(--fg-subtle)'}}>
            Last saved: {new Date(question.updated_at).toLocaleTimeString()}
          </span>
          <button
            onClick={saveQuestion}
            disabled={saving}
            className="btn gap-2 text-sm px-5 py-2"
            style={saved
              ? {background:'rgba(16,185,129,0.12)', color:'#10b981', border:'1px solid rgba(16,185,129,0.25)'}
              : {background:'var(--primary)', color:'#fff', boxShadow:'0 4px 14px rgba(59,130,246,0.3)'}
            }
          >
            {saving
              ? <><div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Saving</>
              : saved
                ? <><span>✓</span> Saved!</>
                : <><span>💾</span> Save</>
            }
          </button>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="flex flex-1 min-h-0 relative p-2 gap-2" style={{ background: 'var(--bg)' }}>

        {/* ════════════════════════════════ */}
        {/* SIDEBAR (File Explorer)         */}
        {/* ════════════════════════════════ */}
        {isSidebarOpen && (
          <div className="w-64 shrink-0 flex flex-col transition-all rounded-xl border overflow-hidden"
            style={{
              borderColor:'var(--glass-border)',
              background:'var(--bg-surface)',
            }}>
            <div className="px-4 py-3 border-b text-xs font-bold uppercase tracking-widest flex items-center justify-between"
              style={{borderColor:'var(--glass-border)', color:'var(--fg-muted)'}}>
              Explorer
            </div>
            <div className="flex-1 overflow-y-auto p-2" style={{scrollbarWidth:'thin'}}>
              {sidebarData.map(folder => (
                <div key={folder.id} className="mb-1">
                  <button 
                    onClick={() => toggleFolder(folder.id)}
                    className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded hover:bg-[var(--glass-bg)] transition-colors text-sm font-semibold"
                    style={{color:'var(--fg)'}}>
                    <span className="text-[10px] w-3 text-center" style={{color:'var(--fg-subtle)'}}>
                      {expandedFolders[folder.id] ? '▼' : '▶'}
                    </span>
                    <span style={{color: folder.color}}>📁</span>
                    <span className="truncate">{folder.name}</span>
                  </button>
                  
                  {expandedFolders[folder.id] && folder.questions && (
                    <div className="mt-1 flex flex-col gap-0.5">
                      {folder.questions.map(q => (
                        <Link key={q.id} href={`/questions/${q.id}`}
                          className={`flex items-center gap-2 pl-7 pr-2 py-1.5 rounded text-xs transition-colors hover:bg-[var(--glass-bg)] ${q.id === questionId ? 'bg-[var(--glow-primary)] font-semibold' : 'text-[var(--fg-muted)]'}`}
                          style={{
                            color: q.id === questionId ? 'var(--primary)' : 'var(--fg-muted)'
                          }}>
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" 
                            style={{
                              background: q.difficulty === 'Easy' ? '#10b981' : (q.difficulty === 'Hard' ? '#f43f5e' : '#fb8c00'),
                              boxShadow: `0 0 8px ${q.difficulty === 'Easy' ? '#10b981' : (q.difficulty === 'Hard' ? '#f43f5e' : '#fb8c00')}80`
                            }} 
                          />
                          <span className="truncate" title={q.title}>{q.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════ */}
        {/* LEFT PANEL — Problem + Notes    */}
        {/* ════════════════════════════════ */}
        <div className="flex flex-col shrink-0 rounded-xl border overflow-hidden shadow-sm"
          style={{
            width:'38%',
            borderColor:'var(--glass-border)',
            background:'var(--bg-surface)',
          }}>

          {/* Tab bar */}
          <div className="flex border-b shrink-0" style={{borderColor:'var(--glass-border)'}}>
            {[
              {id:'description', label:'📋 Description'},
              {id:'approach',    label:'🧠 Strategy'},
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all relative"
                style={{
                  color: activeTab === tab.id ? 'var(--primary)' : 'var(--fg-muted)',
                  borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                  background:'transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel content — scrollable */}
          <div className="flex-1 overflow-y-auto p-5" style={{scrollbarWidth:'thin'}}>

            {activeTab === 'description' ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-black tracking-tight mb-3">{question.title}</h2>
                  <div className="flex flex-wrap gap-2 mb-5">
                    <span className={`badge ${question.difficulty}`}>{question.difficulty}</span>
                    {question.tags?.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                      <span key={tag} className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg"
                        style={{background:'var(--glass-bg)', border:'1px solid var(--glass-border)', color:'var(--fg-muted)'}}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4" style={{borderColor:'var(--glass-border)'}}>
                  <label className="block text-xs font-black uppercase tracking-widest mb-3"
                    style={{color:'var(--fg-muted)'}}>
                    Problem Statement
                  </label>
                  <textarea
                    className="w-full resize-none text-sm leading-relaxed outline-none"
                    style={{
                      minHeight:'300px',
                      background:'transparent',
                      color:'var(--fg)',
                      border:'none',
                    }}
                    placeholder="Paste or type the problem statement here..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-3"
                  style={{color:'var(--fg-muted)'}}>
                  Algorithm & Complexity Notes
                </label>
                <textarea
                  className="w-full resize-none text-sm leading-relaxed outline-none"
                  style={{
                    minHeight:'calc(100vh - 200px)',
                    background:'transparent',
                    color:'var(--fg)',
                    border:'none',
                  }}
                  placeholder={"Approach:\n\n1. Use a hash map to store indices...\n\nTime Complexity: O(n)\nSpace Complexity: O(n)"}
                  value={approach}
                  onChange={e => setApproach(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════ */}
        {/* RIGHT PANEL — Editor + Output   */}
        {/* ════════════════════════════════ */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0 gap-2">

          {/* ── EDITOR PANEL ── */}
          <div className="flex flex-col flex-1 min-h-0 rounded-xl border overflow-hidden shadow-sm"
            style={{
              borderColor:'var(--glass-border)',
              background:'var(--bg-surface)',
            }}>
            {/* Editor top bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b shrink-0"
            style={{
              background:'var(--bg-surface)',
              borderColor:'var(--glass-border)',
              minHeight:'44px'
            }}>

            {/* Language selector */}
            <div className="flex gap-1 p-0.5 rounded-lg" style={{background:'var(--glass-bg)', border:'1px solid var(--glass-border)'}}>
              {['java','python'].map(lang => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className="px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all"
                  style={activeLang === lang
                    ? {background:'var(--primary)', color:'#fff', boxShadow:'0 2px 10px rgba(59,130,246,0.4)'}
                    : {color:'var(--fg-muted)'}
                  }
                >
                  {lang === 'java' ? '☕ Java' : '🐍 Python'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"
                style={{color:'#10b981'}}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Auto-saved on sync
              </span>
            </div>
          </div>

          {/* Monaco Editor — takes remaining space above output */}
          <div className="flex-1 min-h-0" style={{overflow:'hidden'}}>
            <MonacoEditor
              height="100%"
              language={activeLang === 'java' ? 'java' : 'python'}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={code}
              onChange={val => setCode(val || '')}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontLigatures: true,
                minimap: {enabled: false},
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                padding: {top: 16, bottom: 16},
                automaticLayout: true,
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                bracketPairColorization: {enabled: true},
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible',
                  verticalSliderSize: 4,
                  horizontalSliderSize: 4,
                },
              }}
            />
          </div>

          </div> {/* End Editor Panel */}

          {/* ── TERMINAL OUTPUT PANEL (bottom drawer) ── */}
          <div className="shrink-0 flex flex-col rounded-xl border overflow-hidden shadow-sm"
            style={{
              borderColor:'var(--glass-border)',
              background:'var(--bg-surface)',
              height: outputExpanded ? '240px' : '44px',
              transition:'height 0.3s cubic-bezier(0.25,1,0.5,1)',
            }}>

            {/* Output tab bar */}
            <div className="flex items-center justify-between px-4 shrink-0 cursor-pointer select-none"
              style={{height:'44px', borderBottom: outputExpanded ? '1px solid var(--glass-border)' : 'none'}}
              onClick={() => setOutputExpanded(!outputExpanded)}>

              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase tracking-widest" style={{color:'#3fb950'}}>
                  🖥 Terminal Output
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold"
                  style={{background:'rgba(63,185,80,0.1)', color:'#3fb950', border:'1px solid rgba(63,185,80,0.25)'}}>
                  Paste your local run result
                </span>
              </div>

              <div className="flex items-center gap-3">
                {outputExpanded && (
                  <button
                    onClick={e => { e.stopPropagation(); setTerminalOutput('') }}
                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded transition-all"
                    style={{
                      color:'var(--fg-subtle)',
                      background:'var(--glass-bg)',
                      border:'1px solid var(--glass-border)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color='#f85149'}
                    onMouseLeave={e => e.currentTarget.style.color='var(--fg-subtle)'}>
                    Clear
                  </button>
                )}
                <span className="text-xs" style={{color:'var(--fg-subtle)'}}>
                  {outputExpanded ? '▼' : '▲'}
                </span>
              </div>
            </div>

            {/* Terminal body */}
            {outputExpanded && (
              <div className="flex flex-1 min-h-0" style={{background:'var(--input-bg)'}}>
                {/* Gutter / prompt */}
                <div className="flex flex-col gap-1 px-3 pt-4 text-xs font-mono shrink-0 select-none"
                  style={{
                    background:'var(--input-bg)',
                    color:'var(--fg-subtle)',
                    borderRight:'1px solid var(--glass-border)',
                    minWidth:'52px',
                    paddingRight:'12px',
                  }}>
                  <span style={{color:'#3fb950'}}>$</span>
                </div>

                <textarea
                  className="flex-1 resize-none font-mono outline-none"
                  style={{
                    background: 'var(--input-bg)',
                    color: terminalOutput ? 'var(--fg)' : 'var(--fg-muted)',
                    caretColor: '#3fb950',
                    fontSize: '14px',
                    lineHeight: '1.8',
                    padding: '14px 16px',
                    letterSpacing: '0.01em',
                  }}
                  placeholder={"Paste your terminal output here...\n\nExample output:\n  Hello World\n  [1, 0]\n  true\n\nProcess finished with exit code 0"}
                  value={terminalOutput}
                  onChange={e => setTerminalOutput(e.target.value)}
                  spellCheck={false}
                />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
