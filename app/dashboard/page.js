'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('#3b82f6')
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchFolders()
  }, [])

  const fetchFolders = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data, error } = await supabase
        .from('folders')
        .select(`
          *,
          questions:questions(count)
        `)
        .order('created_at', { ascending: false })

      if (!error) {
        setFolders(data)
      }
    }
    setLoading(false)
  }

  const handleCreateFolder = async (e) => {
    e.preventDefault()
    if (!newFolderName.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('folders')
      .insert([
        { 
          name: newFolderName, 
          color: newFolderColor,
          user_id: user.id 
        }
      ])

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
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id)
      
      if (!error) {
        fetchFolders()
      }
    }
  }

  return (
    <div className="container py-10 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">Your Library</h1>
          <p className="text-muted text-lg max-w-xl">
            Everything you need to master your coding interviews, organized neatly.
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn btn-primary shadow-lg shadow-primary/20"
        >
          <span className="text-xl">+</span> New Topic Vault
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="glass h-52 animate-pulse" />
          ))}
        </div>
      ) : folders.length === 0 ? (
        <div className="glass p-16 text-center flex flex-col items-center max-w-3xl mx-auto border-dashed border-2">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-4xl mb-6">📂</div>
          <h2 className="text-3xl font-bold mb-4">No Vaults Found</h2>
          <p className="text-muted text-lg mb-10 max-w-md">Start by creating your first folder like "Arrays" or "Recursion". You can customize each with unique colors.</p>
          <button 
            onClick={() => setShowModal(true)}
            className="btn btn-primary px-8"
          >
            Create My First Vault
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {folders.map(folder => (
            <Link 
              key={folder.id} 
              href={`/folders/${folder.id}`}
              className="glass p-8 group glass-hover relative overflow-hidden"
              style={{ borderTop: `6px solid ${folder.color}` }}
            >
              <div className="flex justify-between items-start mb-6">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${folder.color}15`, color: folder.color }}
                >
                  📁
                </div>
                <button 
                  onClick={(e) => deleteFolder(folder.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-2 text-muted hover:text-red-500 transition-all"
                  aria-label="Delete Folder"
                >
                  ✕
                </button>
              </div>
              <h3 className="text-2xl font-bold mb-2 truncate group-hover:text-primary transition-colors">{folder.name}</h3>
              <div className="flex items-center gap-2 text-muted font-medium">
                <span className="text-sm">{folder.questions?.[0]?.count || 0} Questions</span>
                <span className="w-1 h-1 rounded-full bg-glass-border" />
                <span className="text-xs uppercase tracking-widest group-hover:text-primary transition-colors">View Library →</span>
              </div>
              
              {/* Subtle background glow */}
              <div 
                className="absolute -right-10 -bottom-10 w-24 h-24 blur-[60px] opacity-20 transition-opacity group-hover:opacity-40"
                style={{ backgroundColor: folder.color }}
              />
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
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Dynamic Programming" 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-4 text-muted">Accent Identity</label>
                <div className="flex flex-wrap gap-4">
                  {['#3b82f6', '#ec4899', '#f43f5e', '#10b981', '#fb8c00', '#8b5cf6'].map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`w-10 h-10 rounded-2xl border-4 transition-all shadow-md ${newFolderColor === color ? 'scale-125 border-white ring-4 ring-primary/20' : 'border-transparent hover:scale-110'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewFolderColor(color)}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="btn btn-ghost flex-1 py-4"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1 py-4 text-lg"
                >
                  Launch Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
