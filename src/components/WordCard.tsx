import type { Word } from '../types/database'
import { fontSerif, fontSans } from '../hooks/useTheme'

interface WordCardProps {
  word: Word
  flipped: boolean
  onClick: () => void
}

export default function WordCard({ word, flipped, onClick }: WordCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        perspective: 1000,
        width: '100%',
        maxWidth: 520,
        height: 300,
        cursor: 'pointer',
      }}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>
        {/* Front */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 20,
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          gap: '0.5rem',
        }}>
          <div style={{ color: '#64748b', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
            {word.language}
          </div>
          <div style={{ fontFamily: fontSerif, color: '#f1f5f9', fontSize: '2.25rem', fontWeight: 400, textAlign: 'center', lineHeight: 1.2 }}>
            {word.word}
          </div>
          {word.reading && (
            <div style={{ fontFamily: fontSerif, color: '#94a3b8', fontSize: '1rem', fontStyle: 'italic' }}>
              {word.reading}
            </div>
          )}
          <div style={{ color: '#475569', fontSize: '0.8rem', marginTop: '1rem' }}>
            Tap to reveal
          </div>
        </div>

        {/* Back */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 20,
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          gap: '0.75rem',
        }}>
          <div style={{ color: '#a5b4fc', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Definition
          </div>
          <div style={{ fontFamily: fontSans, color: '#f1f5f9', fontSize: '1.3rem', fontWeight: 600, textAlign: 'center', lineHeight: 1.5 }}>
            {word.definition ?? '—'}
          </div>
          {word.example && (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '0.75rem 1rem',
              color: '#94a3b8',
              fontSize: '0.875rem',
              fontStyle: 'italic',
              lineHeight: 1.6,
              textAlign: 'center',
            }}>
              "{word.example}"
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
