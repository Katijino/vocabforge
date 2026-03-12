import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useUserSettings } from '../hooks/useUserSettings'
import { supabase } from '../lib/supabase'

export default function Billing() {
  const user = useAuthStore((s) => s.user)
  const { data: settings } = useUserSettings(user?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isPro = settings?.subscription_tier === 'pro'

  const handleUpgrade = async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const res = await supabase.functions.invoke('create-checkout')
      if (res.error) throw res.error
      const { url } = res.data as { url: string }
      window.location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start checkout')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div style={authGuardStyle}>
        <p style={{ color: '#94a3b8' }}>Please sign in to manage billing.</p>
        <Link to="/login" style={primaryBtn}>Sign In</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem', color: '#f1f5f9' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Plans & Billing</h1>
      <p style={{ color: '#64748b', margin: '0 0 2.5rem', fontSize: '0.9rem' }}>
        Current plan: <strong style={{ color: isPro ? '#a5b4fc' : '#94a3b8' }}>{isPro ? 'Pro' : 'Free'}</strong>
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {/* Free plan */}
        <div style={{
          ...cardStyle,
          opacity: isPro ? 0.6 : 1,
          border: !isPro ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Free</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>$0</div>
            <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 4 }}>forever</div>
          </div>
          <ul style={featureList}>
            <li style={featureItem}><span style={{ color: '#6366f1' }}>✓</span> Unlimited vocabulary words</li>
            <li style={featureItem}><span style={{ color: '#6366f1' }}>✓</span> 5 AI stories per month</li>
            <li style={featureItem}><span style={{ color: '#6366f1' }}>✓</span> SRS flashcard review</li>
            <li style={featureItem}><span style={{ color: '#6366f1' }}>✓</span> CSV / Anki import</li>
            <li style={{ ...featureItem, color: '#475569' }}><span style={{ color: '#475569' }}>✕</span> Duolingo sync</li>
          </ul>
          {!isPro && (
            <div style={{ marginTop: '1.5rem', padding: '0.5rem 1rem', borderRadius: 8, background: 'rgba(99,102,241,0.1)', textAlign: 'center', color: '#a5b4fc', fontSize: '0.875rem', fontWeight: 600 }}>
              Current Plan
            </div>
          )}
        </div>

        {/* Pro plan */}
        <div style={{
          ...cardStyle,
          border: '1px solid rgba(99,102,241,0.4)',
          background: 'rgba(99,102,241,0.06)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 6,
            letterSpacing: '0.05em',
          }}>
            RECOMMENDED
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Pro</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>$1</div>
              <div style={{ color: '#64748b', fontSize: '0.8rem', textDecoration: 'line-through' }}>$10</div>
            </div>
            <div style={{ color: '#4ade80', fontSize: '0.8rem', marginTop: 4, fontWeight: 600 }}>first month — then $10/mo</div>
          </div>
          <ul style={featureList}>
            <li style={featureItem}><span style={{ color: '#6366f1' }}>✓</span> <strong>Unlimited</strong> vocabulary words</li>
            <li style={featureItem}><span style={{ color: '#6366f1' }}>✓</span> <strong>Unlimited</strong> AI stories</li>
            <li style={featureItem}><span style={{ color: '#6366f1' }}>✓</span> SRS flashcard review</li>
            <li style={featureItem}><span style={{ color: '#6366f1' }}>✓</span> CSV / Anki import</li>
            <li style={featureItem}><span style={{ color: '#6366f1' }}>✓</span> Duolingo sync</li>
            <li style={featureItem}><span style={{ color: '#6366f1' }}>✓</span> Priority support</li>
          </ul>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.6rem 0.85rem', color: '#fca5a5', fontSize: '0.825rem', margin: '1rem 0' }}>
              {error}
            </div>
          )}

          {isPro ? (
            <div style={{ marginTop: '1.5rem', padding: '0.5rem 1rem', borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', textAlign: 'center', color: '#4ade80', fontSize: '0.875rem', fontWeight: 600 }}>
              ✓ Active
            </div>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              style={{
                marginTop: '1.5rem',
                width: '100%',
                padding: '0.75rem',
                borderRadius: 10,
                border: 'none',
                background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem',
                boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
              }}
            >
              {loading ? 'Redirecting…' : 'Start for $1 →'}
            </button>
          )}
        </div>
      </div>

      {isPro && (
        <div style={{ ...cardStyle, marginTop: '2rem' }}>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 600, color: '#94a3b8' }}>
            Manage Subscription
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 1rem', lineHeight: 1.5 }}>
            To cancel your subscription, contact us or manage via the Stripe Customer Portal.
          </p>
          <p style={{ color: '#475569', fontSize: '0.8rem', margin: 0 }}>
            Questions? Email <span style={{ color: '#6366f1' }}>support@vocabforge.app</span>
          </p>
        </div>
      )}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
  padding: '1.75rem',
}

const featureList: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
}

const featureItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  color: '#cbd5e1',
  fontSize: '0.875rem',
  lineHeight: 1.4,
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
