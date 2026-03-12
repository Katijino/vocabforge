import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useDueCards } from '../hooks/useWords'
import { supabase } from '../lib/supabase'
import FlashcardDeck from '../components/FlashcardDeck'
import type { SrsCard, Word } from '../types/database'

type CardWithWord = SrsCard & { words: Word }

type Phase = 'idle' | 'session' | 'done'

export default function Review() {
  const user = useAuthStore((s) => s.user)
  const { data: dueCards = [], isLoading } = useDueCards(user?.id ?? '')
  const [phase, setPhase] = useState<Phase>('idle')
  const [sessionId, setSessionId] = useState('')
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null)

  if (!user) {
    return (
      <div style={authGuardStyle}>
        <p style={{ color: '#94a3b8' }}>Please sign in to review cards.</p>
        <Link to="/login" style={primaryBtn}>Sign In</Link>
      </div>
    )
  }

  const startSession = async () => {
    const { data, error } = await supabase
      .from('review_sessions')
      .insert({ user_id: user.id })
      .select()
      .single()
    if (error || !data) return
    setSessionId(data.id)
    setPhase('session')
  }

  const handleComplete = async (correct: number, total: number) => {
    setResult({ correct, total })
    setPhase('done')
    await supabase
      .from('review_sessions')
      .update({ finished_at: new Date().toISOString(), cards_reviewed: total, cards_correct: correct })
      .eq('id', sessionId)
  }

  const validCards = dueCards.filter((c): c is CardWithWord => !!c.words) as CardWithWord[]

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1.5rem', color: '#f1f5f9' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Review</h1>

      {phase === 'idle' && (
        <>
          {isLoading ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>Loading cards…</div>
          ) : validCards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ fontSize: 64, marginBottom: '1rem' }}>🎉</div>
              <h2 style={{ color: '#f1f5f9', fontWeight: 700, marginBottom: 8 }}>All caught up!</h2>
              <p style={{ color: '#64748b', marginBottom: '2rem' }}>No cards due for review right now. Come back later.</p>
              <Link to="/learn" style={primaryBtn}>Add more words</Link>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <div style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
                border: '1px solid rgba(99,102,241,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                fontSize: 40,
              }}>
                🃏
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>
                {validCards.length} card{validCards.length !== 1 ? 's' : ''} due
              </h2>
              <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem' }}>
                Review these words to keep them fresh in your memory.
              </p>
              <button onClick={startSession} style={{
                padding: '0.85rem 2.5rem',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
              }}>
                Start Session
              </button>
            </div>
          )}
        </>
      )}

      {phase === 'session' && sessionId && (
        <FlashcardDeck
          cards={validCards}
          userId={user.id}
          sessionId={sessionId}
          onComplete={handleComplete}
        />
      )}

      {phase === 'done' && result && (
        <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: 64, marginBottom: '1rem' }}>
            {result.correct === result.total ? '🏆' : result.correct >= result.total / 2 ? '👍' : '💪'}
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 8 }}>Session complete!</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem' }}>
            You got <strong style={{ color: '#a5b4fc' }}>{result.correct}</strong> out of{' '}
            <strong style={{ color: '#a5b4fc' }}>{result.total}</strong> correct (
            {Math.round((result.correct / result.total) * 100)}%)
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => { setPhase('idle'); setResult(null); setSessionId('') }}
              style={{
                padding: '0.75rem 2rem',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.95rem',
              }}
            >
              Review Again
            </button>
            <Link to="/" style={{
              padding: '0.75rem 2rem',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
            }}>
              Back to Home
            </Link>
          </div>
        </div>
      )}
    </div>
  )
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
