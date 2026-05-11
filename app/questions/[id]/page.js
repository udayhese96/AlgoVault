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
  const [terminalOutput, setTerminalOutput] = useState('') // This is the saved "Pasted Output"
  const [compiledOutput, setCompiledOutput] = useState('') // Transient execution output
  const [activeOutputTab, setActiveOutputTab] = useState('compiled') // 'compiled' | 'pasted'
  const [isExecuting, setIsExecuting] = useState(false)

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [sidebarData, setSidebarData] = useState([])
  const [expandedFolders, setExpandedFolders] = useState({})

  // Sidebar Actions State
  const [showNewFolderModal, setShowNewFolderModal] = useState(false)
  const [showNewQuestionModal, setShowNewQuestionModal] = useState(false)
  
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('#3b82f6')
  
  const [newQuestionTitle, setNewQuestionTitle] = useState('')
  const [newQuestionDifficulty, setNewQuestionDifficulty] = useState('Medium')
  const [newQuestionFolderId, setNewQuestionFolderId] = useState('')
  const [newQuestionTags, setNewQuestionTags] = useState('')

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

  const handleCreateFolder = async (e) => {
    e.preventDefault()
    if (!newFolderName.trim() || !user) return
    const { error } = await supabase.from('folders').insert([{
      name: newFolderName,
      color: newFolderColor,
      user_id: user.id
    }])
    if (!error) {
      setNewFolderName('')
      setShowNewFolderModal(false)
      fetchSidebarData()
    }
  }

  const handleCreateQuestion = async (e) => {
    e.preventDefault()
    const targetFolder = newQuestionFolderId || question?.folder?.id
    if (!newQuestionTitle.trim() || !user || !targetFolder) return
    
    const { data, error } = await supabase.from('questions').insert([{
      title: newQuestionTitle,
      difficulty: newQuestionDifficulty,
      tags: newQuestionTags,
      folder_id: targetFolder,
      user_id: user.id
    }]).select()
    
    if (!error && data) {
      setNewQuestionTitle('')
      setNewQuestionDifficulty('Medium')
      setNewQuestionTags('')
      setShowNewQuestionModal(false)
      fetchSidebarData()
      
      // Auto-expand the folder where it was added
      setExpandedFolders(prev => ({...prev, [targetFolder]: true}))
      
      // Optionally navigate to the new question
      router.push(`/questions/${data[0].id}`)
    }
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
    
    let initialCode = '';
    if (lang === 'python') initialCode = data.code_python;
    else if (lang === 'java') initialCode = data.code_java;
    else if (lang === 'cpp') initialCode = data.code_cpp;

    if (!initialCode) {
        if (lang === 'cpp') {
            initialCode = '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World" << endl;\n    return 0;\n}';
        } else if (lang === 'python') {
            initialCode = 'print("Hello World")';
        } else if (lang === 'java') {
            initialCode = 'import java.util.*;\n\nclass Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}';
        }
    }
    
    setCode(initialCode)
    setDescription(data.description || '')
    setApproach(data.solving_approach || '')
    setTerminalOutput(data.terminal_output || '')
    setLoading(false)
  }

  const handleLanguageChange = (lang) => {
    if (activeLang === 'java') setQuestion(prev => ({ ...prev, code_java: code }))
    else if (activeLang === 'python') setQuestion(prev => ({ ...prev, code_python: code }))
    else if (activeLang === 'cpp') setQuestion(prev => ({ ...prev, code_cpp: code }))
    
    setActiveLang(lang)
    
    let nextCode = '';
    if (lang === 'python') nextCode = question?.code_python;
    else if (lang === 'java') nextCode = question?.code_java;
    else if (lang === 'cpp') nextCode = question?.code_cpp;

    if (!nextCode) {
        if (lang === 'cpp') {
            nextCode = '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World" << endl;\n    return 0;\n}';
        } else if (lang === 'python') {
            nextCode = 'print("Hello World")';
        } else if (lang === 'java') {
            nextCode = 'import java.util.*;\n\nclass Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}';
        }
    }
    
    setCode(nextCode || '')
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
    else if (activeLang === 'python') updateData.code_python = code
    else if (activeLang === 'cpp') updateData.code_cpp = code

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

  const runCode = async () => {
    if (!code.trim()) return
    setIsExecuting(true)
    setOutputExpanded(true)
    setActiveOutputTab('compiled')
    setCompiledOutput('Executing code on secure compiler engine...\n\n')
    
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: activeLang })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setCompiledOutput(`Execution Error:\n\n${data.error}`)
      } else {
        const outputStr = data.output || 'Code executed successfully with no output.'
        const memoryStr = data.memory ? `\n\n---\n[Memory: ${data.memory} KB | Time: ${data.time}s]` : ''
        setCompiledOutput(`${outputStr}${memoryStr}`)
      }
    } catch (err) {
      setCompiledOutput(`Network Error: Failed to reach execution server.\nDetails: ${err.message}`)
    } finally {
      setIsExecuting(false)
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
            <div className="px-4 py-3 border-b text-xs font-bold uppercase tracking-widest flex items-center justify-between group"
              style={{borderColor:'var(--glass-border)', color:'var(--fg-muted)'}}>
              <span>AlgoVault</span>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => {
                  setNewQuestionFolderId(question?.folder?.id || '')
                  setShowNewQuestionModal(true)
                }} title="New Question" className="hover:text-[var(--fg)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                </button>
                <button onClick={() => setShowNewFolderModal(true)} title="New Folder" className="hover:text-[var(--fg)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
                </button>
                <button onClick={fetchSidebarData} title="Refresh" className="hover:text-[var(--fg)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                </button>
              </div>
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
              {['java','python','cpp'].map(lang => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  className="px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all"
                  style={activeLang === lang
                    ? {background:'var(--primary)', color:'#fff', boxShadow:'0 2px 10px rgba(59,130,246,0.4)'}
                    : {color:'var(--fg-muted)'}
                  }
                >
                  {lang === 'java' ? '☕ Java' : lang === 'python' ? '🐍 Python' : '⚙️ C++'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 hidden md:flex"
                style={{color:'#10b981'}}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Auto-saved
              </span>
              <button 
                onClick={runCode}
                disabled={isExecuting || !code.trim()}
                className="btn text-sm px-4 py-1.5 h-8 gap-2 shrink-0 transition-all"
                style={{
                  background: isExecuting ? 'var(--glass-bg)' : 'var(--primary)',
                  color: isExecuting ? 'var(--fg-muted)' : '#fff',
                  border: isExecuting ? '1px solid var(--glass-border)' : 'none',
                  boxShadow: isExecuting ? 'none' : '0 2px 10px rgba(59,130,246,0.3)'
                }}
              >
                {isExecuting ? (
                  <><div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Running...</>
                ) : (
                  <><span>▶</span> Run</>
                )}
              </button>
            </div>
          </div>

          {/* Monaco Editor — takes remaining space above output */}
          <div className="flex-1 min-h-0" style={{overflow:'hidden'}}>
            <MonacoEditor
              height="100%"
              language={activeLang === 'java' ? 'java' : activeLang === 'python' ? 'python' : 'cpp'}
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
            <div className="flex items-center justify-between px-0 shrink-0 select-none"
              style={{height:'44px', borderBottom: outputExpanded ? '1px solid var(--glass-border)' : 'none'}}
              >

              <div className="flex items-center h-full">
                <button
                  onClick={() => { setOutputExpanded(true); setActiveOutputTab('compiled') }}
                  className="h-full px-4 flex items-center gap-2 transition-all relative"
                  style={{
                    color: activeOutputTab === 'compiled' ? '#3fb950' : 'var(--fg-muted)',
                    background: activeOutputTab === 'compiled' ? 'var(--glass-bg)' : 'transparent',
                    borderRight: '1px solid var(--glass-border)'
                  }}
                >
                  <span className="text-xs font-black uppercase tracking-widest">
                    🖥 Compiled Run
                  </span>
                  {activeOutputTab === 'compiled' && (
                     <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3fb950]"></div>
                  )}
                </button>

                <button
                  onClick={() => { setOutputExpanded(true); setActiveOutputTab('pasted') }}
                  className="h-full px-4 flex items-center gap-2 transition-all relative"
                  style={{
                    color: activeOutputTab === 'pasted' ? 'var(--primary)' : 'var(--fg-muted)',
                    background: activeOutputTab === 'pasted' ? 'var(--glass-bg)' : 'transparent',
                    borderRight: '1px solid var(--glass-border)'
                  }}
                >
                  <span className="text-xs font-black uppercase tracking-widest">
                    📝 Pasted Output
                  </span>
                  {activeOutputTab === 'pasted' && (
                     <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"></div>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3 pr-4">
                {outputExpanded && activeOutputTab === 'pasted' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setTerminalOutput(compiledOutput) }}
                    className="text-[10px] font-bold uppercase px-3 py-1 rounded transition-all"
                    style={{
                      color:'var(--primary)',
                      background:'rgba(59,130,246,0.1)',
                      border:'1px solid rgba(59,130,246,0.25)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(59,130,246,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(59,130,246,0.1)'}>
                    Copy from Compiled
                  </button>
                )}
                {outputExpanded && (
                  <button
                    onClick={e => { 
                      e.stopPropagation(); 
                      if (activeOutputTab === 'compiled') setCompiledOutput('');
                      else setTerminalOutput('');
                    }}
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
                <button onClick={() => setOutputExpanded(!outputExpanded)} className="text-xs ml-1" style={{color:'var(--fg-subtle)'}}>
                  {outputExpanded ? '▼' : '▲'}
                </button>
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
                  <span style={{color: activeOutputTab === 'compiled' ? '#3fb950' : 'var(--primary)'}}>$</span>
                </div>

                {activeOutputTab === 'compiled' ? (
                  <textarea
                    className="flex-1 resize-none font-mono outline-none"
                    style={{
                      background: 'var(--input-bg)',
                      color: compiledOutput ? 'var(--fg)' : 'var(--fg-muted)',
                      caretColor: '#3fb950',
                      fontSize: '14px',
                      lineHeight: '1.8',
                      padding: '14px 16px',
                      letterSpacing: '0.01em',
                    }}
                    readOnly
                    placeholder={"Run your code to see the compiled output here..."}
                    value={compiledOutput}
                  />
                ) : (
                  <textarea
                    className="flex-1 resize-none font-mono outline-none"
                    style={{
                      background: 'var(--input-bg)',
                      color: terminalOutput ? 'var(--fg)' : 'var(--fg-muted)',
                      caretColor: 'var(--primary)',
                      fontSize: '14px',
                      lineHeight: '1.8',
                      padding: '14px 16px',
                      letterSpacing: '0.01em',
                    }}
                    placeholder={"Paste your terminal output manually, or click 'Copy from Compiled' to copy the run output..."}
                    value={terminalOutput}
                    onChange={e => setTerminalOutput(e.target.value)}
                    spellCheck={false}
                  />
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── MODALS ── */}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowNewFolderModal(false)} />
          <div className="glass p-8 w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-200" style={{background: 'var(--bg-surface)', border: '1px solid var(--glass-border)'}}>
            <h2 className="text-2xl font-bold mb-6">Create Vault Folder</h2>
            <form onSubmit={handleCreateFolder} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-muted" style={{color: 'var(--fg-muted)'}}>Folder Name</label>
                <input type="text" className="w-full px-4 py-2 border rounded-xl text-sm outline-none" placeholder="e.g. Dynamic Programming"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)', color: 'var(--fg)' }}
                  value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} autoFocus required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-muted" style={{color: 'var(--fg-muted)'}}>Theme Color</label>
                <div className="flex gap-3">
                  {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(c => (
                    <button key={c} type="button" onClick={() => setNewFolderColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${newFolderColor === c ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
                      style={{ backgroundColor: c, boxShadow: newFolderColor === c ? `0 0 12px ${c}` : 'none' }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowNewFolderModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex-1" style={{color: 'var(--fg)'}}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex-1 transition-transform active:scale-95 shadow-lg" style={{background: 'var(--primary)'}}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Question Modal */}
      {showNewQuestionModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowNewQuestionModal(false)} />
          <div className="glass p-8 w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-200" style={{background: 'var(--bg-surface)', border: '1px solid var(--glass-border)'}}>
            <h2 className="text-2xl font-bold mb-6">Create Question</h2>
            <form onSubmit={handleCreateQuestion} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-muted" style={{color: 'var(--fg-muted)'}}>Target Folder</label>
                <select className="w-full px-4 py-2 border rounded-xl text-sm outline-none appearance-none cursor-pointer"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)', color: 'var(--fg)' }}
                  value={newQuestionFolderId} onChange={(e) => setNewQuestionFolderId(e.target.value)} required>
                  <option value="" disabled style={{background: 'var(--bg-surface)', color: 'var(--fg)'}}>Select a folder</option>
                  {sidebarData.map(f => (
                    <option key={f.id} value={f.id} style={{background: 'var(--bg-surface)', color: 'var(--fg)'}}>{f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-muted" style={{color: 'var(--fg-muted)'}}>Question Title</label>
                <input type="text" className="w-full px-4 py-2 border rounded-xl text-sm outline-none" placeholder="e.g. Two Sum"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)', color: 'var(--fg)' }}
                  value={newQuestionTitle} onChange={(e) => setNewQuestionTitle(e.target.value)} autoFocus required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-muted" style={{color: 'var(--fg-muted)'}}>Difficulty</label>
                <select className="w-full px-4 py-2 border rounded-xl text-sm outline-none appearance-none cursor-pointer"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)', color: 'var(--fg)' }}
                  value={newQuestionDifficulty} onChange={(e) => setNewQuestionDifficulty(e.target.value)}>
                  <option value="Easy" style={{background: 'var(--bg-surface)', color: 'var(--fg)'}}>🟢 Easy</option>
                  <option value="Medium" style={{background: 'var(--bg-surface)', color: 'var(--fg)'}}>🟠 Medium</option>
                  <option value="Hard" style={{background: 'var(--bg-surface)', color: 'var(--fg)'}}>🔴 Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-muted" style={{color: 'var(--fg-muted)'}}>Attributes (comma-separated)</label>
                <input type="text" className="w-full px-4 py-2 border rounded-xl text-sm outline-none" placeholder="e.g. Strings, Map"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)', color: 'var(--fg)' }}
                  value={newQuestionTags} onChange={(e) => setNewQuestionTags(e.target.value)} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowNewQuestionModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex-1" style={{color: 'var(--fg)'}}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex-1 transition-transform active:scale-95 shadow-lg" style={{background: 'var(--primary)'}}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
