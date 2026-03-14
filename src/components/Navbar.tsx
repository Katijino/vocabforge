import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useUsageLimits } from '../hooks/useUsageLimits'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { useTheme } from '../hooks/useTheme'
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
  const { isMobile } = useBreakpoint()
  const { theme, toggleTheme, t } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Sign out error:', error.message)
    navigate('/login')
  }

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <nav style={{
      background: t.navBg,
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
          <span style={{ color: t.textPrimary, fontWeight: 700, fontSize: '1.1rem' }}>VocabForge</span>
        </Link>

        {isMobile ? (
          /* Mobile: hamburger button */
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            style={{
              minWidth: 44,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: t.textSecondary,
              fontSize: '1.25rem',
              padding: '0.25rem',
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        ) : (
          <>
            {/* Desktop nav links */}
            {user && (
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                {NAV_LINKS.map((link) => {
                  const active = isActive(link.path)
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

            {/* Desktop right side */}
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
                    color: t.textSecondary,
                    textDecoration: 'none',
                  }}>
                    Settings
                  </Link>
                  <button
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    style={{
                      padding: '0.4rem 0.6rem',
                      borderRadius: 8,
                      border: `1px solid ${t.surfaceBorder}`,
                      background: 'transparent',
                      color: t.textSecondary,
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      lineHeight: 1,
                    }}
                  >
                    {theme === 'dark' ? '☀' : '🌙'}
                  </button>
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
          </>
        )}
      </div>

      {/* Mobile drawer */}
      {isMobile && menuOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              top: 60,
              zIndex: 98,
            }}
          />
          {/* Drawer panel */}
          <div style={{
            position: 'absolute',
            top: 60,
            left: 0,
            right: 0,
            background: t.navBg,
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(99,102,241,0.2)',
            padding: '1rem 1.5rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 99,
          }}>
            {user && (
              <>
                {NAV_LINKS.map((link) => {
                  const active = isActive(link.path)
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      style={{
                        padding: '0.75rem 1rem',
                        display: 'block',
                        fontSize: '0.95rem',
                        fontWeight: active ? 600 : 400,
                        color: active ? '#a5b4fc' : '#94a3b8',
                        background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                        borderRadius: 8,
                        textDecoration: 'none',
                      }}
                    >
                      {link.label}
                    </Link>
                  )
                })}
                <div style={{ height: 1, background: t.surfaceBorder, margin: '0.5rem 0' }} />
                <Link to="/billing" style={{
                  padding: '0.75rem 1rem',
                  display: 'block',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: isPro ? '#a5b4fc' : '#8b5cf6',
                  textDecoration: 'none',
                }}>
                  {isPro ? 'Manage Subscription' : 'Subscribe'}
                </Link>
                <Link to="/settings" style={{
                  padding: '0.75rem 1rem',
                  display: 'block',
                  fontSize: '0.95rem',
                  color: t.textSecondary,
                  textDecoration: 'none',
                }}>
                  Settings
                </Link>
                <button
                  onClick={toggleTheme}
                  style={{
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    color: t.textSecondary,
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                  }}
                >
                  {theme === 'dark' ? '☀ Light Mode' : '🌙 Dark Mode'}
                </button>
                <button
                  onClick={handleSignOut}
                  style={{
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    color: t.textSecondary,
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                  }}
                >
                  Sign Out
                </button>
              </>
            )}
            {!user && (
              <Link to="/login" style={{
                padding: '0.75rem 1rem',
                display: 'block',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#a5b4fc',
                textDecoration: 'none',
              }}>
                Sign In
              </Link>
            )}
          </div>
        </>
      )}
    </nav>
  )
}
