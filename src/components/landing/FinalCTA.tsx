import { useState } from 'react'
import { Link } from 'react-router-dom'
import AnimatedSection from './AnimatedSection'

const serif = "'Instrument Serif', Georgia, serif"
const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif"

export default function FinalCTA() {
  const [hover, setHover] = useState(false)

  return (
    <section
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '140px 48px',
        position: 'relative',
      }}
    >
      {/* Single restrained glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '30%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      <AnimatedSection style={{ position: 'relative', maxWidth: 1200, margin: '0 auto' }}>
        <h2
          style={{
            fontFamily: serif,
            fontSize: 'clamp(2.25rem, 4.5vw, 4rem)',
            fontWeight: 400,
            color: '#f1f5f9',
            lineHeight: 1.1,
            marginBottom: 20,
            letterSpacing: '-0.01em',
            maxWidth: 600,
          }}
        >
          Start learning languages
          <br />
          <em>the natural way.</em>
        </h2>
        <p
          style={{
            fontFamily: sans,
            fontSize: 16,
            color: '#64748b',
            maxWidth: 420,
            lineHeight: 1.7,
            marginBottom: 40,
          }}
        >
          Join thousands of learners using AI-powered stories to build real vocabulary that sticks.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link
            to="/login"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '16px 32px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              fontFamily: sans,
              fontWeight: 600,
              fontSize: 15,
              textDecoration: 'none',
              boxShadow: hover
                ? '0 4px 24px rgba(99,102,241,0.45)'
                : '0 2px 16px rgba(99,102,241,0.2)',
              transform: hover ? 'translateY(-1px)' : 'none',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            Start Learning Free
            <span style={{ fontSize: 18 }}>→</span>
          </Link>
          <span style={{ fontFamily: sans, fontSize: 13, color: '#475569' }}>
            No credit card required
          </span>
        </div>
      </AnimatedSection>
    </section>
  )
}
