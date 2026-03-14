import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useDecks, useCreateDeck, useUpdateDeck, useDeleteDeck, useDeleteDeckWords } from '../hooks/useDecks'
import { useWords } from '../hooks/useWords'
import { useUIStore } from '../stores/uiStore'

export default function Decks() {
  const user = useAuthStore((s) => s.user)
  const { data: decks = [], isLoading } = useDecks(user?.id ?? '')
  const { data: allWords = [] } = useWords(user?.id ?? '')
  const createDeck = useCreateDeck()
  const updateDeck = useUpdateDeck()
  const deleteDeck = useDeleteDeck()
  const deleteDeckWords = useDeleteDeckWords()
  const addToast = useUIStore((s) => s.addToast)

  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newLimit, setNewLimit] = useState(20)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editLimit, setEditLimit] = useState(20)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmClearId, setConfirmClearId] = useState<string | null>(null)

  if (!user) {
    return (
      <div style={authGuardStyle}>
        <p style={{ color: '#94a3b8' }}>Please sign in to manage decks.</p>
        <Link to="/login" style={primaryBtn}>Sign In</Link>
      </div>
    )
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      await createDeck.mutateAsync({
        user_id: user.id,
        name: newName.trim(),
        description: newDesc.trim() || null,
        daily_review_limit: newLimit,
        language: 'Japanese',
      })
      setNewName('')
      setNewDesc('')
      setNewLimit(20)
      setShowCreate(false)
      addToast('Deck created!', 'success')
    } catch {
      addToast('Failed to create deck', 'error')
    }
  }

  const startEdit = (deck: (typeof decks)[0]) => {
    setEditingId(deck.id)
    setEditName(deck.name)
    setEditDesc(deck.description ?? '')
    setEditLimit(deck.daily_review_limit ?? 20)
  }

  const handleUpdate = async (deckId: string) => {
    try {
      await updateDeck.mutateAsync({
        deckId,
        userId: user.id,
        updates: { name: editName.trim(), description: editDesc.trim() || null, daily_review_limit: editLimit },
      })
      setEditingId(null)
      addToast('Deck updated!', 'success')
    } catch {
      addToast('Failed to update deck', 'error')
    }
  }

  const handleDelete = async (deckId: string) => {
    try {
      await deleteDeck.mutateAsync({ deckId, userId: user.id })
      setConfirmDeleteId(null)
      addToast('Deck deleted (words kept)', 'info')
    } catch {
      addToast('Failed to delete deck', 'error')
    }
  }

  const handleClearDeck = async (deckId: string) => {
    try {
      await deleteDeckWords.mutateAsync({ deckId, userId: user.id })
      setConfirmClearId(null)
      addToast('All words in deck deleted', 'info')
    } catch {
      addToast('Failed to delete words', 'error')
    }
  }

  const wordCountByDeck = (deckId: string) => allWords.filter((w) => w.list_id === deckId).length
  const undeckedCount = allWords.filter((w) => !w.list_id).length

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem', color: '#f1f5f9' }}>
      {/* Modals */}
      {confirmDeleteId && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', fontWeight: 700 }}>Delete deck?</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
              The deck will be removed but all its words will be kept (moved to "No deck").
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => handleDelete(confirmDeleteId)} style={dangerBtn}>Delete Deck</button>
              <button onClick={() => setConfirmDeleteId(null)} style={cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {confirmClearId && (
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, borderColor: 'rgba(239,68,68,0.3)' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', fontWeight: 700 }}>Delete all words in deck?</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
              This will permanently delete all words and their SRS progress. Cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => handleClearDeck(confirmClearId)}
                disabled={deleteDeckWords.isPending}
                style={{ ...dangerBtn, opacity: deleteDeckWords.isPending ? 0.6 : 1 }}
              >
                {deleteDeckWords.isPending ? 'Deleting…' : 'Delete All Words'}
              </button>
              <button onClick={() => setConfirmClearId(null)} style={cancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.25rem' }}>Decks</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
            {decks.length} deck{decks.length !== 1 ? 's' : ''} · organize your vocabulary
          </p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} style={primaryBtnStyle}>
          {showCreate ? 'Cancel' : '+ New Deck'}
        </button>
      </div>

      {/* Create deck form */}
      {showCreate && (
        <div style={{ ...cardStyle, marginBottom: '1.5rem', border: '1px solid rgba(99,102,241,0.3)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600, color: '#94a3b8' }}>New Deck</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Core Vocabulary" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Optional description" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Daily review limit</label>
              <input
                type="number"
                value={newLimit}
                onChange={(e) => setNewLimit(Number(e.target.value))}
                min={1}
                max={500}
                style={{ ...inputStyle, width: 120 }}
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || createDeck.isPending}
              style={{ ...primaryBtnStyle, width: 'fit-content', opacity: (!newName.trim() || createDeck.isPending) ? 0.6 : 1 }}
            >
              {createDeck.isPending ? 'Creating…' : 'Create Deck'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Undecked words virtual deck */}
          {undeckedCount > 0 && (
            <div style={{ ...cardStyle, opacity: 0.7 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: '#e2e8f0' }}>No Deck</div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 2 }}>Words without a deck</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={badgeStyle}>{undeckedCount} words</span>
                  <Link to="/learn?deck=undecked" style={ghostBtnLink}>View words →</Link>
                </div>
              </div>
            </div>
          )}

          {decks.length === 0 && (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>
              No decks yet. Create one above to organize your vocabulary.
            </div>
          )}

          {decks.map((deck) => {
            const count = wordCountByDeck(deck.id)
            const isEditing = editingId === deck.id

            return (
              <div key={deck.id} style={{ ...cardStyle, border: isEditing ? '1px solid rgba(99,102,241,0.35)' : undefined }}>
                {isEditing ? (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div>
                      <label style={labelStyle}>Name</label>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Description</label>
                      <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Optional" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Daily review limit</label>
                      <input
                        type="number"
                        value={editLimit}
                        onChange={(e) => setEditLimit(Number(e.target.value))}
                        min={1}
                        max={500}
                        style={{ ...inputStyle, width: 120 }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleUpdate(deck.id)} style={{ ...primaryBtnStyle, fontSize: '0.85rem', padding: '0.5rem 1rem' }}>Save</button>
                      <button onClick={() => setEditingId(null)} style={{ ...cancelBtn, cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: '#e2e8f0' }}>{deck.name}</div>
                      {deck.description && (
                        <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 2 }}>{deck.description}</div>
                      )}
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={{ color: '#475569', fontSize: '0.75rem' }}>
                          {deck.daily_review_limit ?? 20} cards/day limit
                        </span>
                        <span style={{ color: '#475569', fontSize: '0.75rem' }}>
                          Created {new Date(deck.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, flexWrap: 'wrap' }}>
                      <span style={badgeStyle}>{count} words</span>
                      <Link to={`/learn?deck=${deck.id}`} style={ghostBtnLink}>View →</Link>
                      <Link to={`/import?deck=${deck.id}`} style={ghostBtnLink}>Import →</Link>
                      <button onClick={() => startEdit(deck)} style={ghostBtn}>Edit</button>
                      <button onClick={() => setConfirmClearId(deck.id)} style={{ ...ghostBtn, color: '#f87171' }}>Clear</button>
                      <button onClick={() => setConfirmDeleteId(deck.id)} style={{ ...ghostBtn, color: '#f87171' }}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14,
  padding: '1.25rem 1.5rem',
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
  padding: '0.6rem 0.85rem',
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

const primaryBtnStyle: React.CSSProperties = {
  padding: '0.6rem 1.25rem',
  borderRadius: 8,
  border: 'none',
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.875rem',
}

const ghostBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#64748b',
  cursor: 'pointer',
  fontSize: '0.8rem',
  padding: '0.25rem 0.5rem',
  borderRadius: 6,
}

const ghostBtnLink: React.CSSProperties = {
  background: 'transparent',
  color: '#94a3b8',
  fontSize: '0.8rem',
  padding: '0.25rem 0.5rem',
  borderRadius: 6,
  textDecoration: 'none',
}

const badgeStyle: React.CSSProperties = {
  background: 'rgba(99,102,241,0.1)',
  border: '1px solid rgba(99,102,241,0.2)',
  color: '#a5b4fc',
  fontSize: '0.75rem',
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: 20,
}

const dangerBtn: React.CSSProperties = {
  background: 'rgba(239,68,68,0.12)',
  border: '1px solid rgba(239,68,68,0.3)',
  color: '#fca5a5',
  cursor: 'pointer',
  fontSize: '0.875rem',
  padding: '0.5rem 1.25rem',
  borderRadius: 8,
}

const cancelBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#94a3b8',
  cursor: 'pointer',
  fontSize: '0.875rem',
  padding: '0.5rem 1.25rem',
  borderRadius: 8,
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.6)',
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
}

const modalStyle: React.CSSProperties = {
  background: '#1e293b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 16,
  padding: '2rem',
  maxWidth: 400,
  width: '100%',
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
