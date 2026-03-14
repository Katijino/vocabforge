import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const serif = "'Instrument Serif', Georgia, serif"
const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif"

const tickerChars =
  'あ   한   字   Ñ   Ж   ア   글   書   É   Щ   か   국   読   Ç   Д   い   어   語   Á   Б   う   학   習   Î   Ю   え   글   Ð   Ф   お   '

function FadeIn({
  delay = 0,
  children,
  style,
}: {
  delay?: number
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay * 1000)
    return () => clearTimeout(t)
  }, [delay])
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition:
          'opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export default function Hero() {
  const [btnHover, setBtnHover] = useState(false)

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Single restrained glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '15%',
          width: 900,
          height: 900,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      {/* Dot pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1200,
          margin: '0 auto',
          padding: '140px 48px 100px',
          display: 'flex',
          alignItems: 'center',
          gap: 80,
          width: '100%',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: text */}
        <div style={{ flex: '1 1 480px', maxWidth: 640 }}>
          <FadeIn>
            <div
              style={{
                fontSize: 13,
                fontFamily: sans,
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#6366f1',
                marginBottom: 28,
              }}
            >
              AI-Powered Language Learning
            </div>
          </FadeIn>

          <FadeIn delay={0.12}>
            <h1
              style={{
                fontFamily: serif,
                fontSize: 'clamp(2.75rem, 5vw, 4.5rem)',
                fontWeight: 400,
                lineHeight: 1.08,
                color: '#f1f5f9',
                marginBottom: 32,
                letterSpacing: '-0.01em',
              }}
            >
              Learn languages
              <br />
              through <em>stories</em>,
              <br />
              not memorization.
            </h1>
          </FadeIn>

          <FadeIn delay={0.24}>
            <p
              style={{
                fontFamily: sans,
                fontSize: 'clamp(1rem, 1.2vw, 1.15rem)',
                color: '#94a3b8',
                maxWidth: 460,
                lineHeight: 1.75,
                marginBottom: 44,
                fontWeight: 400,
              }}
            >
              Import your vocabulary, let AI weave it into engaging stories, then lock it in with
              spaced repetition flashcards.
            </p>
          </FadeIn>

          <FadeIn delay={0.36}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link
                to="/login"
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => setBtnHover(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '15px 30px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  fontFamily: sans,
                  fontWeight: 600,
                  fontSize: 15,
                  textDecoration: 'none',
                  boxShadow: btnHover
                    ? '0 4px 24px rgba(99,102,241,0.5)'
                    : '0 2px 16px rgba(99,102,241,0.25)',
                  transform: btnHover ? 'translateY(-1px)' : 'none',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                Start Learning Free
                <span style={{ fontSize: 18, transition: 'transform 0.2s' }}>→</span>
              </Link>
              <a
                href="#how-it-works"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '15px 30px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8',
                  fontFamily: sans,
                  fontWeight: 500,
                  fontSize: 15,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
              >
                See How It Works
              </a>
            </div>
          </FadeIn>
        </div>

        {/* Right: reading preview */}
        <FadeIn delay={0.5} style={{ flex: '1 1 340px', maxWidth: 420 }}>
          <div
            style={{
              borderLeft: '2px solid rgba(99,102,241,0.25)',
              paddingLeft: 32,
            }}
          >
            <p
              style={{
                fontSize: 'clamp(1.2rem, 1.8vw, 1.45rem)',
                lineHeight: 2,
                color: '#e2e8f0',
                marginBottom: 24,
                fontWeight: 400,
              }}
            >
              東京の小さな<span style={{ color: '#818cf8' }}>喫茶店</span>で、
              <br />
              彼女は<span style={{ color: '#818cf8' }}>静か</span>に
              <span style={{ color: '#818cf8' }}>本</span>を
              <br />
              読んでいた。
            </p>
            <div
              style={{
                width: 40,
                height: 1,
                background: 'rgba(255,255,255,0.1)',
                marginBottom: 20,
              }}
            />
            <p
              style={{
                fontFamily: sans,
                fontStyle: 'italic',
                fontSize: 15,
                color: '#64748b',
                lineHeight: 1.7,
              }}
            >
              In a small coffee shop in Tokyo,
              <br />
              she was quietly reading a book.
            </p>
          </div>
        </FadeIn>
      </div>

      {/* Language ticker */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          overflow: 'hidden',
          height: 48,
          display: 'flex',
          alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <div
          style={{
            display: 'flex',
            animation: 'ticker 80s linear infinite',
            whiteSpace: 'nowrap',
            fontSize: 16,
            color: 'rgba(255,255,255,0.06)',
            letterSpacing: '0.15em',
            fontFamily: sans,
            fontWeight: 300,
          }}
        >
          <span>{tickerChars}</span>
          <span>{tickerChars}</span>
          <span>{tickerChars}</span>
        </div>
      </div>
    </section>
  )
}
