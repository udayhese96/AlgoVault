'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/AuthContext'

export default function FolderDetail() {
  const params = useParams()
  const folderId = params.id
  const [folder, setFolder] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDifficulty, setNewDifficulty] = useState('Medium')
  const [newTags, setNewTags] = useState('')
  
  // Controls state
  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [savedQuestions, setSavedQuestions] = useState([])

  useEffect(() => {
    // Load saved questions from localStorage on mount
    const saved = localStorage.getItem('savedQuestions')
    if (saved) {
      setSavedQuestions(JSON.parse(saved))
    }
  }, [])

  const toggleBookmark = (id, e) => {
    e.preventDefault()
    e.stopPropagation()
    let updatedSaved = [...savedQuestions]
    if (updatedSaved.includes(id)) {
      updatedSaved = updatedSaved.filter(qId => qId !== id)
    } else {
      updatedSaved.push(id)
    }
    setSavedQuestions(updatedSaved)
    localStorage.setItem('savedQuestions', JSON.stringify(updatedSaved))
  }

  const supabase = createClient()
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => { if (folderId && user) fetchFolderData() }, [folderId, user])

  const fetchFolderData = async () => {
    setLoading(true)
    const { data: folderData, error: folderError } = await supabase
      .from('folders').select('*').eq('id', folderId).eq('user_id', user.id).single()
    if (folderError) { router.push('/dashboard'); return }
    setFolder(folderData)

    const { data: questionsData, error: questionsError } = await supabase
      .from('questions').select('*').eq('folder_id', folderId).eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!questionsError) setQuestions(questionsData)
    setLoading(false)
  }

  const handleAddQuestion = async (e) => {
    e.preventDefault()
    if (!newTitle.trim() || !user) return
    const { error } = await supabase.from('questions').insert([{
      title: newTitle, difficulty: newDifficulty, tags: newTags,
      folder_id: folderId, user_id: user.id
    }])
    if (!error) { setNewTitle(''); setNewDifficulty('Medium'); setNewTags(''); setShowModal(false); fetchFolderData() }
  }

  const deleteQuestion = async (id, e) => {
    e.preventDefault(); e.stopPropagation()
    if (confirm('Delete this question?')) {
      const { error } = await supabase.from('questions').delete().eq('id', id)
      if (!error) fetchFolderData()
    }
  }

  if (loading && !folder) return (
    <div className="container py-24 animate-pulse">
      <div className="h-4 w-32 bg-glass-border rounded mb-6" />
      <div className="h-12 w-64 bg-glass-border rounded mb-12" />
      <div className="space-y-6">{[1,2,3].map(i => <div key={i} className="glass h-24" />)}</div>
    </div>
  )

  const filteredQuestions = questions
    .filter(q => q.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(q => {
      if (difficultyFilter === 'All') return true
      if (difficultyFilter === 'Saved') return savedQuestions.includes(q.id)
      return q.difficulty === difficultyFilter
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB
    })

  return (
    <div className="container py-10 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div>
          <nav className="flex items-center gap-2 text-muted text-sm font-medium mb-4">
            <Link href="/dashboard" className="hover:text-primary transition-colors">Library</Link>
            <span className="opacity-30">/</span>
            <span className="text-foreground">{folder?.name}</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner"
              style={{ backgroundColor: `${folder?.color}15`, color: folder?.color }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{folder?.name}</h1>
          </div>
          <p className="text-muted text-lg mt-4 max-w-xl">{questions.length} total questions cataloged in this repository.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary px-8"><span>+</span> Add New Question</button>
      </div>

      {questions.length === 0 ? (
        <div className="glass p-20 text-center flex flex-col items-center max-w-3xl mx-auto">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-4xl mb-6">🖋️</div>
          <h2 className="text-3xl font-bold mb-4">Vault is empty</h2>
          <p className="text-muted text-lg mb-10 max-w-sm">Capture your first coding challenge in this folder to start building your sheet.</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary px-10">Create First Question</button>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center justify-between p-4 glass rounded-2xl">
            {/* Search */}
            <div className="flex-1 w-full relative text-muted">
              <input 
                type="text" 
                placeholder="Search questions by title..." 
                className="input-field w-full !pl-12 bg-input-bg"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <svg 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            
            {/* Filters */}
            <div className="flex gap-3 w-full sm:w-auto">
              <select 
                className="input-field bg-input-bg w-full sm:w-auto cursor-pointer"
                value={difficultyFilter}
                onChange={e => setDifficultyFilter(e.target.value)}
              >
                <option value="All">All Levels</option>
                <option value="Saved">Saved (Bookmarks)</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              
              <select 
                className="input-field bg-input-bg w-full sm:w-auto cursor-pointer"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="glass p-12 text-center text-muted flex flex-col items-center">
              <div className="text-4xl mb-4 opacity-50">🔍</div>
              <p className="text-lg font-semibold">No questions match your search.</p>
              <button 
                onClick={() => { setSearchQuery(''); setDifficultyFilter('All'); }}
                className="text-primary hover:underline mt-2 font-medium"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredQuestions.map(q => (
                <Link key={q.id} href={`/questions/${q.id}`}
              className="glass p-6 group glass-hover flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4"
              style={{ borderLeftColor: q.difficulty === 'Easy' ? '#10b981' : (q.difficulty === 'Hard' ? '#f43f5e' : '#fb8c00') }}>
              <div className="flex items-center gap-6 flex-1">
                <div className={`badge ${q.difficulty} !rounded-xl`}>{q.difficulty}</div>
                <div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-all">{q.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {q.tags?.split(',').map(tag => tag.trim() && (
                      <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-muted bg-glass-bg border border-glass-border px-2.5 py-1 rounded-lg">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-10">
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Cataloged</div>
                  <div className="text-xs font-semibold">{new Date(q.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                  <button onClick={(e) => toggleBookmark(q.id, e)}
                    className={`p-2.5 rounded-xl border border-glass-border transition-all ${savedQuestions.includes(q.id) ? 'text-primary border-primary/30 bg-primary/5' : 'text-muted hover:text-primary hover:border-primary/30 hover:bg-primary/5'}`}
                    title={savedQuestions.includes(q.id) ? "Remove Bookmark" : "Bookmark Question"}>
                    <svg viewBox="0 0 24 24" fill={savedQuestions.includes(q.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                  </button>
                  <button onClick={(e) => deleteQuestion(q.id, e)}
                    className="p-2.5 rounded-xl border border-glass-border text-muted hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 transition-all opacity-0 group-hover:opacity-100"
                    title="Delete Question">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:translate-x-1 transition-transform border border-primary/20">→</div>
                </div>
              </div>
            </Link>
          ))}
            </div>
          )}
        </>
      )}

    {/* Add Question Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="glass p-8 w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-200" style={{background: 'var(--bg-surface)', border: '1px solid var(--glass-border)'}}>
            <h2 className="text-2xl font-bold mb-6 tracking-tight">Create Question</h2>
            <form onSubmit={handleAddQuestion} className="space-y-6">
              
              {/* Target Folder is implicit but shown for UI consistency with the screenshot if needed, 
                  but since they are IN the folder, we can either show it disabled or omit it. 
                  Wait, the screenshot says "Target Folder" with the option selected. Since they are inside the folder, 
                  showing it disabled is a great touch! */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-muted" style={{color: 'var(--fg-muted)'}}>Target Folder</label>
                <select className="w-full px-4 py-2 border rounded-xl text-sm outline-none appearance-none"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)', color: 'var(--fg)', opacity: 0.8 }}
                  disabled>
                  <option style={{background: 'var(--bg-surface)', color: 'var(--fg)'}}>{folder?.name}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-muted" style={{color: 'var(--fg-muted)'}}>Question Title</label>
                <input type="text" className="w-full px-4 py-2 border rounded-xl text-sm outline-none" placeholder="e.g. Two Sum"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)', color: 'var(--fg)' }}
                  value={newTitle} onChange={(e) => setNewTitle(e.target.value)} autoFocus required />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-muted" style={{color: 'var(--fg-muted)'}}>Difficulty</label>
                <select className="w-full px-4 py-2 border rounded-xl text-sm outline-none appearance-none cursor-pointer"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)', color: 'var(--fg)' }}
                  value={newDifficulty} onChange={(e) => setNewDifficulty(e.target.value)}>
                  <option value="Easy" style={{background: 'var(--bg-surface)', color: 'var(--fg)'}}>🟢 Easy</option>
                  <option value="Medium" style={{background: 'var(--bg-surface)', color: 'var(--fg)'}}>🟠 Medium</option>
                  <option value="Hard" style={{background: 'var(--bg-surface)', color: 'var(--fg)'}}>🔴 Hard</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-muted" style={{color: 'var(--fg-muted)'}}>Attributes (comma-separated)</label>
                <input type="text" className="w-full px-4 py-2 border rounded-xl text-sm outline-none" placeholder="e.g. Strings, Map"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--glass-border)', color: 'var(--fg)' }}
                  value={newTags} onChange={(e) => setNewTags(e.target.value)} />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex-1" style={{color: 'var(--fg)'}}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex-1 transition-transform active:scale-95 shadow-lg" style={{background: 'var(--primary)'}}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
