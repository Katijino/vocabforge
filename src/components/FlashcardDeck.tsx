import { useState, useRef } from 'react'
import WordCard from './WordCard'
import { applyGrade } from '../lib/sm2'
import { useGradeCard } from '../hooks/useWords'
import type { SrsCard, Word } from '../types/database'

type CardWithWord = SrsCard & { words: Word }

const GRADES: Array<{ value: 0 | 2 | 3 | 5; label: string; color: string; bg: string }> = [
  { value: 0, label: 'Again', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  { value: 2, label: 'Hard', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { value: 3, label: 'Good', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  { value: 5, label: 'Easy', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
]

interface FlashcardDeckProps {
  cards: CardWithWord[]
  userId: string
  sessionId: string
  onComplete: (correct: number, total: number) => void
}

export default function FlashcardDeck({ cards, userId, sessionId, onComplete }: FlashcardDeckProps) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [correct, setCorrect] = useState(0)
  const gradingRef = useRef(false)
  const gradeCard = useGradeCard()

  const card = cards[index]
  const total = cards.length

  const handleGrade = async (grade: 0 | 2 | 3 | 5) => {
    if (!card || gradingRef.current) return
    gradingRef.current = true
    try {
      const newState = applyGrade(
        {
          ease_factor: card.ease_factor,
          interval_days: card.interval_days,
          repetitions: card.repetitions,
          due_date: card.due_date,
        },
        grade
      )

      const isFirstLearn = card.repetitions === 0 && grade >= 3
      await gradeCard.mutateAsync({
        cardId: card.id,
        userId,
        wordId: card.word_id,
        sessionId,
        grade,
        newState,
        learnedAt: isFirstLearn ? new Date().toISOString() : undefined,
      })

      if (grade >= 3) setCorrect((c) => c + 1)

      const next = index + 1
      if (next >= total) {
        onComplete(grade >= 3 ? correct + 1 : correct, total)
      } else {
        setFlipped(false)
        setTimeout(() => setIndex(next), 50)
      }
    } finally {
      gradingRef.current = false
    }
  }

  if (!card) return null

  const progress = ((index) / total) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
      {/* Progress */}
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{index + 1} of {total}</span>
          <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{correct} correct</span>
        </div>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Card */}
      <WordCard word={card.words} flipped={flipped} onClick={() => setFlipped((f) => !f)} />

      {/* Grade buttons — only show when flipped */}
      {flipped && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {GRADES.map((g) => (
            <button
              key={g.value}
              onClick={() => handleGrade(g.value)}
              disabled={gradeCard.isPending}
              style={{
                padding: '0.6rem 1.5rem',
                borderRadius: 10,
                border: `1px solid ${g.color}44`,
                background: g.bg,
                color: g.color,
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'transform 0.1s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}

      {!flipped && (
        <p style={{ color: '#475569', fontSize: '0.875rem' }}>Tap the card to reveal the answer</p>
      )}
    </div>
  )
}
