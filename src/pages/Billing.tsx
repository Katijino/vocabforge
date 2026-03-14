import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useUserSettings } from '../hooks/useUserSettings'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { useTheme } from '../hooks/useTheme'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/ui/PageHeader'

function isValidRedirectUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.stripe.com')
  } catch {
    return false
  }
}

export default function Billing() {
  const { isMobile } = useBreakpoint()
  const { t } = useTheme()
  const user = useAuthStore((s) => s.user)
  const { data: settings } = useUserSettings(user?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
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
      if (!isValidRedirectUrl(url)) throw new Error('Invalid checkout URL received')
      window.location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start checkout')
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    if (!user) return
    setPortalLoading(true)
    setError('')
    try {
      const res = await supabase.functions.invoke('create-portal-session')
      if (res.error) throw res.error
      const { url } = res.data as { url: string }
      if (!isValidRedirectUrl(url)) throw new Error('Invalid portal URL received')
      window.location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to open billing portal')
    } finally {
      setPortalLoading(false)
    }
  }

  const handleSyncSubscription = async () => {
    if (!user) return
    setSyncLoading(true)
    setError('')
    try {
      const res = await supabase.functions.invoke('sync-subscription')
      if (res.error) throw new Error(res.error.message ?? 'Edge function request failed')
      const data = res.data as { synced?: boolean; error?: string }
      if (data.error) throw new Error(data.error)
      // Refetch settings by reloading
      window.location.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to sync subscription')
      setSyncLoading(false)
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
    <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '1.5rem 1rem 4rem' : '3rem 2rem 6rem', color: t.textPrimary }}>
      <PageHeader
        label="BILLING"
        title="Subscription"
        subtitle={`Current plan: ${isPro ? 'Pro' : 'Free'}`}
      />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
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
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>$10</div>
            <div style={{ color: '#4ade80', fontSize: '0.8rem', marginTop: 4, fontWeight: 600 }}>7-day free trial, then $10/mo</div>
          </div>
          <div style={{ borderLeft: '2px solid rgba(99,102,241,0.3)', paddingLeft: 20 }}>
            <ul style={featureList}>
              <li style={featureItem}><span style={{ color: '#6366f1' }}>✓</span> <strong>Unlimited</strong> vocabulary words</li>
              <li style={featureItem}><span style={{ color: '#6366f1' }}>✓</span> <strong>Unlimited</strong> AI stories</li>
              <li style={featureItem}><span style={{ color: '#6366f1' }}>✓</span> SRS flashcard review</li>
              <li style={featureItem}><span style={{ color: '#6366f1' }}>✓</span> CSV / Anki import</li>
              <li style={featureItem}><span style={{ color: '#6366f1' }}>✓</span> Duolingo sync</li>
              <li style={featureItem}><span style={{ color: '#6366f1' }}>✓</span> Priority support</li>
            </ul>
          </div>

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
              {loading ? 'Redirecting…' : 'Start Free Trial →'}
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
            Update your payment method, change plans, or cancel your subscription.
          </p>
          <button
            onClick={handleManageSubscription}
            disabled={portalLoading}
            style={{
              padding: '0.65rem 1.5rem',
              borderRadius: 10,
              border: '1px solid rgba(99,102,241,0.3)',
              background: portalLoading ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)',
              color: '#a5b4fc',
              fontWeight: 600,
              cursor: portalLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
            }}
          >
            {portalLoading ? 'Redirecting…' : 'Manage Subscription →'}
          </button>
          <p style={{ color: '#475569', fontSize: '0.8rem', margin: '1rem 0 0' }}>
            Questions? Email <span style={{ color: '#6366f1' }}>support@vocabforge.app</span>
          </p>
        </div>
      )}

      {/* Sync subscription — useful if webhook events were missed */}
      <div style={{ ...cardStyle, marginTop: '2rem' }}>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 600, color: '#94a3b8' }}>
          Subscription not reflecting correctly?
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0 0 1rem', lineHeight: 1.5 }}>
          If your subscription status seems out of date, sync it with Stripe.
        </p>
        <button
          onClick={handleSyncSubscription}
          disabled={syncLoading}
          style={{
            padding: '0.65rem 1.5rem',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            background: syncLoading ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
            color: '#94a3b8',
            fontWeight: 600,
            cursor: syncLoading ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
          }}
        >
          {syncLoading ? 'Syncing…' : 'Sync Subscription'}
        </button>
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--surface-border)',
  borderRadius: 12,
  padding: '1.75rem 2rem',
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
