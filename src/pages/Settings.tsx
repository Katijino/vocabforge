import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../stores/authStore'
import { useUserSettings, useUpdateSettings } from '../hooks/useUserSettings'
import { useUIStore } from '../stores/uiStore'

interface SettingsForm {
  learning_language: string
  review_time_window: number
  daily_review_limit: number
}

const LANGUAGES = [
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Mandarin', label: 'Mandarin Chinese' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Russian', label: 'Russian' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Other', label: 'Other' },
]

export default function Settings() {
  const user = useAuthStore((s) => s.user)
  const { data: settings } = useUserSettings(user?.id ?? '')
  const updateSettings = useUpdateSettings()
  const addToast = useUIStore((s) => s.addToast)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsForm>({
    defaultValues: {
      learning_language: 'Japanese',
      review_time_window: 7,
      daily_review_limit: 20,
    },
  })

  useEffect(() => {
    if (settings) {
      reset({
        learning_language: settings.learning_language,
        review_time_window: settings.review_time_window,
        daily_review_limit: settings.daily_review_limit,
      })
    }
  }, [settings, reset])

  if (!user) {
    return (
      <div style={authGuardStyle}>
        <p style={{ color: '#94a3b8' }}>Please sign in to access settings.</p>
        <Link to="/login" style={primaryBtn}>Sign In</Link>
      </div>
    )
  }

  const onSubmit = async (data: SettingsForm) => {
    setSaving(true)
    try {
      await updateSettings.mutateAsync({ userId: user.id, updates: data })
      addToast('Settings saved!', 'success')
    } catch {
      addToast('Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1.5rem', color: '#f1f5f9' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 2rem' }}>Settings</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 1.5rem', fontSize: '1rem', fontWeight: 600, color: '#94a3b8' }}>
            Learning Preferences
          </h2>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Language you're learning</label>
            <select {...register('learning_language', { required: true })} style={selectStyle}>
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
            {errors.learning_language && <p style={errorStyle}>Required</p>}
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Story time window (days)</label>
            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 0.5rem', lineHeight: 1.5 }}>
              Words added within this many days will be included in generated stories.
            </p>
            <select {...register('review_time_window', { valueAsNumber: true })} style={selectStyle}>
              {[7, 14, 30].map((n) => (
                <option key={n} value={n}>{n} days</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Daily review limit</label>
            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 0.5rem', lineHeight: 1.5 }}>
              Maximum cards shown per review session.
            </p>
            <input
              type="number"
              {...register('daily_review_limit', { valueAsNumber: true, min: 5, max: 200 })}
              min={5}
              max={200}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.7rem 2rem',
              borderRadius: 10,
              border: 'none',
              background: saving ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
            }}
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Account info */}
      <div style={{ ...cardStyle, marginTop: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600, color: '#94a3b8' }}>Account</h2>
        <div style={{ marginBottom: '0.5rem' }}>
          <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Email: </span>
          <span style={{ color: '#e2e8f0', fontSize: '0.875rem' }}>{user.email}</span>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <span style={{ color: '#64748b', fontSize: '0.875rem' }}>Plan: </span>
          <span style={{
            padding: '2px 8px',
            borderRadius: 6,
            fontSize: '0.75rem',
            fontWeight: 700,
            background: settings?.subscription_tier === 'pro' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
            color: settings?.subscription_tier === 'pro' ? '#a5b4fc' : '#94a3b8',
          }}>
            {settings?.subscription_tier === 'pro' ? 'Pro' : 'Free'}
          </span>
        </div>
        {settings?.subscription_tier !== 'pro' && (
          <Link to="/billing" style={primaryBtn}>Upgrade to Pro →</Link>
        )}
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

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.825rem',
  fontWeight: 600,
  color: '#94a3b8',
  marginBottom: '0.4rem',
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
  width: '100%',
  boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  background: '#1e293b',
  cursor: 'pointer',
}

const errorStyle: React.CSSProperties = {
  color: '#fca5a5',
  fontSize: '0.8rem',
  marginTop: '0.25rem',
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
  padding: '0.6rem 1.5rem',
  borderRadius: 8,
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  color: '#fff',
  fontWeight: 600,
  textDecoration: 'none',
  fontSize: '0.875rem',
  display: 'inline-block',
}
