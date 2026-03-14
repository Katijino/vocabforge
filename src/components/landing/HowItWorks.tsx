import AnimatedSection from './AnimatedSection'

const serif = "'Instrument Serif', Georgia, serif"
const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif"

const steps = [
  {
    number: '01',
    title: 'Choose a Language',
    description:
      'Pick from 15+ supported languages and import your existing vocabulary from Anki, Duolingo, or CSV.',
  },
  {
    number: '02',
    title: 'AI Generates Stories',
    description:
      'Our AI crafts engaging, natural stories using your exact vocabulary words at your level.',
  },
  {
    number: '03',
    title: 'Learn Through Context',
    description:
      'Read stories with hover-to-reveal translations. Words stick because you learn them in context.',
  },
  {
    number: '04',
    title: 'Reinforce with SRS',
    description:
      'Spaced repetition flashcards ensure you never forget. The SM-2 algorithm optimizes your review schedule.',
  },
]

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '100px 48px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <AnimatedSection style={{ marginBottom: 72 }}>
          <div
            style={{
              fontSize: 13,
              fontFamily: sans,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#6366f1',
              marginBottom: 16,
            }}
          >
            How It Works
          </div>
          <h2
            style={{
              fontFamily: serif,
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              fontWeight: 400,
              color: '#f1f5f9',
              marginBottom: 12,
            }}
          >
            Four steps to fluency
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
            A smarter approach combining AI storytelling with proven memory techniques.
          </p>
        </AnimatedSection>

        <div style={{ maxWidth: 720, position: 'relative' }}>
          {/* Connecting line */}
          <div
            style={{
              position: 'absolute',
              left: 20,
              top: 32,
              bottom: 32,
              width: 1,
              background:
                'linear-gradient(to bottom, rgba(99,102,241,0.3), rgba(99,102,241,0.06))',
            }}
          />

          {steps.map((step, i) => (
            <AnimatedSection key={step.number} delay={i * 0.1}>
              <div
                style={{
                  display: 'flex',
                  gap: 36,
                  padding: '28px 0',
                  position: 'relative',
                }}
              >
                {/* Number */}
                <div
                  style={{
                    flexShrink: 0,
                    width: 40,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: serif,
                      fontSize: 28,
                      color: 'rgba(99,102,241,0.4)',
                      fontWeight: 400,
                      position: 'relative',
                      zIndex: 1,
                      background: '#020617',
                      padding: '4px 0',
                      lineHeight: 1,
                    }}
                  >
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <h3
                    style={{
                      fontFamily: sans,
                      fontSize: 18,
                      fontWeight: 600,
                      color: '#f1f5f9',
                      marginBottom: 8,
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: sans,
                      fontSize: 15,
                      color: '#64748b',
                      lineHeight: 1.7,
                      maxWidth: 460,
                    }}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
