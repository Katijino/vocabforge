import AnimatedSection from './AnimatedSection'

const serif = "'Instrument Serif', Georgia, serif"
const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif"

const stats = [
  { value: '10,000+', label: 'Active Learners' },
  { value: '15+', label: 'Languages' },
  { value: '50,000+', label: 'Stories Generated' },
  { value: '4.9/5', label: 'User Rating' },
]

const testimonials = [
  {
    name: 'Sarah K.',
    role: 'Japanese Learner',
    content:
      'VocabForge completely changed how I study. Reading stories with my own vocabulary makes the words actually stick.',
    initials: 'SK',
    featured: true,
  },
  {
    name: 'Marco R.',
    role: 'Spanish Learner',
    content:
      'The spaced repetition combined with AI stories is genius. I went from forgetting words daily to retaining 90% after a month.',
    initials: 'MR',
    featured: false,
  },
  {
    name: 'Yuki T.',
    role: 'Korean Learner',
    content:
      "I imported my entire Anki deck and within minutes had stories tailored to my exact vocabulary level. It's incredible.",
    initials: 'YT',
    featured: false,
  },
]

export default function SocialProof() {
  return (
    <section style={{ position: 'relative' }}>
      {/* Stats strip */}
      <AnimatedSection>
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '40px 48px',
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '24px 48px',
            }}
          >
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 12,
                  flex: '0 0 auto',
                }}
              >
                <span
                  style={{
                    fontFamily: serif,
                    fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                    fontWeight: 400,
                    color: '#f1f5f9',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {stat.value}
                </span>
                <span
                  style={{
                    fontFamily: sans,
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#64748b',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {stat.label}
                </span>
                {i < stats.length - 1 && (
                  <span
                    style={{
                      color: 'rgba(255,255,255,0.08)',
                      fontSize: 20,
                      marginLeft: 36,
                      fontWeight: 300,
                    }}
                  >
                    /
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Testimonials */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 48px' }}>
        <AnimatedSection style={{ marginBottom: 56 }}>
          <h2
            style={{
              fontFamily: serif,
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              fontWeight: 400,
              color: '#f1f5f9',
              marginBottom: 12,
            }}
          >
            Loved by language learners
          </h2>
          <p
            style={{
              fontFamily: sans,
              color: '#64748b',
              fontSize: 16,
              maxWidth: 480,
              lineHeight: 1.6,
            }}
          >
            Join thousands mastering new languages through context, not cramming.
          </p>
        </AnimatedSection>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
          }}
        >
          {/* Featured testimonial */}
          <AnimatedSection delay={0.1} style={{ gridRow: 'span 2' }}>
            <div
              style={{
                height: '100%',
                borderLeft: '2px solid rgba(99,102,241,0.3)',
                paddingLeft: 32,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <p
                style={{
                  fontFamily: serif,
                  fontSize: 'clamp(1.25rem, 2vw, 1.6rem)',
                  fontStyle: 'italic',
                  color: '#cbd5e1',
                  lineHeight: 1.6,
                  marginBottom: 32,
                }}
              >
                "{testimonials[0].content}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: sans,
                  }}
                >
                  {testimonials[0].initials}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#e2e8f0',
                      fontFamily: sans,
                    }}
                  >
                    {testimonials[0].name}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: '#64748b',
                      fontFamily: sans,
                    }}
                  >
                    {testimonials[0].role}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
                  {[...Array(5)].map((_, j) => (
                    <span key={j} style={{ color: '#fbbf24', fontSize: 13 }}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Two smaller testimonials */}
          {testimonials.slice(1).map((t, i) => (
            <AnimatedSection key={t.name} delay={0.2 + i * 0.1}>
              <div
                style={{
                  padding: 28,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <p
                  style={{
                    fontFamily: sans,
                    fontSize: 15,
                    color: '#94a3b8',
                    lineHeight: 1.7,
                    marginBottom: 24,
                    flex: 1,
                  }}
                >
                  "{t.content}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(99,102,241,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#818cf8',
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: sans,
                    }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#cbd5e1',
                        fontFamily: sans,
                      }}
                    >
                      {t.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', fontFamily: sans }}>
                      {t.role}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                    {[...Array(5)].map((_, j) => (
                      <span key={j} style={{ color: '#fbbf24', fontSize: 11 }}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
