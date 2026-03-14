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
  const [tooltip, setTooltip] = useState<{ word: Word; x: number; y: number } | null>(null)

  const wordMap = useMemo(() => {
    const wm = new Map<string, Word>()
    for (const w of vocabWords) {
      wm.set(w.word.toLowerCase(), w)
    }
    return wm
  }, [vocabWords])

  const sentences = useMemo(() => splitSentences(content), [content])

  return (
    <div style={{ position: 'relative' }}>
      <p style={{
        color: '#cbd5e1',
        fontSize: '1.05rem',
        lineHeight: 1.85,
        margin: 0,
        whiteSpace: 'pre-wrap',
      }}>
        {sentences.map((sentence, sIdx) => {
          const tokens = tokenize(sentence, wordMap)
          const isHovered = hoveredSentenceIdx === sIdx
          return (
            <span
              key={sIdx}
              onMouseEnter={() => onSentenceHover?.(sIdx)}
              onMouseLeave={() => onSentenceHover?.(null)}
              onClick={() => onSentenceHover?.(isHovered ? null : sIdx)}
              style={{
                background: isHovered ? 'rgba(99,102,241,0.08)' : 'transparent',
                borderRadius: 4,
                transition: 'background 0.15s ease',
                cursor: onSentenceHover ? 'pointer' : 'default',
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
                      setTooltip({ word: token.word!, x: rect.left + rect.width / 2, y: rect.top })
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      background: 'rgba(99,102,241,0.2)',
                      borderBottom: '2px solid #6366f1',
                      borderRadius: '3px 3px 0 0',
                      color: '#a5b4fc',
                      cursor: 'help',
                      fontWeight: 600,
                      padding: '0 1px',
                    }}
                  >
                    {token.text}
                  </mark>
                )
              })}
            </span>
          )
        })}
      </p>

      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x,
          top: tooltip.y - 10,
          transform: 'translate(-50%, -100%)',
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
