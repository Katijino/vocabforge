import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { useTheme } from '../hooks/useTheme'
import PageHeader from '../components/ui/PageHeader'
import FadeIn from '../components/ui/FadeIn'
import { useDueCards, useNewCards, useNewCardsLearnedToday } from '../hooks/useWords'
import { useDecks } from '../hooks/useDecks'
import { useUserSettings } from '../hooks/useUserSettings'
import { supabase } from '../lib/supabase'
import FlashcardDeck from '../components/FlashcardDeck'
import type { SrsCard, Word } from '../types/database'

type CardWithWord = SrsCard & { words: Word }

type Phase = 'idle' | 'learning' | 'reviewing' | 'done'

export default function Review() {
  const { isMobile } = useBreakpoint()
  const { t } = useTheme()
  const user = useAuthStore((s) => s.user)
  const [searchParams] = useSearchParams()
  const deckId = searchParams.get('deck') ?? undefined

  const { data: decks = [] } = useDecks(user?.id ?? '')
  const deck = deckId ? decks.find((d) => d.id === deckId) : undefined
  const { data: settings } = useUserSettings(user?.id ?? '')
  const dailyLimit = settings?.daily_review_limit ?? 20

  const { data: dueCards = [], isLoading: dueLoading } = useDueCards(user?.id ?? '', deckId)
  const { data: newCards = [], isLoading: newLoading } = useNewCards(user?.id ?? '', deckId, dailyLimit)
  const { data: learnedToday = 0 } = useNewCardsLearnedToday(user?.id ?? '')

  const [phase, setPhase] = useState<Phase>('idle')
  const [sessionId, setSessionId] = useState('')
  const [result, setResult] = useState<{ correct: number; total: number; mode: 'learn' | 'review' } | null>(null)

  if (!user) {
    return (
      <div style={authGuardStyle}>
        <p style={{ color: '#94a3b8' }}>Please sign in to review cards.</p>
        <Link to="/login" style={primaryBtn}>Sign In</Link>
      </div>
    )
  }

  const startSession = async (mode: 'learning' | 'reviewing') => {
    const { data, error } = await supabase
      .from('review_sessions')
      .insert({ user_id: user.id })
      .select()
      .single()
    if (error || !data) return
    setSessionId(data.id)
    setPhase(mode)
  }

  const handleComplete = async (correct: number, total: number) => {
    const mode = phase === 'learning' ? 'learn' : 'review'
    setResult({ correct, total, mode })
    setPhase('done')
    await supabase
      .from('review_sessions')
      .update({ finished_at: new Date().toISOString(), cards_reviewed: total, cards_correct: correct })
      .eq('id', sessionId)
  }

  const validDueCards = dueCards.filter((c): c is CardWithWord => !!c.words) as CardWithWord[]
  const validNewCards = newCards.filter((c): c is CardWithWord => !!c.words) as CardWithWord[]
  const remainingToLearn = Math.max(0, dailyLimit - learnedToday)
  const learnable = validNewCards.slice(0, remainingToLearn)
  const title = deck ? `Reviewing: ${deck.name}` : 'Review'
  const isLoading = dueLoading || newLoading

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: isMobile ? '1.5rem 1rem 4rem' : '3rem 2rem 6rem', color: t.textPrimary }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <Link to="/" style={{ color: t.textMuted, textDecoration: 'none', fontSize: '0.875rem' }}>← Decks</Link>
      </div>
      <PageHeader label="REVIEW" title={deck ? `Reviewing: ${deck.name}` : 'Flashcard Review'} />

      {phase === 'idle' && (
        <>
          {isLoading ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>Loading cards…</div>
          ) : (
            <FadeIn delay={0.05}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Learn section */}
              <div style={sectionCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: 28 }}>🌱</span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Learn New Cards</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>
                      {learnedToday} learned today · {remainingToLearn} remaining of {dailyLimit} daily goal
                    </p>
                  </div>
                </div>
                {learnable.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                    {validNewCards.length === 0
                      ? 'No new cards to learn. Import some vocabulary to get started!'
                      : `Daily goal reached! Come back tomorrow for ${Math.min(validNewCards.length, dailyLimit)} more.`}
                  </p>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                      {learnable.length} card{learnable.length !== 1 ? 's' : ''} ready
                    </span>
                    <button onClick={() => startSession('learning')} style={learnBtn}>
                      Start Learning
                    </button>
                  </div>
                )}
              </div>

              {/* Review section */}
              <div style={sectionCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: 28 }}>🃏</span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Review Due Cards</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>
                      SRS-scheduled cards that need reinforcement
                    </p>
                  </div>
                </div>
                {validDueCards.length === 0 ? (
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                    🎉 All caught up! No cards due for review right now.
                  </p>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                      {validDueCards.length} card{validDueCards.length !== 1 ? 's' : ''} due
                    </span>
                    <button onClick={() => startSession('reviewing')} style={reviewBtn}>
                      Start Review
                    </button>
                  </div>
                )}
              </div>
            </div>
            </FadeIn>
          )}
        </>
      )}

      {phase === 'learning' && sessionId && (
        <FlashcardDeck
          cards={learnable}
          userId={user.id}
          sessionId={sessionId}
          onComplete={handleComplete}
        />
      )}

      {phase === 'reviewing' && sessionId && (
        <FlashcardDeck
          cards={validDueCards}
          userId={user.id}
          sessionId={sessionId}
          onComplete={handleComplete}
        />
      )}

      {phase === 'done' && result && (
        <FadeIn>
        <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: 64, marginBottom: '1rem' }}>
            {result.correct === result.total ? '🏆' : result.correct >= result.total / 2 ? '👍' : '💪'}
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 8 }}>
            {result.mode === 'learn' ? 'Learning complete!' : 'Session complete!'}
          </h2>
          <div style={{ borderLeft: '2px solid rgba(99,102,241,0.25)', paddingLeft: 24, textAlign: 'left', display: 'inline-block', marginBottom: '2rem' }}>
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
              You got <strong style={{ color: '#a5b4fc' }}>{result.correct}</strong> out of{' '}
              <strong style={{ color: '#a5b4fc' }}>{result.total}</strong> correct (
              {Math.round((result.correct / result.total) * 100)}%)
            </p>
          </div>
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
              Back to Overview
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
              Back to Decks
            </Link>
          </div>
        </div>
        </FadeIn>
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

const sectionCard: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--surface-border)',
  borderRadius: 16,
  padding: '1.5rem',
}

const learnBtn: React.CSSProperties = {
  padding: '0.6rem 1.5rem',
  borderRadius: 10,
  border: 'none',
  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: '0.9rem',
}

const reviewBtn: React.CSSProperties = {
  padding: '0.6rem 1.5rem',
  borderRadius: 10,
  border: 'none',
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: '0.9rem',
}
