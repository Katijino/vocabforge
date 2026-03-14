import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useUsageLimits } from '../hooks/useUsageLimits'
import { supabase } from '../lib/supabase'

const NAV_LINKS = [
  { path: '/', label: 'My Decks' },
  { path: '/learn', label: 'Words' },
  { path: '/stories', label: 'Stories' },
  { path: '/import', label: 'Import' },
]

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { isPro } = useUsageLimits(user?.id ?? '')

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Sign out error:', error.message)
    navigate('/login')
  }

  return (
    <nav style={{
      background: 'rgba(15,23,42,0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(99,102,241,0.2)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '0 1.5rem',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: 16 }}>⚡</span>
          </div>
          <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.1rem' }}>VocabForge</span>
        </Link>

        {/* Nav links */}
        {user && (
          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            {NAV_LINKS.map((link) => {
              const active = link.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(link.path)
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                    fontWeight: active ? 600 : 400,
                    color: active ? '#a5b4fc' : '#94a3b8',
                    background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'color 0.15s, background 0.15s',
                  }}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {user ? (
            <>
              <Link to="/billing" style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 8,
                fontSize: '0.825rem',
                fontWeight: 600,
                color: isPro ? '#a5b4fc' : '#8b5cf6',
                background: isPro ? 'transparent' : 'rgba(99,102,241,0.1)',
                border: isPro ? 'none' : '1px solid rgba(99,102,241,0.25)',
                textDecoration: 'none',
                transition: 'color 0.15s, background 0.15s',
              }}>
                {isPro ? 'Manage Subscription' : 'Subscribe'}
              </Link>
              <Link to="/settings" style={{
                padding: '0.4rem 0.85rem',
                borderRadius: 8,
                fontSize: '0.875rem',
                color: '#94a3b8',
                textDecoration: 'none',
              }}>
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 8,
                  border: '1px solid rgba(99,102,241,0.3)',
                  background: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" style={{
              padding: '0.45rem 1rem',
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
