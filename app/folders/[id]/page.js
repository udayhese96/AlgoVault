'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

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
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    if (folderId) {
      fetchFolderData()
    }
  }, [folderId])

  const fetchFolderData = async () => {
    setLoading(true)
    const { data: folderData, error: folderError } = await supabase
      .from('folders')
      .select('*')
      .eq('id', folderId)
      .single()

    if (folderError) {
      router.push('/dashboard')
      return
    }
    setFolder(folderData)

    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false })

    if (!questionsError) {
      setQuestions(questionsData)
    }
    setLoading(false)
  }

  const handleAddQuestion = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('questions')
      .insert([
        { 
          title: newTitle, 
          difficulty: newDifficulty,
          tags: newTags,
          folder_id: folderId,
          user_id: user.id 
        }
      ])

    if (!error) {
      setNewTitle('')
      setNewDifficulty('Medium')
      setNewTags('')
      setShowModal(false)
      fetchFolderData()
    }
  }

  const deleteQuestion = async (id, e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (confirm('Delete this question?')) {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id)
      
      if (!error) {
        fetchFolderData()
      }
    }
  }

  if (loading && !folder) return (
    <div className="container py-24 animate-pulse">
      <div className="h-4 w-32 bg-glass-border rounded mb-6" />
      <div className="h-12 w-64 bg-glass-border rounded mb-12" />
      <div className="space-y-6">
        {[1,2,3].map(i => <div key={i} className="glass h-24" />)}
      </div>
    </div>
  )

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
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner"
              style={{ backgroundColor: `${folder?.color}15`, color: folder?.color }}
            >
              📁
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{folder?.name}</h1>
          </div>
          <p className="text-muted text-lg mt-4 max-w-xl">
            {questions.length} total questions cataloged in this repository.
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn btn-primary px-8"
        >
          <span>+</span> Add New Question
        </button>
      </div>

      {questions.length === 0 ? (
        <div className="glass p-20 text-center flex flex-col items-center max-w-3xl mx-auto">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-4xl mb-6">🖋️</div>
          <h2 className="text-3xl font-bold mb-4">Vault is empty</h2>
          <p className="text-muted text-lg mb-10 max-w-sm">Capture your first coding challenge in this folder to start building your sheet.</p>
          <button 
            onClick={() => setShowModal(true)}
            className="btn btn-primary px-10"
          >
            Create First Question
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {questions.map(q => (
            <Link 
              key={q.id} 
              href={`/questions/${q.id}`}
              className="glass p-6 group glass-hover flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4"
              style={{ borderLeftColor: q.difficulty === 'Easy' ? '#10b981' : (q.difficulty === 'Hard' ? '#f43f5e' : '#fb8c00') }}
            >
              <div className="flex items-center gap-6 flex-1">
                <div className={`badge ${q.difficulty} !rounded-xl`}>
                  {q.difficulty}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-all">{q.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {q.tags?.split(',').map(tag => tag.trim() && (
                      <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-muted bg-glass-bg border border-glass-border px-2.5 py-1 rounded-lg">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between md:justify-end gap-10">
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] uppercase tracking-widest text-muted font-bold mb-1">Cataloged</div>
                  <div className="text-xs font-semibold">{new Date(q.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => deleteQuestion(q.id, e)}
                    className="p-2.5 rounded-xl border border-glass-border text-muted hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 transition-all opacity-0 group-hover:opacity-100"
                  >
                    ✕
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:translate-x-1 transition-transform border border-primary/20">
                    →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Add Question Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="glass p-10 w-full max-w-2xl relative z-10 animate-in fade-in zoom-in duration-200">
            <h2 className="text-3xl font-bold mb-8 tracking-tight">New Question</h2>
            <form onSubmit={handleAddQuestion} className="space-y-8">
              <div>
                <label className="block text-sm font-semibold mb-3 text-muted">Problem Title</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Valid Anagram" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-semibold mb-3 text-muted">Complexity Tier</label>
                  <select 
                    className="input-field appearance-none cursor-pointer bg-input-bg"
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value)}
                  >
                    <option value="Easy">🟢 Easy</option>
                    <option value="Medium">🟠 Medium</option>
                    <option value="Hard">🔴 Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-3 text-muted">Attributes (comma-separated)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Strings, Map" 
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="btn btn-ghost flex-1 py-4"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1 py-4 text-lg"
                >
                  Confirm Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
