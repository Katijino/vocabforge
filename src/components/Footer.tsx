import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(15,23,42,0.6)',
      padding: '3rem 1.5rem 2rem',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '2rem',
      }}>
        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: 13 }}>⚡</span>
            </div>
            <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1rem' }}>VocabForge</span>
          </div>
          <p style={{ color: '#475569', fontSize: '0.8rem', lineHeight: 1.6, margin: 0, maxWidth: 220 }}>
            Master vocabulary through spaced repetition and AI-generated stories.
          </p>
        </div>

        {/* Product */}
        <div>
          <h4 style={headingStyle}>Product</h4>
          <ul style={listStyle}>
            <li><Link to="/" style={linkStyle}>My Decks</Link></li>
            <li><Link to="/learn" style={linkStyle}>Words</Link></li>
            <li><Link to="/stories" style={linkStyle}>Stories</Link></li>
            <li><Link to="/import" style={linkStyle}>Import</Link></li>
          </ul>
        </div>

        {/* Account */}
        <div>
          <h4 style={headingStyle}>Account</h4>
          <ul style={listStyle}>
            <li><Link to="/billing" style={linkStyle}>Plans & Billing</Link></li>
            <li><Link to="/settings" style={linkStyle}>Settings</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 style={headingStyle}>Support</h4>
          <ul style={listStyle}>
            <li><span style={{ ...linkStyle, cursor: 'default' }}>support@vocabforge.app</span></li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        maxWidth: 1100,
        margin: '2rem auto 0',
        paddingTop: '1.25rem',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <span style={{ color: '#374151', fontSize: '0.75rem' }}>
          &copy; {year} VocabForge. All rights reserved.
        </span>
        <div style={{ display: 'flex', gap: '1.25rem' }}>
          <span style={{ color: '#374151', fontSize: '0.75rem' }}>Privacy</span>
          <span style={{ color: '#374151', fontSize: '0.75rem' }}>Terms</span>
        </div>
      </div>
    </footer>
  )
}

const headingStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '0.7rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  margin: '0 0 0.75rem',
}

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
}

const linkStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: '0.825rem',
  textDecoration: 'none',
  transition: 'color 0.15s',
}
