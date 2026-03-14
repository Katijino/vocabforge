import { useState } from 'react'
import AnimatedSection from './AnimatedSection'

const serif = "'Instrument Serif', Georgia, serif"
const sans = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif"

interface StoryLine {
  foreign: string
  translation: string
  vocabHighlights: string[]
}

const storyLines: StoryLine[] = [
  {
    foreign: '東京の小さな喫茶店で、彼女は静かに本を読んでいた。',
    translation: 'In a small coffee shop in Tokyo, she was quietly reading a book.',
    vocabHighlights: ['喫茶店', '静か', '本'],
  },
  {
    foreign: '窓の外には、秋の風が木の葉を優しく揺らしていた。',
    translation: 'Outside the window, the autumn wind was gently swaying the leaves.',
    vocabHighlights: ['窓', '秋', '風', '木の葉'],
  },
  {
    foreign: '彼女はコーヒーを一口飲んで、ページをめくった。',
    translation: 'She took a sip of coffee and turned the page.',
    vocabHighlights: ['コーヒー'],
  },
  {
    foreign: '物語の中の世界は、現実よりも美しかった。',
    translation: 'The world inside the story was more beautiful than reality.',
    vocabHighlights: ['物語', '世界', '現実', '美しい'],
  },
  {
    foreign: '時間が止まったように、彼女は幸せだった。',
    translation: 'As if time had stopped, she was happy.',
    vocabHighlights: ['時間', '幸せ'],
  },
]

function HighlightedText({ text, highlights }: { text: string; highlights: string[] }) {
  const parts: Array<{ text: string; highlighted: boolean }> = []
  let remaining = text
  while (remaining.length > 0) {
    let earliestIndex = remaining.length
    let matchedWord = ''
    for (const word of highlights) {
      const idx = remaining.indexOf(word)
      if (idx !== -1 && idx < earliestIndex) {
        earliestIndex = idx
        matchedWord = word
      }
    }
    if (matchedWord) {
      if (earliestIndex > 0) parts.push({ text: remaining.slice(0, earliestIndex), highlighted: false })
      parts.push({ text: matchedWord, highlighted: true })
      remaining = remaining.slice(earliestIndex + matchedWord.length)
    } else {
      parts.push({ text: remaining, highlighted: false })
      remaining = ''
    }
  }
  return (
    <>
      {parts.map((part, i) =>
        part.highlighted ? (
          <span key={i} style={{ color: '#818cf8', fontWeight: 500 }}>
            {part.text}
          </span>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  )
}

export default function InteractiveDemo() {
  const [hoveredLine, setHoveredLine] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)

  return (
    <section
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '100px 48px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <AnimatedSection style={{ marginBottom: 56 }}>
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
            Try It Yourself
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
            See how learning feels
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
            Hover over each line to reveal the translation. Vocabulary words are highlighted in
            context.
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.15}>
          <div
            style={{
              maxWidth: 880,
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)',
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.01)',
            }}
          >
            {/* Header bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 28px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    fontFamily: serif,
                    fontStyle: 'italic',
                    fontSize: 16,
                    color: '#cbd5e1',
                  }}
                >
                  秋の喫茶店
                </span>
                <span style={{ color: 'rgba(255,255,255,0.12)' }}>—</span>
                <span style={{ fontFamily: sans, fontSize: 13, color: '#64748b' }}>
                  Autumn Coffee Shop
                </span>
              </div>
              <button
                onClick={() => setShowAll(!showAll)}
                style={{
                  fontFamily: sans,
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#64748b',
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 6,
                  padding: '5px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  letterSpacing: '0.02em',
                }}
              >
                {showAll ? 'Hide translations' : 'Show all'}
              </button>
            </div>

            {/* Story content — two columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {/* Original */}
              <div style={{ padding: '8px 0' }}>
                <div
                  style={{
                    padding: '8px 28px 12px',
                    fontSize: 11,
                    fontFamily: sans,
                    fontWeight: 600,
                    color: '#475569',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Original
                </div>
                {storyLines.map((line, i) => (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredLine(i)}
                    onMouseLeave={() => setHoveredLine(null)}
                    style={{
                      padding: '12px 28px',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      background: hoveredLine === i ? 'rgba(99,102,241,0.04)' : 'transparent',
                      borderLeft:
                        hoveredLine === i
                          ? '2px solid rgba(99,102,241,0.4)'
                          : '2px solid transparent',
                    }}
                  >
                    <p style={{ fontSize: 15, color: '#e2e8f0', lineHeight: 1.8 }}>
                      <HighlightedText text={line.foreign} highlights={line.vocabHighlights} />
                    </p>
                  </div>
                ))}
              </div>

              {/* Translation */}
              <div
                style={{
                  padding: '8px 0',
                  borderLeft: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  style={{
                    padding: '8px 28px 12px',
                    fontSize: 11,
                    fontFamily: sans,
                    fontWeight: 600,
                    color: '#475569',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Translation
                </div>
                {storyLines.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '12px 28px',
                      borderLeft: '2px solid transparent',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: sans,
                        fontSize: 15,
                        lineHeight: 1.8,
                        filter: hoveredLine === i || showAll ? 'blur(0px)' : 'blur(5px)',
                        color: hoveredLine === i || showAll ? '#94a3b8' : '#334155',
                        transition: 'filter 0.25s, color 0.25s',
                      }}
                    >
                      {line.translation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hint */}
            <div
              style={{
                padding: '12px 28px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <p style={{ fontFamily: sans, fontSize: 12, color: '#334155' }}>
                Hover lines to reveal · Vocabulary words are{' '}
                <span style={{ color: '#818cf8' }}>highlighted</span>
              </p>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
