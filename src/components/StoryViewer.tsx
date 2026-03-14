import { useState, useMemo } from 'react'
import type { Word } from '../types/database'

interface StoryViewerProps {
  content: string
  vocabWords: Word[]
  onSentenceHover?: (idx: number | null) => void
  hoveredSentenceIdx?: number | null
}

function splitSentences(text: string): string[] {
  return text.match(/[^.!?。！？\n]+[.!?。！？\n]*/g) ?? [text]
}

export default function StoryViewer({ content, vocabWords, onSentenceHover, hoveredSentenceIdx }: StoryViewerProps) {
  const [tooltip, setTooltip] = useState<{ word: Word; x: number; y: number; yBottom: number } | null>(null)

  const wordMap = useMemo(() => {
    const wm = new Map<string, Word>()
    for (const w of vocabWords) {
      wm.set(w.word.toLowerCase(), w)
    }
    return wm
  }, [vocabWords])

  const sentences = useMemo(() => splitSentences(content), [content])

  const HALF_W = 130, MARGIN = 8, TOOLTIP_H = 110
  let clampedLeft = 0, topPos = 0, transform = 'translate(-50%, -100%)'
  if (tooltip) {
    const vw = window.innerWidth
    clampedLeft = Math.min(Math.max(tooltip.x, HALF_W + MARGIN), vw - HALF_W - MARGIN)
    const flipped = tooltip.y - TOOLTIP_H - 10 < 0
    topPos = flipped ? tooltip.yBottom + 6 : tooltip.y - 10
    transform = flipped ? 'translate(-50%, 0)' : 'translate(-50%, -100%)'
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ fontSize: '1.05rem', margin: 0 }}>
        {sentences.map((sentence, sIdx) => {
          const tokens = tokenize(sentence, wordMap)
          const isHovered = hoveredSentenceIdx === sIdx
          return (
            <div
              key={sIdx}
              onMouseEnter={() => onSentenceHover?.(sIdx)}
              onMouseLeave={() => onSentenceHover?.(null)}
              onClick={() => onSentenceHover?.(isHovered ? null : sIdx)}
              style={{
                background: isHovered ? 'rgba(99,102,241,0.08)' : 'transparent',
                borderRadius: 4,
                padding: '0.15rem 0.4rem',
                margin: '0 -0.4rem',
                lineHeight: 2,
                transition: 'background 0.15s ease',
                cursor: onSentenceHover ? 'pointer' : 'default',
                color: '#cbd5e1',
              }}
            >
              {tokens.map((token, i) => {
                if (token.type === 'text') {
                  return <span key={i}>{token.text}</span>
                }
                return (
                  <mark
                    key={i}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setTooltip({ word: token.word!, x: rect.left + rect.width / 2, y: rect.top, yBottom: rect.bottom })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      background: 'transparent',
                      color: '#818cf8',
                      fontWeight: 600,
                      cursor: 'help',
                      padding: '0 1px',
                      textDecoration: 'underline',
                      textDecorationStyle: 'dotted',
                      textDecorationColor: 'rgba(129,140,248,0.5)',
                    }}
                  >
                    {token.text}
                  </mark>
                )
              })}
            </div>
          )
        })}
      </div>

      {tooltip && (
        <div style={{
          position: 'fixed',
          left: clampedLeft,
          top: topPos,
          transform,
          background: 'rgba(15,23,42,0.97)',
          border: '1px solid rgba(99,102,241,0.4)',
          borderRadius: 10,
          padding: '0.75rem 1rem',
          zIndex: 200,
          minWidth: 180,
          maxWidth: 260,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          pointerEvents: 'none',
        }}>
          <div style={{ color: '#a5b4fc', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>
            {tooltip.word.word}
          </div>
          {tooltip.word.reading && (
            <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 4 }}>
              {tooltip.word.reading}
            </div>
          )}
          <div style={{ color: '#cbd5e1', fontSize: '0.875rem', lineHeight: 1.5 }}>
            {tooltip.word.definition ?? '—'}
          </div>
        </div>
      )}
    </div>
  )
}

type Token = { type: 'text'; text: string } | { type: 'vocab'; text: string; word: Word }

/** Splits text into tokens, tagging substrings that match vocab words (longest-match-first). */
function tokenize(text: string, wordMap: Map<string, Word>): Token[] {
  if (wordMap.size === 0) return [{ type: 'text', text }]

  const sortedWords = [...wordMap.keys()].sort((a, b) => b.length - a.length)
  const pattern = sortedWords.map(escapeRegex).join('|')
  const regex = new RegExp(`(${pattern})`, 'gi')

  const parts = text.split(regex)
  return parts.map((part) => {
    const lower = part.toLowerCase()
    const w = wordMap.get(lower)
    if (w) return { type: 'vocab' as const, text: part, word: w }
    return { type: 'text' as const, text: part }
  })
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
