import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useStory } from '../hooks/useStories'
import { useWords } from '../hooks/useWords'
import { useBreakpoint } from '../hooks/useBreakpoint'
import StoryViewer from '../components/StoryViewer'
import TranslationViewer from '../components/TranslationViewer'

export default function StoryPage() {
  const { isMobile, isTablet } = useBreakpoint()
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const { data: story, isLoading, error } = useStory(id ?? '')
  const { data: allWords = [] } = useWords(user?.id ?? '')
  const [hoveredSentenceIdx, setHoveredSentenceIdx] = useState<number | null>(null)

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', color: '#64748b', padding: '4rem', fontSize: '0.95rem' }}>
        Loading story…
      </div>
    )
  }

  if (error || !story) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
        <p>Story not found.</p>
        <Link to="/stories" style={{ color: '#6366f1' }}>← Back to stories</Link>
      </div>
    )
  }

  // Filter words that appear in this story's word_ids
  const storyWords = allWords.filter((w) => story.word_ids.includes(w.id))

  // Extract title from content
  const titleMatch = story.content.match(/^Title:\s*(.+)/m)
  const displayTitle = titleMatch ? titleMatch[1].trim() : story.title
  const bodyContent = story.content.replace(/^Title:.*\n?/, '').trim()
  const translation = story.content_translation ?? null

  return (
    <div style={{ maxWidth: isTablet ? '100%' : translation ? 1400 : 760, margin: '0 auto', padding: isMobile ? '1.25rem 1rem 3rem' : '2.5rem 1.5rem 5rem', color: '#f1f5f9' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/stories" style={{ color: '#64748b', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          ← Back to Stories
        </Link>
      </div>

      <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 0.5rem', lineHeight: 1.2 }}>
        {displayTitle}
      </h1>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
          {new Date(story.generated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>·</span>
        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
          {story.time_window}-day window
        </span>
        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>·</span>
        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
          {story.language}
        </span>
      </div>

      {/* Story content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: translation && !isTablet ? '1fr 1fr' : '1fr',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        {/* Left: original */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '2rem' }}>
          {translation && (
            <div style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              Original · {story.language}
            </div>
          )}
          <StoryViewer
            content={bodyContent}
            vocabWords={storyWords}
            onSentenceHover={translation ? setHoveredSentenceIdx : undefined}
            hoveredSentenceIdx={hoveredSentenceIdx}
          />
        </div>

        {/* Right: translation (only if available) */}
        {translation && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '2rem' }}>
            <div style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              English Translation · <span style={{ opacity: 0.6 }}>{isMobile ? 'tap to reveal' : 'hover to reveal'}</span>
            </div>
            <TranslationViewer
              translation={translation}
              hoveredSentenceIdx={hoveredSentenceIdx}
            />
          </div>
        )}
      </div>

      {/* Vocab list */}
      {storyWords.length > 0 && (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#94a3b8', marginBottom: '1rem' }}>
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
                <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{w.word}</span>
                {w.reading && <span style={{ color: '#64748b', marginLeft: 6, fontSize: '0.8rem' }}>{w.reading}</span>}
                <span style={{ color: '#475569', marginLeft: 8 }}>—</span>
                <span style={{ color: '#94a3b8', marginLeft: 8 }}>{w.definition}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
