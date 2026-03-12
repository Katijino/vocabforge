import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useWords, useAddWord, useDeleteWord } from '../hooks/useWords'
import { useUserSettings } from '../hooks/useUserSettings'
import { useUsageLimits } from '../hooks/useUsageLimits'
import { useUIStore } from '../stores/uiStore'
import UpgradePrompt from '../components/UpgradePrompt'

export default function Learn() {
  const user = useAuthStore((s) => s.user)
  const { data: words = [], isLoading } = useWords(user?.id ?? '')
  const { data: settings } = useUserSettings(user?.id ?? '')
  const addWord = useAddWord()
  const deleteWord = useDeleteWord()
  const limits = useUsageLimits(user?.id ?? '')
  const addToast = useUIStore((s) => s.addToast)

  const [newWord, setNewWord] = useState('')
  const [newDef, setNewDef] = useState('')
  const [newReading, setNewReading] = useState('')
  const [search, setSearch] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  if (!user) {
    return (
      <div style={authGuardStyle}>
        <p style={{ color: '#94a3b8' }}>Please sign in to manage your vocabulary.</p>
        <Link to="/login" style={primaryBtn}>Sign In</Link>
      </div>
    )
  }

  const handleAdd = async () => {
    if (!newWord.trim() || !newDef.trim()) return
    if (!limits.canAddWord) { setShowUpgrade(true); return }
    try {
      await addWord.mutateAsync({
        user_id: user.id,
        word: newWord.trim(),
        definition: newDef.trim(),
        reading: newReading.trim() || undefined,
        language: settings?.learning_language ?? 'en',
      })
      setNewWord('')
      setNewDef('')
      setNewReading('')
      addToast('Word added!', 'success')
    } catch {
      addToast('Failed to add word', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteWord.mutateAsync({ wordId: id, userId: user.id })
      setConfirmDelete(null)
      addToast('Word deleted', 'info')
    } catch {
      addToast('Failed to delete word', 'error')
    }
  }

  const filtered = words.filter((w) =>
    !search || w.word.toLowerCase().includes(search.toLowerCase()) || w.definition?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem', color: '#f1f5f9' }}>
      {showUpgrade && <UpgradePrompt reason="words" onClose={() => setShowUpgrade(false)} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.25rem' }}>My Words</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
            {words.length} words · {settings?.learning_language ?? 'Language not set'}
          </p>
        </div>
        <Link to="/import" style={secondaryBtn}>Import from file</Link>
      </div>

      {/* Add word form */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600, color: '#94a3b8' }}>
          Add a word
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>Word *</label>
            <input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="e.g. 渋滞"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Definition *</label>
            <input
              value={newDef}
              onChange={(e) => setNewDef(e.target.value)}
              placeholder="e.g. traffic jam"
              style={inputStyle}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div>
            <label style={labelStyle}>Reading</label>
            <input
              value={newReading}
              onChange={(e) => setNewReading(e.target.value)}
              placeholder="e.g. じゅうたい"
              style={inputStyle}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={addWord.isPending || !newWord.trim() || !newDef.trim()}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9rem',
              opacity: addWord.isPending ? 0.6 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {addWord.isPending ? '…' : '+ Add'}
          </button>
        </div>
        {!limits.canAddWord && (
          <p style={{ color: '#fca5a5', fontSize: '0.825rem', margin: '0.75rem 0 0' }}>
            Word limit reached ({limits.FREE_WORD_LIMIT} words on free plan).{' '}
            <Link to="/billing" style={{ color: '#a5b4fc' }}>Upgrade to Pro</Link>
          </p>
        )}
      </div>

      {/* Search */}
      <div style={{ margin: '1.5rem 0 1rem' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search words or definitions…"
          style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', padding: '0.75rem 1rem' }}
        />
      </div>

      {/* Word list */}
      {isLoading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>
          {search ? 'No words match your search.' : 'No words yet. Add some above or import a file.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map((w) => (
            <div key={w.id} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12,
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '1rem' }}>{w.word}</span>
                  {w.reading && <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{w.reading}</span>}
                  <span style={{ color: '#475569', fontSize: '0.75rem', background: 'rgba(255,255,255,0.04)', padding: '1px 6px', borderRadius: 4 }}>
                    {w.language}
                  </span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: 2 }}>{w.definition}</div>
                {w.example && (
                  <div style={{ color: '#475569', fontSize: '0.8rem', fontStyle: 'italic', marginTop: 2 }}>
                    "{w.example}"
                  </div>
                )}
              </div>
              <div style={{ flexShrink: 0, fontSize: '0.75rem', color: '#475569' }}>
                {new Date(w.created_at).toLocaleDateString()}
              </div>
              {confirmDelete === w.id ? (
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button onClick={() => handleDelete(w.id)} style={{ ...dangerBtn }}>Delete</button>
                  <button onClick={() => setConfirmDelete(null)} style={{ ...cancelBtn }}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(w.id)} style={ghostBtn}>
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
  padding: '1.5rem',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#64748b',
  marginBottom: '0.3rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const inputStyle: React.CSSProperties = {
  padding: '0.65rem 0.85rem',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  color: '#f1f5f9',
  fontSize: '0.9rem',
  outline: 'none',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
}

const authGuardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '60vh',
  gap: '1rem',
}

const primaryBtn: React.CSSProperties = {
  padding: '0.65rem 1.75rem',
  borderRadius: 8,
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  color: '#fff',
  fontWeight: 600,
  textDecoration: 'none',
  fontSize: '0.9rem',
}

const secondaryBtn: React.CSSProperties = {
  padding: '0.55rem 1.25rem',
  borderRadius: 8,
  border: '1px solid rgba(99,102,241,0.3)',
  color: '#a5b4fc',
  textDecoration: 'none',
  fontSize: '0.875rem',
  fontWeight: 500,
}

const ghostBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#475569',
  cursor: 'pointer',
  fontSize: '0.9rem',
  padding: '0.25rem 0.5rem',
  borderRadius: 6,
}

const dangerBtn: React.CSSProperties = {
  background: 'rgba(239,68,68,0.12)',
  border: '1px solid rgba(239,68,68,0.3)',
  color: '#fca5a5',
  cursor: 'pointer',
  fontSize: '0.8rem',
  padding: '0.3rem 0.7rem',
  borderRadius: 6,
}

const cancelBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#94a3b8',
  cursor: 'pointer',
  fontSize: '0.8rem',
  padding: '0.3rem 0.7rem',
  borderRadius: 6,
}
