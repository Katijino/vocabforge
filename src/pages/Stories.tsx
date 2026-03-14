import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useStories, useGenerateStory } from '../hooks/useStories'
import { useDecks } from '../hooks/useDecks'
import { useUsageLimits } from '../hooks/useUsageLimits'
import { useUserSettings } from '../hooks/useUserSettings'
import { useUIStore } from '../stores/uiStore'
import UsageMeter from '../components/UsageMeter'
import UpgradePrompt from '../components/UpgradePrompt'

export default function Stories() {
  const user = useAuthStore((s) => s.user)
  const { data: stories = [], isLoading } = useStories(user?.id ?? '')
  const { data: settings } = useUserSettings(user?.id ?? '')
  const { data: decks = [] } = useDecks(user?.id ?? '')
  const generateStory = useGenerateStory()
  const limits = useUsageLimits(user?.id ?? '')
  const addToast = useUIStore((s) => s.addToast)

  const [timeWindow, setTimeWindow] = useState<7 | 14 | 30>(7)
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  if (!user) {
    return (
      <div style={authGuardStyle}>
        <p style={{ color: '#94a3b8' }}>Please sign in to generate stories.</p>
        <Link to="/login" style={primaryBtn}>Sign In</Link>
      </div>
    )
  }

  const handleGenerate = async () => {
    if (!limits.canGenerateStory) { setShowUpgrade(true); return }
    try {
      const result = await generateStory.mutateAsync({
        userId: user.id,
        timeWindow,
        language: settings?.learning_language ?? 'en',
        deckId: selectedDeckId,
      })
      addToast(result.cached ? 'Loaded cached story' : 'Story generated!', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to generate story', 'error')
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem', color: '#f1f5f9' }}>
      {showUpgrade && <UpgradePrompt reason="stories" onClose={() => setShowUpgrade(false)} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.25rem' }}>AI Stories</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
            Stories generated from your recent vocabulary
          </p>
        </div>

        {/* Generate panel */}
        <div style={{
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 14,
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <div>
            <label style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Time window
            </label>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {([7, 14, 30] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setTimeWindow(w)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 6,
                    border: `1px solid ${timeWindow === w ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                    background: timeWindow === w ? 'rgba(99,102,241,0.2)' : 'transparent',
                    color: timeWindow === w ? '#a5b4fc' : '#64748b',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: timeWindow === w ? 600 : 400,
                  }}
                >
                  {w}d
                </button>
              ))}
            </div>
          </div>
          {decks.length > 0 && (
            <div>
              <label style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Deck
              </label>
              <select
                value={selectedDeckId ?? ''}
                onChange={(e) => setSelectedDeckId(e.target.value || null)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(15,23,42,0.9)',
                  color: '#f1f5f9',
                  fontSize: '0.8rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <option value="">All words</option>
                {decks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          )}
          <button
            onClick={handleGenerate}
            disabled={generateStory.isPending}
            style={{
              padding: '0.65rem 1.5rem',
              borderRadius: 10,
              border: 'none',
              background: generateStory.isPending ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              fontWeight: 700,
              cursor: generateStory.isPending ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {generateStory.isPending ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                Generating…
              </>
            ) : '✨ Generate Story'}
          </button>
        </div>
      </div>

      {!limits.isPro && (
        <div style={{ marginBottom: '1.5rem' }}>
          <UsageMeter used={limits.storiesUsed} limit={limits.FREE_STORY_LIMIT} label="Stories this month" />
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>Loading…</div>
      ) : stories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: 64, marginBottom: '1rem' }}>📖</div>
          <h2 style={{ color: '#f1f5f9', fontWeight: 700, marginBottom: 8 }}>No stories yet</h2>
          <p style={{ color: '#64748b' }}>Generate your first story using words you've learned recently.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {stories.map((story) => (
            <Link key={story.id} to={`/stories/${story.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14,
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'border-color 0.2s, background 0.2s',
                height: '100%',
                boxSizing: 'border-box',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'
                e.currentTarget.style.background = 'rgba(99,102,241,0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
              }}
              >
                <div style={{ color: '#a5b4fc', fontWeight: 600, marginBottom: 8, fontSize: '1rem' }}>
                  {story.title}
                </div>
                <p style={{
                  color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 1rem',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
                }}>
                  {story.content.replace(/^Title:.*\n?/, '').trim()}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569', fontSize: '0.75rem' }}>
                    {story.word_ids.length} words · {story.time_window}d window
                  </span>
                  <span style={{ color: '#475569', fontSize: '0.75rem' }}>
                    {new Date(story.generated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
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
