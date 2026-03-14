import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { useDecks, useCreateDeck, useUpdateDeck, useDeleteDeck, useDeckStats } from '../hooks/useDecks'
import { useUserSettings } from '../hooks/useUserSettings'
import { useGenerateStory } from '../hooks/useStories'
import { useUIStore } from '../stores/uiStore'
import { supabase } from '../lib/supabase'
import type { WordList } from '../types/database'
import LandingPage from '../components/landing/LandingPage'

// ─── Deck card ────────────────────────────────────────────────────────────────

interface DeckCardProps {
  deck: WordList
  userId: string
  language: string
  onEdit: (deck: WordList) => void
  onDelete: (deck: WordList) => void
}

function DeckCard({ deck, userId, language, onEdit, onDelete }: DeckCardProps) {
  const { isMobile } = useBreakpoint()
  const { data: stats } = useDeckStats(deck.id)
  const generateStory = useGenerateStory()
  const addToast = useUIStore((s) => s.addToast)
  const navigate = useNavigate()
  const [generatingStory, setGeneratingStory] = useState(false)

  const dueCount = stats?.due_count ?? 0
  const newCount = stats?.new_count ?? 0
  const totalReady = dueCount + newCount

  const handleStory = async () => {
    setGeneratingStory(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data: logs } = await supabase
        .from('review_logs')
        .select('word_id, words!inner(list_id)')
        .eq('user_id', userId)
        .gte('reviewed_at', `${today}T00:00:00`)

      type LogRow = { word_id: string; words: { list_id: string | null } | null }
      const wordIds = [
        ...new Set(
          ((logs ?? []) as LogRow[])
            .filter((l) => l.words?.list_id === deck.id)
            .map((l) => l.word_id)
        ),
      ]

      if (wordIds.length === 0) {
        addToast('Review some cards first to generate a story', 'info')
        return
      }

      const result = await generateStory.mutateAsync({ userId, wordIds, language, deckId: deck.id })
      navigate(`/stories/${result.id}`)
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Failed to generate story', 'error')
    } finally {
      setGeneratingStory(false)
    }
  }

  return (
    <div style={deckCardStyle}>
      {/* Header */}
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>
          {deck.name}
        </h3>
        {deck.description && (
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.825rem', lineHeight: 1.4 }}>
            {deck.description}
          </p>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={statBadge(dueCount > 0 ? 'due' : 'empty')}>
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{dueCount}</span>
          <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>due</span>
        </div>
        <div style={statBadge(newCount > 0 ? 'new' : 'empty')}>
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{newCount}</span>
          <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>new</span>
        </div>
      </div>

      {/* Cards due today */}
      <div style={{
        fontSize: '0.875rem',
        fontWeight: 600,
        color: totalReady > 0 ? '#a5b4fc' : '#475569',
        marginBottom: '1.25rem',
      }}>
        Cards due today: {totalReady}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Link
          to={totalReady > 0 ? `/review?deck=${deck.id}` : '#'}
          onClick={(e) => totalReady === 0 && e.preventDefault()}
          style={{
            ...actionBtn,
            background: totalReady > 0 ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.04)',
            color: totalReady > 0 ? '#fff' : '#475569',
            cursor: totalReady > 0 ? 'pointer' : 'default',
            boxShadow: totalReady > 0 ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
          }}
        >
          Review {totalReady > 0 ? `(${totalReady})` : ''}
        </Link>
        <button
          onClick={handleStory}
          disabled={generatingStory}
          style={{
            ...actionBtn,
            border: '1px solid rgba(139,92,246,0.3)',
            color: '#a78bfa',
            cursor: generatingStory ? 'wait' : 'pointer',
            opacity: generatingStory ? 0.6 : 1,
          }}
        >
          {generatingStory ? 'Generating…' : 'Story'}
        </button>
        <button onClick={() => onEdit(deck)} style={{ ...iconBtnStyle(isMobile) }}>✏️</button>
        <button onClick={() => onDelete(deck)} style={{ ...iconBtnStyle(isMobile) }}>🗑️</button>
      </div>
    </div>
  )
}

// ─── Add deck card ────────────────────────────────────────────────────────────

function AddDeckCard({ onAdd }: { onAdd: () => void }) {
  return (
    <button onClick={onAdd} style={{
      ...deckCardStyle,
      border: '2px dashed rgba(99,102,241,0.25)',
      background: 'rgba(99,102,241,0.03)',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      minHeight: 180,
      width: '100%',
      textAlign: 'center',
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: 'rgba(99,102,241,0.12)',
        border: '1px solid rgba(99,102,241,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
      }}>+</div>
      <span style={{ color: '#6366f1', fontWeight: 600, fontSize: '0.95rem' }}>Add Deck</span>
    </button>
  )
}

// ─── Edit/Create modal ─────────────────────────────────────────────────────────

interface DeckModalProps {
  deck: Partial<WordList> | null
  onSave: (name: string, description: string) => void
  onClose: () => void
}

