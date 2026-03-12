import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useUserSettings } from '../hooks/useUserSettings'
import { useDueCards, useAddWord } from '../hooks/useWords'
import { useStories } from '../hooks/useStories'
import { useUsageLimits } from '../hooks/useUsageLimits'
import UsageMeter from '../components/UsageMeter'

export default function Home() {
  const user = useAuthStore((s) => s.user)
  const { data: settings } = useUserSettings(user?.id ?? '')
  const { data: dueCards = [] } = useDueCards(user?.id ?? '')
  const { data: stories = [] } = useStories(user?.id ?? '')
  const limits = useUsageLimits(user?.id ?? '')

  if (!user) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
        padding: '2rem',
        background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 560 }}>
          <div style={{ fontSize: 64, marginBottom: '1rem' }}>⚡</div>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, color: '#f1f5f9', margin: '0 0 1rem', lineHeight: 1.1 }}>
            Learn vocabulary<br />
            <span style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              through stories
            </span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: 1.7, margin: '0 0 2.5rem' }}>
            Import words from Anki, Duolingo, or CSV — then let AI weave them into engaging stories with built-in spaced repetition flashcards.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" style={{
              padding: '0.85rem 2rem',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
            }}>
              Get Started Free
            </Link>
            <Link to="/billing" style={{
              padding: '0.85rem 2rem',
              borderRadius: 12,
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#a5b4fc',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            }}>
              View Plans
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', maxWidth: 800, width: '100%' }}>
          {[
            { icon: '📖', title: 'AI Stories', desc: 'Gemini generates natural stories using your vocab words' },
            { icon: '🃏', title: 'SRS Flashcards', desc: 'SM-2 spaced repetition keeps words fresh' },
            { icon: '📥', title: 'Easy Import', desc: 'CSV, Anki .txt/.apkg, Duolingo sync' },
            { icon: '📱', title: 'PWA Ready', desc: 'Install on iOS and Android like a native app' },
          ].map((f) => (
            <div key={f.title} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14,
              padding: '1.25rem',
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>{f.title}</div>
              <div style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const latestStory = stories[0]

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem', color: '#f1f5f9' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.25rem' }}>
        Welcome back
      </h1>
      <p style={{ color: '#64748b', margin: '0 0 2rem', fontSize: '0.95rem' }}>
        {settings?.learning_language ? `Learning: ${settings.learning_language}` : 'Set your learning language in Settings'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Due for Review</span>
            <span style={{ fontSize: 20 }}>🃏</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: dueCards.length > 0 ? '#a5b4fc' : '#4b5563', lineHeight: 1 }}>
            {dueCards.length}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 8 }}>cards ready</div>
          {dueCards.length > 0 && (
            <Link to="/review" style={{
              display: 'inline-block',
              marginTop: '1rem',
              padding: '0.5rem 1.25rem',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}>
              Start Review →
            </Link>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Vocabulary</span>
            <span style={{ fontSize: 20 }}>📚</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#a5b4fc', lineHeight: 1 }}>
            {settings?.words_count ?? 0}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 8 }}>words total</div>
          {!limits.isPro && (
            <div style={{ marginTop: '1rem' }}>
              <UsageMeter used={limits.wordsCount} limit={limits.FREE_WORD_LIMIT} label="Word limit" />
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Stories</span>
            <span style={{ fontSize: 20 }}>✨</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#a5b4fc', lineHeight: 1 }}>
            {stories.length}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 8 }}>generated</div>
          {!limits.isPro && (
            <div style={{ marginTop: '1rem' }}>
              <UsageMeter used={limits.storiesUsed} limit={limits.FREE_STORY_LIMIT} label="This month" />
            </div>
          )}
        </div>
      </div>

      <QuickAddWord userId={user.id} language={settings?.learning_language ?? 'en'} />

      {latestStory && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.75rem' }}>
            Latest Story
          </h2>
          <Link to={`/stories/${latestStory.id}`} style={{ textDecoration: 'none' }}>
            <div style={{ ...cardStyle, cursor: 'pointer', transition: 'border-color 0.2s' }}>
              <div style={{ color: '#a5b4fc', fontWeight: 600, marginBottom: 8 }}>{latestStory.title}</div>
              <p style={{
                color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, margin: 0,
                overflow: 'hidden', textOverflow: 'ellipsis',
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
              }}>
                {latestStory.content.replace(/^Title:.*\n?/, '')}
              </p>
              <div style={{ color: '#6366f1', fontSize: '0.825rem', marginTop: 8 }}>Read story →</div>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}

function QuickAddWord({ userId, language }: { userId: string; language: string }) {
  const addWord = useAddWord()
  const limits = useUsageLimits(userId)
  const [word, setWord] = useState('')
  const [def, setDef] = useState('')

  const handleAdd = async () => {
    if (!word.trim() || !def.trim()) return
    if (!limits.canAddWord) return
    await addWord.mutateAsync({ user_id: userId, word: word.trim(), definition: def.trim(), language })
    setWord('')
    setDef('')
  }

  return (
    <div style={cardStyle}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 600, color: '#94a3b8' }}>
        Quick Add Word
      </h3>
      {!limits.canAddWord && (
        <p style={{ color: '#fca5a5', fontSize: '0.875rem', margin: '0 0 0.75rem' }}>
          Word limit reached. <Link to="/billing" style={{ color: '#a5b4fc' }}>Upgrade to Pro</Link> for unlimited words.
        </p>
      )}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Word"
          disabled={!limits.canAddWord}
          style={{ ...inputStyle, flex: '1 1 120px' }}
        />
        <input
          value={def}
          onChange={(e) => setDef(e.target.value)}
          placeholder="Definition"
          disabled={!limits.canAddWord}
          style={{ ...inputStyle, flex: '2 1 200px' }}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          disabled={addWord.isPending || !word.trim() || !def.trim() || !limits.canAddWord}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.9rem',
            opacity: (addWord.isPending || !limits.canAddWord) ? 0.5 : 1,
          }}
        >
          Add
        </button>
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
  padding: '1.5rem',
}

const inputStyle: React.CSSProperties = {
  padding: '0.65rem 0.85rem',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  color: '#f1f5f9',
  fontSize: '0.9rem',
  outline: 'none',
  fontFamily: 'inherit',
}
