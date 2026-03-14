import { useNavigate } from 'react-router-dom'

interface UpgradePromptProps {
  reason: 'words' | 'stories'
  onClose: () => void
}

const MESSAGES = {
  words: {
    title: 'Go Pro',
    body: 'Upgrade to Pro for unlimited AI stories, Duolingo sync, and priority support.',
  },
  stories: {
    title: 'Story limit reached',
    body: 'Free plan includes 5 AI stories per month. Upgrade to Pro for unlimited stories.',
  },
}

export default function UpgradePrompt({ reason, onClose }: UpgradePromptProps) {
  const navigate = useNavigate()
  const msg = MESSAGES[reason]

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
    }}
    onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(30,41,59,0.95)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 16,
          padding: '2rem',
          maxWidth: 420,
          width: '100%',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: 24,
          }}>
            ⚡
          </div>
          <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.25rem', margin: '0 0 0.5rem' }}>
            {msg.title}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
            {msg.body}
          </p>
        </div>

        <div style={{
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 12,
          padding: '1rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ color: '#a5b4fc', fontWeight: 700, fontSize: '1.5rem', textAlign: 'center' }}>
            $10 / month
          </div>
          <ul style={{ margin: '0.75rem 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {['Unlimited vocabulary words', 'Unlimited AI stories', 'Duolingo sync (Pro only)', 'Priority support'].map((f) => (
              <li key={f} style={{ display: 'flex', gap: 8, color: '#cbd5e1', fontSize: '0.875rem' }}>
                <span style={{ color: '#6366f1' }}>✓</span> {f}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => { navigate('/billing'); onClose() }}
            style={{
              flex: 1,
              padding: '0.75rem',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.95rem',
            }}
          >
            Upgrade to Pro
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.95rem',
            }}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  )
}
