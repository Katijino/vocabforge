import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useStory } from '../hooks/useStories'
import { useWordsByIds } from '../hooks/useWords'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { useTheme } from '../hooks/useTheme'
import StoryViewer from '../components/StoryViewer'
import TranslationViewer from '../components/TranslationViewer'
import FadeIn from '../components/ui/FadeIn'

export default function StoryPage() {
  const { isMobile, isTablet } = useBreakpoint()
  const { t } = useTheme()
  const { id } = useParams<{ id: string }>()
  const { data: story, isLoading, error } = useStory(id ?? '')
  const { data: storyWords = [] } = useWordsByIds(story?.word_ids ?? [])
  const [hoveredSentenceIdx, setHoveredSentenceIdx] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', color: t.textMuted, padding: '4rem', fontSize: '0.95rem' }}>
        Loading story…
      </div>
    )
  }

  if (error || !story) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: t.textMuted }}>
        <p>Story not found.</p>
        <Link to="/stories" style={{ color: '#6366f1' }}>← Back to stories</Link>
      </div>
    )
  }

  const titleMatch = story.content.match(/^Title:\s*(.+)/m)
  const displayTitle = titleMatch ? titleMatch[1].trim() : story.title
  const bodyContent = story.content.replace(/^Title:.*\n?/, '').trim()
  const translation = story.content_translation ?? null
  const hasTranslation = !!translation && !isTablet

  return (
    <FadeIn>
    <div style={{ maxWidth: hasTranslation ? 1200 : 760, margin: '0 auto', padding: isMobile ? '1.25rem 1rem 3rem' : '2.5rem 1.5rem 5rem', color: t.textPrimary }}>

      {/* Back + metadata */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/stories" style={{ color: t.textMuted, fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          ← Back to Stories
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: t.textMuted, fontSize: '0.8rem' }}>
          {new Date(story.generated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
        <span style={{ color: t.textMuted, fontSize: '0.8rem' }}>·</span>
        <span style={{ color: t.textMuted, fontSize: '0.8rem' }}>{story.time_window}-day window</span>
        <span style={{ color: t.textMuted, fontSize: '0.8rem' }}>·</span>
        <span style={{ color: t.textMuted, fontSize: '0.8rem' }}>{story.language}</span>
      </div>

      {/* Main story card */}
      <div style={{
        background: t.surface,
        border: `1px solid ${t.surfaceBorder}`,
        borderRadius: 16,
        marginBottom: '2rem',
        overflow: 'hidden',
      }}>
        {/* Title row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          borderBottom: `1px solid ${t.surfaceBorder}`,
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', minWidth: 0 }}>
            <span style={{ color: t.textPrimary, fontWeight: 600, fontSize: '1rem' }}>{displayTitle}</span>
            {story.title_translation && (
              <>
                <span style={{ color: t.textMuted }}>—</span>
                <span style={{ color: t.textMuted, fontSize: '0.95rem' }}>{story.title_translation}</span>
              </>
            )}
          </div>
          {translation && (
            <button
              onClick={() => setShowAll((s) => !s)}
              style={{
                padding: '0.3rem 0.9rem',
                borderRadius: 6,
                border: `1px solid ${t.surfaceBorder}`,
                background: showAll ? 'rgba(99,102,241,0.12)' : 'transparent',
                color: showAll ? '#a5b4fc' : t.textSecondary,
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              {showAll ? 'Hide all' : 'Show all'}
            </button>
          )}
        </div>

        {/* Story columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: hasTranslation ? '1fr 1fr' : '1fr',
        }}>
          {/* Original */}
          <div style={{
            padding: isMobile ? '1.25rem 1rem' : '1.75rem 1.5rem',
            borderRight: hasTranslation ? `1px solid ${t.surfaceBorder}` : 'none',
          }}>
            <div style={{
              color: t.textMuted,
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '1.25rem',
            }}>
              Original
            </div>
            <StoryViewer
              content={bodyContent}
              vocabWords={storyWords}
              onSentenceHover={translation ? setHoveredSentenceIdx : undefined}
              hoveredSentenceIdx={hoveredSentenceIdx}
            />
          </div>

          {/* Translation */}
          {hasTranslation && (
            <div style={{ padding: '1.75rem 1.5rem' }}>
              <div style={{
                color: t.textMuted,
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '1.25rem',
              }}>
                Translation
              </div>
              <TranslationViewer
                translation={translation}
                hoveredSentenceIdx={hoveredSentenceIdx}
                showAll={showAll}
              />
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: '0.7rem 1.5rem',
          borderTop: `1px solid ${t.surfaceBorder}`,
          color: t.textFaint,
          fontSize: '0.75rem',
          display: 'flex',
          gap: '0.35rem',
          alignItems: 'center',
        }}>
          {translation && !showAll && <span>Hover lines to reveal ·</span>}
          <span>Vocabulary words are <span style={{ color: '#818cf8' }}>highlighted</span></span>
        </div>
      </div>

      {/* Vocab list */}
      {storyWords.length > 0 && (
        <div>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.textSecondary, marginBottom: '1rem' }}>
            Vocabulary in this story ({storyWords.length} words)
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {storyWords.map((w) => (
              <div key={w.id} style={{
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 8,
                padding: '0.4rem 0.85rem',
                fontSize: '0.875rem',
              }}>
                <span style={{ color: '#818cf8', fontWeight: 600 }}>{w.word}</span>
                {w.reading && <span style={{ color: '#64748b', marginLeft: 6, fontSize: '0.8rem' }}>{w.reading}</span>}
                <span style={{ color: '#475569', marginLeft: 8 }}>—</span>
                <span style={{ color: '#94a3b8', marginLeft: 8 }}>{w.definition}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </FadeIn>
  )
}
