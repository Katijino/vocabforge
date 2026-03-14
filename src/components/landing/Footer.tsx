import { Link } from 'react-router-dom'

const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif"

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '32px 48px',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          fontFamily: sans,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>VocabForge</span>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 13, color: '#475569' }}>
          <a
            href="#how-it-works"
            style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.15s' }}
          >
            How It Works
          </a>
          <a
            href="#pricing"
            style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.15s' }}
          >
            Pricing
          </a>
          <Link
            to="/login"
            style={{ textDecoration: 'none', color: 'inherit', transition: 'color 0.15s' }}
          >
            Sign In
          </Link>
        </nav>

        <span style={{ fontSize: 12, color: '#334155' }}>
          &copy; {new Date().getFullYear()} VocabForge
        </span>
      </div>
    </footer>
  )
}
