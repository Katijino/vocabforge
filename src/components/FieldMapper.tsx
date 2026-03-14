import { useState } from 'react'
import type { FieldMapping, FieldRole } from '../lib/csvParser'
import { stripFurigana } from '../lib/csvParser'

const ROLE_OPTIONS: Array<{ value: FieldRole; label: string; color: string }> = [
  { value: 'word',                 label: 'Word',                 color: '#a5b4fc' },
  { value: 'definition',          label: 'Definition',           color: '#4ade80' },
  { value: 'reading',             label: 'Reading',              color: '#67e8f9' },
  { value: 'example',             label: 'Example (target lang)', color: '#fbbf24' },
  { value: 'example_translation', label: 'Example Translation',  color: '#f9a8d4' },
  { value: 'skip',                label: 'Skip',                 color: '#475569' },
]

interface FieldMapperProps {
  rows: string[][]
  columnCount: number
  initialMapping: FieldMapping
  onConfirm: (mapping: FieldMapping) => void
  onBack: () => void
}

export default function FieldMapper({ rows, columnCount, initialMapping, onConfirm, onBack }: FieldMapperProps) {
  const [mapping, setMapping] = useState<FieldMapping>({ ...initialMapping })

  const sampleRows = rows.slice(0, 4)

  const setRole = (col: number, role: FieldRole) => {
    setMapping((prev) => {
      const next = { ...prev }
      // Clear any existing column with this role (except skip — multiple skips ok)
      if (role !== 'skip') {
        for (const k of Object.keys(next)) {
          if (next[parseInt(k)] === role) next[parseInt(k)] = 'skip'
        }
      }
      next[col] = role
      return next
    })
  }

  const hasWord = Object.values(mapping).includes('word')
  const hasDef = Object.values(mapping).includes('definition')
  const canConfirm = hasWord && hasDef

  // Build card preview from first non-empty row
  const previewRow = rows.find((r) => {
    const wc = Object.entries(mapping).find(([, v]) => v === 'word')?.[0]
    return wc !== undefined && r[parseInt(wc)]?.trim()
  }) ?? rows[0] ?? []

  function getPreviewField(role: FieldRole): string {
    const col = Object.entries(mapping).find(([, v]) => v === role)?.[0]
    if (col === undefined) return ''
    const raw = previewRow[parseInt(col)]?.trim() ?? ''
    if (role === 'reading' || role === 'example') return stripFurigana(raw) || raw
    return raw
  }

  const previewWord = getPreviewField('word')
  const previewDef = getPreviewField('definition')
  const previewReading = getPreviewField('reading')
  const previewExample = getPreviewField('example')
  const previewExTrans = getPreviewField('example_translation')

  return (
    <div style={{ color: '#f1f5f9' }}>
      <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.2rem', fontWeight: 700 }}>Map Fields</h2>
      <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.875rem', lineHeight: 1.5 }}>
        Assign each column to a field. VocabForge detected {rows.length.toLocaleString()} cards with {columnCount} columns.
      </p>

      {/* Column mapping table */}
      <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', marginBottom: '1.5rem' }}>
        {/* Header row */}
        <div style={headerRowStyle}>
          <div style={{ width: 40, color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase' }}>#</div>
          <div style={{ flex: 1, color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase' }}>Sample values</div>
          <div style={{ width: 200, color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase' }}>Assign to</div>
        </div>

        {Array.from({ length: columnCount }, (_, colIdx) => {
          const role = mapping[colIdx] ?? 'skip'
          const roleInfo = ROLE_OPTIONS.find((r) => r.value === role)!
          const samples = sampleRows
            .map((r) => r[colIdx]?.trim() ?? '')
            .filter(Boolean)
            .slice(0, 3)

          return (
            <div key={colIdx} style={{
              ...dataRowStyle,
              background: role !== 'skip'
                ? 'rgba(99,102,241,0.04)'
                : 'transparent',
              borderLeft: role !== 'skip' ? `2px solid ${roleInfo.color}44` : '2px solid transparent',
            }}>
              {/* Column number */}
              <div style={{ width: 40, color: '#475569', fontSize: '0.75rem', fontWeight: 600 }}>
                {colIdx + 1}
              </div>

              {/* Sample values */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                {samples.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {samples.map((s, i) => (
                      <div key={i} style={{
                        fontSize: '0.8rem',
                        color: i === 0 ? '#e2e8f0' : '#64748b',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                      }}>
                        {s || <span style={{ color: '#374151', fontStyle: 'italic' }}>empty</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: '#374151', fontSize: '0.8rem', fontStyle: 'italic' }}>empty column</span>
                )}
              </div>

              {/* Role selector */}
              <div style={{ width: 200 }}>
                <select
                  value={role}
                  onChange={(e) => setRole(colIdx, e.target.value as FieldRole)}
                  style={{
                    width: '100%',
                    padding: '0.35rem 0.65rem',
                    borderRadius: 6,
                    border: `1px solid ${roleInfo.color}44`,
                    background: 'rgba(15,23,42,0.8)',
                    color: roleInfo.color,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} style={{ color: opt.color }}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )
        })}
      </div>

      {/* Card preview */}
      {previewWord && previewDef && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
            Card preview
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
          }}>
            {/* Front */}
            <div style={cardFaceStyle}>
              <div style={{ color: '#475569', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Front</div>
              <div style={{ color: '#f1f5f9', fontSize: '1.4rem', fontWeight: 700, textAlign: 'center' }}>{previewWord}</div>
              {previewReading && (
                <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: 4, textAlign: 'center' }}>{previewReading}</div>
              )}
            </div>
            {/* Back */}
            <div style={{ ...cardFaceStyle, background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }}>
              <div style={{ color: '#6366f1', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Back</div>
              <div style={{ color: '#f1f5f9', fontSize: '1rem', fontWeight: 600, textAlign: 'center' }}>{previewDef}</div>
              {previewExample && (
                <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: 8, fontStyle: 'italic', textAlign: 'center', lineHeight: 1.5 }}>
                  "{previewExample}"
                </div>
              )}
              {previewExTrans && (
                <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 4, textAlign: 'center', lineHeight: 1.5 }}>
                  {previewExTrans}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Validation */}
      {!canConfirm && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '0.65rem 1rem', marginBottom: '1rem', color: '#fca5a5', fontSize: '0.825rem' }}>
          {!hasWord && !hasDef ? 'Assign at least one Word and one Definition column.'
            : !hasWord ? 'Assign a Word column.'
            : 'Assign a Definition column.'}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={() => canConfirm && onConfirm(mapping)}
          disabled={!canConfirm}
          style={{
            padding: '0.7rem 2rem',
            borderRadius: 10,
            border: 'none',
            background: canConfirm ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.04)',
            color: canConfirm ? '#fff' : '#475569',
            fontWeight: 700,
            cursor: canConfirm ? 'pointer' : 'not-allowed',
            fontSize: '0.9rem',
            boxShadow: canConfirm ? '0 4px 16px rgba(99,102,241,0.35)' : 'none',
            fontFamily: 'inherit',
          }}
        >
          Import {rows.length.toLocaleString()} Cards
        </button>
        <button onClick={onBack} style={{
          padding: '0.6rem 1.25rem',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'transparent',
          color: '#94a3b8',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontFamily: 'inherit',
        }}>
          Back
        </button>
      </div>
    </div>
  )
}

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.6rem 1rem',
  background: 'rgba(255,255,255,0.03)',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
}

const dataRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.6rem 1rem',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
  transition: 'background 0.1s',
}

const cardFaceStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 100,
}