function DeckModal({ deck, onSave, onClose }: DeckModalProps) {
  const [name, setName] = useState(deck?.name ?? '')
  const [desc, setDesc] = useState(deck?.description ?? '')
  const isNew = !deck?.id

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }} onClick={onClose}>
      <div style={{
        background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 420,
      }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>
          {isNew ? 'New Deck' : 'Edit Deck'}
        </h2>
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Deck name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Core Vocabulary"
            autoFocus
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={labelStyle}>Description (optional)</label>
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="e.g. N5 vocabulary list"
            style={inputStyle}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => name.trim() && onSave(name.trim(), desc.trim())}
            disabled={!name.trim()}
            style={{
              flex: 1,
              padding: '0.65rem',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              fontWeight: 700,
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              opacity: name.trim() ? 1 : 0.5,
              fontSize: '0.9rem',
            }}
          >
            {isNew ? 'Create' : 'Save'}
          </button>
          <button onClick={onClose} style={{
            padding: '0.65rem 1.25rem',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Home() {
  const { isMobile } = useBreakpoint()
  const user = useAuthStore((s) => s.user)
  const { data: settings } = useUserSettings(user?.id ?? '')
  const { data: decks = [] } = useDecks(user?.id ?? '')
  const createDeck = useCreateDeck()
  const updateDeck = useUpdateDeck()
  const deleteDeck = useDeleteDeck()
  const addToast = useUIStore((s) => s.addToast)

  const [editingDeck, setEditingDeck] = useState<Partial<WordList> | null>(null)
  const [showModal, setShowModal] = useState(false)

  if (!user) return <LandingPage />

  const language = settings?.learning_language ?? 'en'
  const username = user.email?.split('@')[0] ?? 'there'

  const openCreate = () => {
    setEditingDeck(null)
    setShowModal(true)
  }

  const openEdit = (deck: WordList) => {
    setEditingDeck(deck)
    setShowModal(true)
  }

  const handleSave = async (name: string, description: string) => {
    try {
      if (editingDeck?.id) {
        await updateDeck.mutateAsync({ deckId: editingDeck.id, userId: user.id, updates: { name, description } })
        addToast('Deck updated', 'success')
      } else {
        await createDeck.mutateAsync({ user_id: user.id, name, description, language })
        addToast('Deck created', 'success')
      }
    } catch {
      addToast('Something went wrong', 'error')
    }
    setShowModal(false)
  }

  const handleDelete = async (deck: WordList) => {
    if (!confirm(`Delete "${deck.name}"? Words will be unassigned but not deleted.`)) return
    try {
      await deleteDeck.mutateAsync({ deckId: deck.id, userId: user.id })
      addToast('Deck deleted', 'success')
    } catch {
      addToast('Failed to delete deck', 'error')
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '1.25rem 1rem' : '2rem 1.5rem', color: '#f1f5f9' }}>
      {showModal && (
        <DeckModal
          deck={editingDeck}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.2rem' }}>My Decks</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
            Hi {username} · {language !== 'en' ? `Learning: ${language}` : 'Set your language in Settings'}
          </p>
        </div>
      </div>

      {decks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: 56, marginBottom: '1rem' }}>📚</div>
          <h2 style={{ color: '#f1f5f9', fontWeight: 700, marginBottom: 8 }}>No decks yet</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem' }}>
            Create a deck to start organizing your vocabulary.
          </p>
          <button
            onClick={openCreate}
            style={{
              padding: '0.8rem 2rem',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.95rem',
            }}
          >
            Create Your First Deck
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
        }}>
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              userId={user.id}
              language={language}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
          <AddDeckCard onAdd={openCreate} />
        </div>
      )}
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const deckCardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16,
  padding: '1.5rem',
}

function statBadge(type: 'due' | 'new' | 'empty'): React.CSSProperties {
  const colors: Record<string, { bg: string; color: string }> = {
    due: { bg: 'rgba(99,102,241,0.15)', color: '#a5b4fc' },
    new: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80' },
    empty: { bg: 'rgba(255,255,255,0.03)', color: '#374151' },
  }
  const c = colors[type]
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0.4rem 0.85rem',
    borderRadius: 8,
    background: c.bg,
    color: c.color,
    minWidth: 52,
    gap: 2,
  }
}

const actionBtn: React.CSSProperties = {
  padding: '0.4rem 0.85rem',
  borderRadius: 7,
  border: 'none',
  background: 'transparent',
  fontSize: '0.825rem',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  fontFamily: 'inherit',
}

function iconBtnStyle(isMobile: boolean): React.CSSProperties {
  return {
    padding: isMobile ? '0.6rem 0.75rem' : '0.4rem 0.5rem',
    borderRadius: 7,
    border: '1px solid rgba(255,255,255,0.07)',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: isMobile ? '1rem' : '0.875rem',
    lineHeight: 1,
    fontFamily: 'inherit',
  }
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
  width: '100%',
  boxSizing: 'border-box',
  padding: '0.6rem 0.85rem',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  color: '#f1f5f9',
  fontSize: '0.9rem',
  outline: 'none',
  fontFamily: 'inherit',
}
