import AnimatedSection from './AnimatedSection'

const serif = "'Instrument Serif', Georgia, serif"
const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif"

const features = [
  {
    label: 'AI',
    title: 'AI Story Generation',
    description:
      'Gemini AI creates natural, engaging stories using your exact vocabulary words. Every story is unique and tailored to your level.',
    span: 2,
  },
  {
    label: 'HOVER',
    title: 'Hover-to-Reveal',
    description:
      'Read in your target language with instant translations on hover. Build comprehension without breaking flow.',
    span: 1,
  },
  {
    label: 'TRACK',
    title: 'Vocabulary Tracking',
    description:
      'See which words you know well and which need more practice. Visual progress keeps you motivated.',
    span: 1,
  },
  {
    label: 'SRS',
    title: 'Smart Flashcards',
    description:
      'SM-2 spaced repetition algorithm schedules reviews at the perfect moment — right before you would forget.',
    span: 2,
  },
  {
    label: 'YOU',
    title: 'Personalized Learning',
    description:
      "Stories adapt to the words you're actually studying. No generic content — everything is built around your vocabulary.",
    span: 1,
  },
  {
    label: 'IMPORT',
    title: 'Flexible Import',
    description:
      'Bring your words from Anki, Duolingo, or CSV files. Your existing study material becomes your story foundation.',
    span: 1,
  },
]

export default function Features() {
  return (
    <section
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '100px 48px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <AnimatedSection style={{ marginBottom: 64 }}>
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
            Features
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
            Everything you need to learn faster
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
            Powerful tools designed to make vocabulary acquisition natural, efficient, and enjoyable.
          </p>
        </AnimatedSection>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 2,
          }}
        >
          {features.map((f, i) => (
            <AnimatedSection
              key={f.title}
              delay={i * 0.06}
              style={{ gridColumn: `span ${f.span}` }}
            >
              <div
                style={{
                  padding: '36px 32px',
                  background: 'rgba(255,255,255,0.015)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  height: '100%',
                  transition: 'background 0.3s',
                }}
              >
                <span
                  style={{
                    fontFamily: sans,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    color: '#6366f1',
                    display: 'block',
                    marginBottom: 16,
                  }}
                >
                  {f.label}
                </span>
                <h3
                  style={{
                    fontFamily: sans,
                    fontSize: 17,
                    fontWeight: 600,
                    color: '#f1f5f9',
                    marginBottom: 10,
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontFamily: sans,
                    fontSize: 14,
                    color: '#64748b',
                    lineHeight: 1.7,
                    maxWidth: 440,
                  }}
                >
                  {f.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
