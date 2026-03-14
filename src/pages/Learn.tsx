import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useWords, useAddWord, useDeleteWord, useBulkDeleteWords, useDeleteAllWords } from '../hooks/useWords'
import { useDecks, useMoveWordsToDeck } from '../hooks/useDecks'
import { useUserSettings } from '../hooks/useUserSettings'
import { useUIStore } from '../stores/uiStore'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { useTheme, fontSerif } from '../hooks/useTheme'
import UpgradePrompt from '../components/UpgradePrompt'
import PageHeader from '../components/ui/PageHeader'
import FadeIn from '../components/ui/FadeIn'

export default function Learn() {
  const { isMobile } = useBreakpoint()
  const { t } = useTheme()
  const user = useAuthStore((s) => s.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const deckFilter = searchParams.get('deck')

  const { data: words = [], isLoading } = useWords(user?.id ?? '', deckFilter)
  const { data: decks = [] } = useDecks(user?.id ?? '')
  const { data: settings } = useUserSettings(user?.id ?? '')
  const addWord = useAddWord()
  const deleteWord = useDeleteWord()
  const bulkDelete = useBulkDeleteWords()
  const deleteAllWords = useDeleteAllWords()
  const moveWordsToDeck = useMoveWordsToDeck()

  const addToast = useUIStore((s) => s.addToast)

  const [newWord, setNewWord] = useState('')
  const [newDef, setNewDef] = useState('')
  const [newReading, setNewReading] = useState('')
  const [search, setSearch] = useState('')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmBulk, setConfirmBulk] = useState(false)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [moveToDeckId, setMoveToDeckId] = useState<string>('')

  if (!user) {
    return (
      <div style={authGuardStyle}>
        <p style={{ color: '#94a3b8' }}>Please sign in to manage your vocabulary.</p>
        <Link to="/login" style={primaryBtn}>Sign In</Link>
      </div>
    )
  }

  const activeDeck = deckFilter && deckFilter !== 'undecked' && deckFilter !== 'all'
    ? decks.find((d) => d.id === deckFilter)
    : null

  const handleDeckFilterChange = (value: string) => {
    if (!value || value === 'all') {
      setSearchParams({})
    } else {
      setSearchParams({ deck: value })
    }
    setSelected(new Set())
  }

  const handleAdd = async () => {
    if (!newWord.trim() || !newDef.trim()) return
    try {
      await addWord.mutateAsync({
        user_id: user.id,
        word: newWord.trim(),
        definition: newDef.trim(),
        reading: newReading.trim() || undefined,
        language: settings?.learning_language ?? 'en',
        list_id: deckFilter && deckFilter !== 'undecked' && deckFilter !== 'all' ? deckFilter : undefined,
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
      setSelected((s) => { const n = new Set(s); n.delete(id); return n })
      addToast('Word deleted', 'info')
    } catch {
      addToast('Failed to delete word', 'error')
    }
  }

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    try {
      await bulkDelete.mutateAsync({ wordIds: [...selected], userId: user.id })
      setSelected(new Set())
      setConfirmBulk(false)
      addToast(`Deleted ${selected.size} words`, 'info')
    } catch (e: unknown) {
      console.error('[handleBulkDelete] caught:', e)
      const msg = e instanceof Error ? e.message : JSON.stringify(e)
      addToast(msg, 'error')
    }
  }

  const handleDeleteAll = async () => {
    try {
      await deleteAllWords.mutateAsync({ userId: user.id })
      setConfirmDeleteAll(false)
      addToast('All words deleted', 'info')
    } catch {
      addToast('Failed to delete all words', 'error')
    }
  }

  const handleMoveSelected = async () => {
    if (selected.size === 0 || moveToDeckId === '') return
    try {
      const targetDeckId = moveToDeckId === 'none' ? null : moveToDeckId
      await moveWordsToDeck.mutateAsync({ wordIds: [...selected], deckId: targetDeckId, userId: user.id })
      setSelected(new Set())
      setMoveToDeckId('')
      addToast(`Moved ${selected.size} word${selected.size !== 1 ? 's' : ''} to deck`, 'success')
    } catch {
      addToast('Failed to move words', 'error')
    }
  }

  const filtered = words.filter((w) =>
    !search || w.word.toLowerCase().includes(search.toLowerCase()) || w.definition?.toLowerCase().includes(search.toLowerCase())
  )

  const allFilteredSelected = filtered.length > 0 && filtered.every((w) => selected.has(w.id))

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected((s) => {
        const n = new Set(s)
        filtered.forEach((w) => n.delete(w.id))
        return n
      })
    } else {
      setSelected((s) => {
        const n = new Set(s)
        filtered.forEach((w) => n.add(w.id))
        return n
      })
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '1.5rem 1rem 4rem' : '3rem 2rem 6rem', color: t.textPrimary }}>
      {showUpgrade && <UpgradePrompt reason="words" onClose={() => setShowUpgrade(false)} />}

      {/* Bulk delete confirm modal */}
      {confirmBulk && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: '#1e293b', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 16, padding: '2rem', maxWidth: 400, width: '100%',
          }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', fontWeight: 700 }}>
              Delete {selected.size} word{selected.size !== 1 ? 's' : ''}?
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
              This will permanently remove the selected words and their SRS progress. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDelete.isPending}
                style={{ ...dangerBtn, padding: '0.65rem 1.5rem', fontSize: '0.9rem', opacity: bulkDelete.isPending ? 0.6 : 1 }}
              >
                {bulkDelete.isPending ? 'Deleting…' : 'Delete'}
              </button>
              <button onClick={() => setConfirmBulk(false)} style={{ ...cancelBtn, padding: '0.65rem 1.5rem', fontSize: '0.9rem' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete all confirm modal */}
      {confirmDeleteAll && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: '#1e293b', border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 16, padding: '2rem', maxWidth: 400, width: '100%',
          }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', fontWeight: 700 }}>Delete ALL words?</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
              This will permanently delete every word in your vocabulary and all SRS progress. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleDeleteAll}
                disabled={deleteAllWords.isPending}
                style={{ ...dangerBtn, padding: '0.65rem 1.5rem', fontSize: '0.9rem', opacity: deleteAllWords.isPending ? 0.6 : 1 }}
              >
                {deleteAllWords.isPending ? 'Deleting…' : 'Delete Everything'}
              </button>
              <button onClick={() => setConfirmDeleteAll(false)} style={{ ...cancelBtn, padding: '0.65rem 1.5rem', fontSize: '0.9rem' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        label="LEARN"
        title="Vocabulary"
        subtitle={`${words.length} words · ${settings?.learning_language ?? 'Language not set'}`}
        action={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/import" style={secondaryBtn}>Import from file</Link>
            <button
              onClick={() => setConfirmDeleteAll(true)}
              style={{ ...dangerBtn, padding: '0.55rem 1rem', fontSize: '0.8rem' }}
            >
              Delete All
            </button>
          </div>
        }
      />

      {/* Deck filter */}
      {decks.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={labelStyle}>Filter by deck</label>
          <select
            value={deckFilter ?? 'all'}
            onChange={(e) => handleDeckFilterChange(e.target.value)}
            style={selectStyle}
          >
            <option value="all">All words</option>
            <option value="undecked">No deck</option>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Add word form */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600, color: '#94a3b8' }}>
          Add a word{activeDeck ? ` to ${activeDeck.name}` : ''}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 2fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>Word *</label>
            <input value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="e.g. 渋滞" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Definition *</label>
            <input
              value={newDef} onChange={(e) => setNewDef(e.target.value)}
              placeholder="e.g. traffic jam" style={inputStyle}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          {isMobile ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'end', gridColumn: '1 / -1' }}>
              <div>
                <label style={labelStyle}>Reading</label>
                <input value={newReading} onChange={(e) => setNewReading(e.target.value)} placeholder="e.g. じゅうたい" style={inputStyle} />
              </div>
              <button
                onClick={handleAdd}
                disabled={addWord.isPending || !newWord.trim() || !newDef.trim()}
                style={{
                  padding: '0.65rem 1.25rem', borderRadius: 8, border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
                  opacity: addWord.isPending ? 0.6 : 1, whiteSpace: 'nowrap',
                }}
              >
                {addWord.isPending ? '…' : '+ Add'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'contents' }}>
              <div>
                <label style={labelStyle}>Reading</label>
                <input value={newReading} onChange={(e) => setNewReading(e.target.value)} placeholder="e.g. じゅうたい" style={inputStyle} />
              </div>
              <button
                onClick={handleAdd}
                disabled={addWord.isPending || !newWord.trim() || !newDef.trim()}
                style={{
                  padding: '0.65rem 1.25rem', borderRadius: 8, border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
                  opacity: addWord.isPending ? 0.6 : 1, whiteSpace: 'nowrap',
                }}
              >
                {addWord.isPending ? '…' : '+ Add'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search + bulk actions */}
      <div style={{ margin: '1.5rem 0 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search words or definitions…"
          style={{ ...inputStyle, flex: 1, minWidth: isMobile ? 0 : 200, padding: '0.75rem 1rem' }}
        />
        {selected.size > 0 && (
          <>
            <button
              onClick={() => setConfirmBulk(true)}
              style={{ ...dangerBtn, padding: '0.65rem 1.25rem', fontSize: '0.875rem', whiteSpace: 'nowrap' }}
            >
              Delete {selected.size} selected
            </button>
            {decks.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  value={moveToDeckId}
                  onChange={(e) => setMoveToDeckId(e.target.value)}
                  style={{ ...selectStyle, minWidth: 140 }}
                >
                  <option value="">Move to deck…</option>
                  <option value="none">No deck</option>
                  {decks.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                {moveToDeckId !== '' && (
                  <button
                    onClick={handleMoveSelected}
                    disabled={moveWordsToDeck.isPending}
                    style={{ ...primaryBtnSmall, opacity: moveWordsToDeck.isPending ? 0.6 : 1 }}
                  >
                    Move
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Word list */}
      {isLoading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>
          {search ? 'No words match your search.' : 'No words yet. Add some above or import a file.'}
        </div>
      ) : (
        <>
          {/* Select all bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.6rem 1rem', marginBottom: '0.5rem',
            background: 'rgba(255,255,255,0.02)', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleSelectAll}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#6366f1' }}
            />
            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
              {allFilteredSelected ? 'Deselect all' : `Select all ${filtered.length} words`}
            </span>
            {selected.size > 0 && (
              <span style={{ color: '#a5b4fc', fontSize: '0.8rem', marginLeft: 'auto' }}>
                {selected.size} selected
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filtered.map((w) => {
              const isSelected = selected.has(w.id)
              return (
                <div key={w.id} style={{
                  background: isSelected ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isSelected ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 12,
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: '1rem',
                  transition: 'background 0.1s, border-color 0.1s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(w.id)}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#6366f1', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: fontSerif, color: '#e2e8f0', fontWeight: 400, fontSize: '1.1rem' }}>{w.word}</span>
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
                    {!isMobile && (
                      <div style={{ flexShrink: 0, fontSize: '0.75rem', color: '#475569' }}>
                        {new Date(w.created_at).toLocaleDateString()}
                      </div>
                    )}
                    {!isMobile && (
                      confirmDelete === w.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                          <button onClick={() => handleDelete(w.id)} style={dangerBtn}>Delete</button>
                          <button onClick={() => setConfirmDelete(null)} style={cancelBtn}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(w.id)} style={ghostBtn}>✕</button>
                      )
                    )}
                  </div>
                  {isMobile && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span style={{ fontSize: '0.75rem', color: '#475569' }}>
                        {new Date(w.created_at).toLocaleDateString()}
                      </span>
                      {confirmDelete === w.id ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleDelete(w.id)} style={dangerBtn}>Delete</button>
                          <button onClick={() => setConfirmDelete(null)} style={cancelBtn}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(w.id)} style={ghostBtn}>✕</button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--surface-border)',
  borderRadius: 16,
  padding: '1.5rem',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'inherit',
  opacity: 0.5,
  marginBottom: '0.3rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const inputStyle: React.CSSProperties = {
  padding: '0.65rem 0.85rem',
  borderRadius: 8,
  border: '1px solid var(--surface-border)',
  background: 'var(--surface)',
  color: 'inherit',
  fontSize: '0.9rem',
  outline: 'none',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  padding: '0.6rem 0.85rem',
  borderRadius: 8,
  border: '1px solid var(--surface-border)',
  background: 'var(--bg)',
  color: 'inherit',
  fontSize: '0.875rem',
  outline: 'none',
  fontFamily: 'inherit',
  cursor: 'pointer',
}

const authGuardStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', minHeight: '60vh', gap: '1rem',
}

const primaryBtn: React.CSSProperties = {
  padding: '0.65rem 1.75rem', borderRadius: 8,
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  color: '#fff', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem',
}

const primaryBtnSmall: React.CSSProperties = {
  padding: '0.5rem 1rem', borderRadius: 8, border: 'none',
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem',
  whiteSpace: 'nowrap',
}

const secondaryBtn: React.CSSProperties = {
  padding: '0.55rem 1.25rem', borderRadius: 8,
  border: '1px solid rgba(99,102,241,0.3)',
  color: '#a5b4fc', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500,
}

const ghostBtn: React.CSSProperties = {
  background: 'transparent', border: 'none', color: '#475569',
  cursor: 'pointer', fontSize: '0.9rem', padding: '0.25rem 0.5rem', borderRadius: 6,
}

const dangerBtn: React.CSSProperties = {
  background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
  color: '#fca5a5', cursor: 'pointer', fontSize: '0.8rem',
  padding: '0.3rem 0.7rem', borderRadius: 6,
}

const cancelBtn: React.CSSProperties = {
  background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
  color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem',
  padding: '0.3rem 0.7rem', borderRadius: 6,
}
