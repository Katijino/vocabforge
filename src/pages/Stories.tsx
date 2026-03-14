import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useStories, useGenerateStory, useDeleteStory } from '../hooks/useStories'
import { useDecks } from '../hooks/useDecks'
import { useUsageLimits } from '../hooks/useUsageLimits'
import { useUserSettings } from '../hooks/useUserSettings'
import { useUIStore } from '../stores/uiStore'
import { useTheme } from '../hooks/useTheme'
import UsageMeter from '../components/UsageMeter'
import UpgradePrompt from '../components/UpgradePrompt'
import PageHeader from '../components/ui/PageHeader'
import FadeIn from '../components/ui/FadeIn'

export default function Stories() {
  const user = useAuthStore((s) => s.user)
  const { data: stories = [], isLoading } = useStories(user?.id ?? '')
  const { data: settings } = useUserSettings(user?.id ?? '')
  const { data: decks = [] } = useDecks(user?.id ?? '')
  const generateStory = useGenerateStory()
  const deleteStory = useDeleteStory()
  const limits = useUsageLimits(user?.id ?? '')
  const addToast = useUIStore((s) => s.addToast)
  const { t } = useTheme()

  const [timeWindow, setTimeWindow] = useState<7 | 14 | 30>(7)
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

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

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return
    try {
      await deleteStory.mutateAsync({ storyId: confirmDeleteId, userId: user.id })
      addToast('Story deleted', 'info')
      setConfirmDeleteId(null)
    } catch {
      addToast('Failed to delete story', 'error')
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '3rem 2rem 6rem', color: t.textPrimary }}>
      {showUpgrade && <UpgradePrompt reason="stories" onClose={() => setShowUpgrade(false)} />}

      {/* Confirm delete modal */}
      {confirmDeleteId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
        }} onClick={() => setConfirmDeleteId(null)}>
          <div style={{
            background: t.navBg, border: `1px solid ${t.surfaceBorder}`,
            borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 360,
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', fontWeight: 700, color: t.textPrimary }}>
              Delete Story?
            </h2>
            <p style={{ color: t.textMuted, fontSize: '0.9rem', margin: '0 0 1.25rem' }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteStory.isPending}
                style={{
                  flex: 1, padding: '0.65rem', borderRadius: 8, border: 'none',
                  background: '#ef4444', color: '#fff', fontWeight: 700,
                  cursor: deleteStory.isPending ? 'not-allowed' : 'pointer',
                  opacity: deleteStory.isPending ? 0.6 : 1, fontSize: '0.9rem',
                }}
              >
                Delete
              </button>
              <button onClick={() => setConfirmDeleteId(null)} style={{
                padding: '0.65rem 1.25rem', borderRadius: 8,
                border: `1px solid ${t.surfaceBorder}`,
                background: 'transparent', color: t.textSecondary,
                cursor: 'pointer', fontSize: '0.9rem',
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        label="STORIES"
        title="Your Stories"
        subtitle="Stories generated from your recent vocabulary"
        action={
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
            <label style={{ display: 'block', color: t.textMuted, fontSize: '0.75rem', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
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
                    border: `1px solid ${timeWindow === w ? '#6366f1' : t.inputBorder}`,
                    background: timeWindow === w ? 'rgba(99,102,241,0.2)' : 'transparent',
                    color: timeWindow === w ? '#a5b4fc' : t.textMuted,
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
              <label style={{ display: 'block', color: t.textMuted, fontSize: '0.75rem', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Deck
              </label>
              <select
                value={selectedDeckId ?? ''}
                onChange={(e) => setSelectedDeckId(e.target.value || null)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: 6,
                  border: `1px solid ${t.inputBorder}`,
                  background: t.selectBg,
                  color: t.textPrimary,
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
        }
      />

      {!limits.isPro && (
        <div style={{ marginBottom: '1.5rem' }}>
          <UsageMeter used={limits.storiesUsed} limit={limits.FREE_STORY_LIMIT} label="Stories this month" />
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', color: t.textMuted, padding: '3rem' }}>Loading…</div>
      ) : stories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: 64, marginBottom: '1rem' }}>📖</div>
          <h2 style={{ color: t.textPrimary, fontWeight: 700, marginBottom: 8 }}>No stories yet</h2>
          <p style={{ color: t.textMuted }}>Generate your first story using words you've learned recently.</p>
        </div>
      ) : (
        <FadeIn delay={0.1}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {stories.map((story) => (
            <Link key={story.id} to={`/stories/${story.id}`} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: t.surface,
                  border: `1px solid ${t.surfaceBorder}`,
                  borderRadius: 12,
                  padding: '1.5rem 1.75rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, background 0.2s',
                  height: '100%',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'
                  e.currentTarget.style.background = t.surfaceHover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = t.surfaceBorder
                  e.currentTarget.style.background = t.surface
                }}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDeleteId(story.id) }}
                  style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: `1px solid ${t.surfaceBorder}`,
                    background: 'transparent',
                    color: t.textFaint,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ef4444'
                    e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = t.textFaint
                    e.currentTarget.style.borderColor = t.surfaceBorder
                  }}
                >
                  ✕
                </button>

                {/* Title + translation */}
                <div style={{ marginBottom: 8, paddingRight: '2rem' }}>
                  <div style={{ color: '#a5b4fc', fontWeight: 600, fontSize: '1rem' }}>
                    {story.title}
                  </div>
                  {story.title_translation && (
                    <div style={{ color: t.textMuted, fontSize: '0.8rem', marginTop: 2 }}>
                      {story.title_translation}
                    </div>
                  )}
                </div>

                {/* Date + language metadata */}
                <div style={{ color: t.textFaint, fontSize: '0.75rem', marginBottom: 8 }}>
                  {new Date(story.generated_at).toLocaleDateString()} · {story.language}
                </div>

                <p style={{
                  color: t.textMuted, fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 auto',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
                }}>
                  {story.content.replace(/^Title:.*\n?/, '').trim()}
                </p>

                {/* Bottom row: metadata + Read button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.75rem' }}>
                  <span style={{ color: t.textFaint, fontSize: '0.75rem' }}>
                    {story.word_ids.length} words · {story.time_window}d
                  </span>
                  <span style={{
                    padding: '0.3rem 0.85rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
                    background: 'rgba(99,102,241,0.15)', color: '#a5b4fc',
                    border: '1px solid rgba(99,102,241,0.25)',
                  }}>
                    Read →
                  </span>
                </div>
              </div>
            </Link>
          ))}
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
