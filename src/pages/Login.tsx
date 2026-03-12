import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabase'

interface SignInFields {
  email: string
  password: string
}

interface SignUpFields extends SignInFields {
  display_name: string
}

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [serverError, setServerError] = useState('')
  const [signUpSuccess, setSignUpSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<SignUpFields>()

  const switchMode = (m: 'signin' | 'signup') => {
    setMode(m)
    setServerError('')
    setSignUpSuccess(false)
    reset()
  }

  const onSubmit = async (data: SignUpFields) => {
    setServerError('')
    setLoading(true)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password })
        if (error) throw error
        navigate('/')
      } else {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: { data: { display_name: data.display_name } },
        })
        if (error) throw error
        setSignUpSuccess(true)
      }
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)',
      padding: '2rem',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 20,
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        padding: '2.5rem',
        width: '100%',
        maxWidth: 400,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem',
            fontSize: 26,
            boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
          }}>
            ⚡
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 0.25rem' }}>
            VocabForge
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
            Learn vocabulary with AI-powered stories
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 10,
          padding: 3,
          marginBottom: '1.75rem',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: 8,
                border: 'none',
                background: mode === m ? 'rgba(99,102,241,0.3)' : 'transparent',
                color: mode === m ? '#a5b4fc' : '#64748b',
                fontWeight: mode === m ? 600 : 400,
                cursor: 'pointer',
                fontSize: '0.875rem',
                transition: 'all 0.15s',
              }}
            >
              {m === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {signUpSuccess ? (
          <div style={{
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 12,
            padding: '1.25rem',
            textAlign: 'center',
            color: '#4ade80',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✉️</div>
            <p style={{ fontWeight: 600, margin: '0 0 0.25rem' }}>Check your email!</p>
            <p style={{ fontSize: '0.875rem', color: '#86efac', margin: 0 }}>
              We sent a confirmation link to finish creating your account.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {mode === 'signup' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Display Name</label>
                <input
                  {...register('display_name', { required: 'Display name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
                  placeholder="Your name"
                  style={inputStyle}
                />
                {errors.display_name && <p style={errorStyle}>{errors.display_name.message}</p>}
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Email</label>
              <input
                {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
                type="email"
                placeholder="you@example.com"
                style={inputStyle}
              />
              {errors.email && <p style={errorStyle}>{errors.email.message}</p>}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Password</label>
              <input
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'At least 6 characters' } })}
                type="password"
                placeholder="••••••••"
                style={inputStyle}
              />
              {errors.password && <p style={errorStyle}>{errors.password.message}</p>}
            </div>

            {serverError && (
              <div style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8,
                padding: '0.75rem',
                color: '#fca5a5',
                fontSize: '0.875rem',
                marginBottom: '1rem',
              }}>
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 10,
                border: 'none',
                background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.15s',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.35)',
              }}
            >
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/" style={{ color: '#475569', fontSize: '0.85rem', textDecoration: 'none' }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.825rem',
  fontWeight: 600,
  color: '#94a3b8',
  marginBottom: '0.35rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.65rem 0.85rem',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  color: '#f1f5f9',
  fontSize: '0.95rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const errorStyle: React.CSSProperties = {
  color: '#fca5a5',
  fontSize: '0.8rem',
  marginTop: '0.25rem',
}
