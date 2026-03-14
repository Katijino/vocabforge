import { useState, useCallback, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useBulkAddWords } from '../hooks/useWords'
import { useDecks, useCreateDeck } from '../hooks/useDecks'
import { useUserSettings } from '../hooks/useUserSettings'
import { useUsageLimits } from '../hooks/useUsageLimits'
import { useUIStore } from '../stores/uiStore'
import {
  parseAnkiRaw,
  parseAnkiTxt,
  parseCSV,
  detectFormat,
  applyMapping,
  type ParsedWord,
  type FieldMapping,
} from '../lib/csvParser'
import { parseApkg, type ApkgModel } from '../lib/apkgParser'
import ImportDropzone from '../components/ImportDropzone'
import UpgradePrompt from '../components/UpgradePrompt'
import FieldMapper from '../components/FieldMapper'
import type { WordList } from '../types/database'

function getNextDeckName(decks: WordList[]) {
  let n = 1
  while (decks.some((d) => d.name === `Deck ${n}`)) n++
  return `Deck ${n}`
}

type Phase = 'idle' | 'mapping' | 'preview' | 'importing' | 'done'
type Tab = 'csv' | 'anki' | 'duolingo'

interface ImportStats {
  total: number
  imported: number
  skipped: number
  errors: number
}

/** State for multi-model APKG mapping flow */
interface ApkgMappingState {
  models: Array<ApkgModel & { rows: string[][] }>
  currentIdx: number
  accumulatedWords: ParsedWord[]
}

export default function Import() {
  const user = useAuthStore((s) => s.user)
  const [searchParams] = useSearchParams()
  const { data: settings } = useUserSettings(user?.id ?? '')
  const { data: decks = [] } = useDecks(user?.id ?? '')
  const bulkAdd = useBulkAddWords()
  const createDeck = useCreateDeck()
  const limits = useUsageLimits(user?.id ?? '')
  const addToast = useUIStore((s) => s.addToast)

  const initialDeckId = (() => {
    const d = searchParams.get('deck')
    return d && d !== 'undecked' ? d : null
  })()

  const [tab, setTab] = useState<Tab>('csv')
  const [phase, setPhase] = useState<Phase>('idle')
  const [rows, setRows] = useState<ParsedWord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<ImportStats>({ total: 0, imported: 0, skipped: 0, errors: 0 })
  const [progress, setProgress] = useState(0)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(initialDeckId)
  const [apkgState, setApkgState] = useState<ApkgMappingState | null>(null)
  const [apkgLoading, setApkgLoading] = useState(false)
  const abortRef = useRef(false)

  if (!user) {
    return (
      <div style={authGuardStyle}>
        <p style={{ color: '#94a3b8' }}>Please sign in to import words.</p>
        <Link to="/login" style={primaryBtn}>Sign In</Link>
      </div>
    )
  }

  // ── Text file handler (CSV / Anki .txt) ──────────────────────────────────

  const handleTextFile = useCallback((file: File) => {
    setError(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      let parsed: ParsedWord[] = []
      let parseError: string | undefined

      const format = detectFormat(text)
      if (format === 'anki') {
        const result = parseAnkiTxt(text)
        parsed = result.rows
        parseError = result.error
      } else {
        const result = parseCSV(text)
        parsed = result.rows
        parseError = result.error
      }

      if (parseError && parsed.length === 0) { setError(parseError); return }
      if (parsed.length === 0) { setError('No words found. Ensure the file has word and definition columns.'); return }
      setRows(parsed)
      setPhase('preview')
    }
    reader.readAsText(file)
  }, [])

  // ── APKG file handler ────────────────────────────────────────────────────

  const handleApkgFile = useCallback(async (file: File) => {
    setError(null)
    setApkgLoading(true)
    try {
      const parsed = await parseApkg(file)
      if (parsed.models.length === 0) {
        setError('No note types with cards found in this APKG file.')
        return
      }

      const modelsWithRows = parsed.models.map((m) => ({
        ...m,
        rows: parsed.rowsByModel.get(m.id) ?? [],
      }))

      setApkgState({ models: modelsWithRows, currentIdx: 0, accumulatedWords: [] })
      setPhase('mapping')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse APKG file.')
    } finally {
      setApkgLoading(false)
    }
  }, [])

  const handleAnkiFile = useCallback((file: File) => {
    if (file.name.toLowerCase().endsWith('.apkg')) {
      handleApkgFile(file)
    } else {
      handleTextFile(file)
    }
  }, [handleApkgFile, handleTextFile])

  // ── APKG: confirm mapping for current model ──────────────────────────────

  const handleApkgMappingConfirm = (mapping: FieldMapping) => {
    if (!apkgState) return
    const current = apkgState.models[apkgState.currentIdx]
    const mapped = applyMapping(current.rows, mapping)
    const accumulated = [...apkgState.accumulatedWords, ...mapped]
    const nextIdx = apkgState.currentIdx + 1

    if (nextIdx < apkgState.models.length) {
      setApkgState({ ...apkgState, currentIdx: nextIdx, accumulatedWords: accumulated })
    } else {
      // All models mapped — go to preview
      if (accumulated.length === 0) {
        setError('No valid word/definition pairs found after mapping.')
        setPhase('idle')
        setApkgState(null)
        return
      }
      setRows(accumulated)
      setApkgState(null)
      setPhase('preview')
    }
  }

  const handleApkgMappingSkip = () => {
    if (!apkgState) return
    const nextIdx = apkgState.currentIdx + 1
    if (nextIdx < apkgState.models.length) {
      setApkgState({ ...apkgState, currentIdx: nextIdx })
    } else {
      if (apkgState.accumulatedWords.length === 0) {
        setError('All note types were skipped — nothing to import.')
        setPhase('idle')
        setApkgState(null)
        return
      }
      setRows(apkgState.accumulatedWords)
      setApkgState(null)
      setPhase('preview')
    }
  }

  // ── Import to Supabase ───────────────────────────────────────────────────

  const runImport = async () => {
    let deckId = selectedDeckId
    if (!deckId) {
      const name = getNextDeckName(decks)
      const newDeck = await createDeck.mutateAsync({
        user_id: user.id,
        name,
        language: settings?.learning_language ?? 'en',
      })
      deckId = newDeck.id
      setSelectedDeckId(deckId)
    }

    abortRef.current = false
    setPhase('importing')
    const s: ImportStats = { total: rows.length, imported: 0, skipped: 0, errors: 0 }

    const batchSize = 25
    for (let i = 0; i < rows.length; i += batchSize) {
      if (abortRef.current) break
      const batch = rows.slice(i, i + batchSize)
      try {
        const result = await bulkAdd.mutateAsync({
          userId: user.id,
          words: batch.map((r) => ({
            word: r.word,
            definition: r.definition,
            reading: r.reading,
            example: r.example,
            language: settings?.learning_language ?? 'en',
            list_id: deckId ?? undefined,
          })),
        })
        s.imported += result?.length ?? batch.length
      } catch {
        s.errors += batch.length
      }
      setProgress(Math.min(100, Math.round(((i + batchSize) / rows.length) * 100)))
      setStats({ ...s })
    }

    setPhase('done')
    setStats(s)
    addToast(`Imported ${s.imported} words!`, 'success')
  }

  const reset = () => {
    setPhase('idle')
    setRows([])
    setError(null)
    setStats({ total: 0, imported: 0, skipped: 0, errors: 0 })
    setProgress(0)
    setApkgState(null)
    setApkgLoading(false)
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem 5rem', color: '#f1f5f9' }}>
      {showUpgrade && <UpgradePrompt reason="words" onClose={() => setShowUpgrade(false)} />}

      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Import Words</h1>
      <p style={{ color: '#64748b', margin: '0 0 2rem', fontSize: '0.9rem' }}>
        Import vocabulary from CSV, Anki, or sync with Duolingo.
      </p>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 10,
        padding: 3,
        marginBottom: '2rem',
        border: '1px solid rgba(255,255,255,0.06)',
        width: 'fit-content',
      }}>
        {([
          { id: 'csv',      label: 'CSV / TSV' },
          { id: 'anki',     label: 'Anki' },
          { id: 'duolingo', label: 'Duolingo', pro: true },
        ] as { id: Tab; label: string; pro?: boolean }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); reset() }}
            style={{
              padding: '0.45rem 1.1rem',
              borderRadius: 8,
              border: 'none',
              background: tab === t.id ? 'rgba(99,102,241,0.25)' : 'transparent',
              color: tab === t.id ? '#a5b4fc' : '#64748b',
              fontWeight: tab === t.id ? 600 : 400,
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {t.label}
            {t.pro && (
              <span style={{
                fontSize: '0.65rem',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                padding: '1px 5px',
                borderRadius: 4,
                fontWeight: 700,
              }}>PRO</span>
            )}
          </button>
        ))}
      </div>

      {/* CSV Tab */}
      {tab === 'csv' && (
        <div>
          {phase === 'idle' && (
            <>
              <div style={infoBox}>
                <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 600, color: '#a5b4fc' }}>
                  Supported formats
                </h3>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                  <li>CSV with headers: <code style={codeStyle}>word, definition</code> (or term/meaning etc.)</li>
                  <li>Tab-separated: <code style={codeStyle}>word↹definition</code></li>
                  <li>Quizlet export (tab-separated)</li>
                </ul>
              </div>
              <ImportDropzone
                accept=".csv,.tsv,.txt,text/csv,text/plain"
                onFile={handleTextFile}
                hint="Supports CSV, TSV, and Quizlet exports"
              />
            </>
          )}
          {renderPhases()}
        </div>
      )}

      {/* Anki Tab */}
      {tab === 'anki' && (
        <div>
          {phase === 'idle' && !apkgLoading && (
            <>
              <div style={infoBox}>
                <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 600, color: '#a5b4fc' }}>
                  Import from Anki
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ color: '#e2e8f0', fontSize: '0.825rem', fontWeight: 600, marginBottom: 6 }}>
                      .apkg (recommended)
                    </div>
                    <ol style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.5 }}>
                      <li>Open Anki and select your deck</li>
                      <li>Go to <strong style={{ color: '#e2e8f0' }}>File → Export</strong></li>
                      <li>Set format to <strong style={{ color: '#e2e8f0' }}>Anki Deck Package (.apkg)</strong></li>
                      <li>Click Export and drop the file below</li>
                    </ol>
                  </div>
                  <div>
                    <div style={{ color: '#e2e8f0', fontSize: '0.825rem', fontWeight: 600, marginBottom: 6 }}>
                      .txt (plain text export)
                    </div>
                    <ol style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.5 }}>
                      <li>Go to <strong style={{ color: '#e2e8f0' }}>File → Export</strong></li>
                      <li>Set format to <strong style={{ color: '#e2e8f0' }}>Notes in Plain Text</strong></li>
                      <li>Uncheck "Include HTML and media references"</li>
                      <li>Export and drop below</li>
                    </ol>
                  </div>
                </div>
              </div>
              <ImportDropzone
                accept=".apkg,.txt,text/plain"
                onFile={handleAnkiFile}
                hint="Drop an Anki .apkg or .txt export"
              />
            </>
          )}

          {/* APKG loading spinner */}
          {apkgLoading && (
            <div style={{ ...cardStyle, marginTop: '1.5rem', textAlign: 'center', padding: '2.5rem' }}>
              <div style={{ color: '#a5b4fc', fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>
                Reading APKG…
              </div>
              <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                Loading SQLite engine and parsing your deck
              </div>
            </div>
          )}

          {/* APKG field mapping */}
          {phase === 'mapping' && apkgState && (
            <div style={{ marginTop: '1.5rem' }}>
              {/* Progress indicator for multi-model decks */}
              {apkgState.models.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
                  <span style={{ color: '#64748b', fontSize: '0.8rem' }}>
                    Note type {apkgState.currentIdx + 1} of {apkgState.models.length}:
                  </span>
                  <span style={{ color: '#a5b4fc', fontSize: '0.875rem', fontWeight: 600 }}>
                    {apkgState.models[apkgState.currentIdx].name}
                  </span>
                  <span style={{ color: '#475569', fontSize: '0.8rem' }}>
                    ({apkgState.models[apkgState.currentIdx].rows.length} notes)
                  </span>
                </div>
              )}
              <FieldMapper
                rows={apkgState.models[apkgState.currentIdx].rows}
                columnCount={apkgState.models[apkgState.currentIdx].fields.length}
                initialMapping={buildInitialMapping(apkgState.models[apkgState.currentIdx])}
                onConfirm={handleApkgMappingConfirm}
                onBack={handleApkgMappingSkip}
              />
              {/* Override the Back button label via a note under FieldMapper */}
              {apkgState.models.length > 1 && (
                <p style={{ color: '#475569', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  "Back" skips this note type.
                </p>
              )}
            </div>
          )}

          {renderPhases()}
        </div>
      )}

      {/* Duolingo Tab */}
      {tab === 'duolingo' && (
        <div>
          {!limits.isPro ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              background: 'rgba(99,102,241,0.05)',
              border: '1px solid rgba(99,102,241,0.15)',
              borderRadius: 16,
            }}>
              <div style={{ fontSize: 48, marginBottom: '1rem' }}>🔒</div>
              <h2 style={{ color: '#f1f5f9', fontWeight: 700, marginBottom: 8 }}>Pro Feature</h2>
              <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Duolingo sync requires a Pro subscription.{' '}
                <strong style={{ color: '#fca5a5' }}>Note: uses unofficial API — may break.</strong>
              </p>
              <Link to="/billing" style={primaryBtn}>Upgrade to Pro — $10/mo</Link>
            </div>
          ) : (
            <DuolingoSync userId={user.id} />
          )}
        </div>
      )}
    </div>
  )

  function renderPhases() {
    if (error) {
      return (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '0.9rem 1.25rem', marginTop: '1rem', color: '#fca5a5', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span>{error}</span>
          <button onClick={reset} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0, flexShrink: 0 }}>✕</button>
        </div>
      )
    }

    if (phase === 'preview' && rows.length > 0) {
      return (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                {rows.length.toLocaleString()} words found
              </h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.875rem' }}>
                Review below, then click Import.
              </p>
            </div>
            <button onClick={reset} style={{ ...secondaryBtn, cursor: 'pointer' }}>Change file</button>
          </div>

          <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', marginBottom: '1.25rem' }}>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(99,102,241,0.12)' }}>
                    {['Word', 'Definition', 'Reading'].map((h) => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                      <td style={{ padding: '9px 14px', color: '#e2e8f0', fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.word}</td>
                      <td style={{ padding: '9px 14px', color: '#94a3b8', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.definition}</td>
                      <td style={{ padding: '9px 14px', color: '#64748b', fontSize: '0.8rem' }}>{row.reading ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Import into deck</label>
            <select
              value={selectedDeckId ?? ''}
              onChange={(e) => setSelectedDeckId(e.target.value || null)}
              style={selectStyle}
            >
              <option value="">— Auto-create deck —</option>
              {decks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <p style={{ margin: '0.4rem 0 0', color: '#64748b', fontSize: '0.8rem' }}>
              Words will be imported into the selected deck. A new deck will be created if none is chosen.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={runImport} style={{
              padding: '0.7rem 2rem',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.9rem',
              boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
            }}>
              Import {rows.length.toLocaleString()} Words
            </button>
            <button onClick={reset} style={{ ...secondaryBtn, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )
    }

    if (phase === 'importing') {
      return (
        <div style={{ ...cardStyle, marginTop: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 600 }}>Importing words…</h3>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 3, transition: 'width 0.3s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
            <span>{stats.imported} imported</span>
            <span>{progress}%</span>
          </div>
          <button onClick={() => { abortRef.current = true }} style={{ ...secondaryBtn, cursor: 'pointer', fontSize: '0.825rem' }}>
            Cancel
          </button>
        </div>
      )
    }

    if (phase === 'done') {
      return (
        <div style={{ ...cardStyle, marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✓</div>
            <div>
              <div style={{ color: '#4ade80', fontWeight: 700 }}>Import complete!</div>
              <div style={{ color: '#64748b', fontSize: '0.825rem' }}>{stats.imported} words added to your vocabulary</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total',    value: stats.total,    color: '#a5b4fc' },
              { label: 'Imported', value: stats.imported, color: '#4ade80' },
              { label: 'Errors',   value: stats.errors,   color: stats.errors > 0 ? '#fca5a5' : '#64748b' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/learn" style={primaryBtn}>View My Words</Link>
            <button onClick={reset} style={{ ...secondaryBtn, cursor: 'pointer' }}>Import another</button>
          </div>
        </div>
      )
    }

    return null
  }
}

/** Auto-detect likely field roles from model field names */
function buildInitialMapping(model: ApkgModel & { rows: string[][] }): FieldMapping {
  const mapping: FieldMapping = {}
  const lower = model.fields.map((f) => f.toLowerCase())

  const wordKeywords    = ['word', 'term', 'front', 'vocab', 'expression', 'kanji', 'hanzi']
  const defKeywords     = ['definition', 'meaning', 'back', 'translation', 'gloss', 'english']
  const readingKeywords = ['reading', 'kana', 'furigana', 'pronunciation', 'hiragana', 'pinyin']
  const exampleKeywords = ['example', 'sentence', 'context']
  const exTransKeywords = ['example_translation', 'sentence_translation', 'english sentence', 'translation']

  let wordIdx = -1, defIdx = -1, readingIdx = -1, exIdx = -1, exTransIdx = -1

  for (let i = 0; i < lower.length; i++) {
    const f = lower[i]
    if (wordIdx    === -1 && wordKeywords.some((k) => f.includes(k)))    { wordIdx    = i; continue }
    if (defIdx     === -1 && defKeywords.some((k) => f.includes(k)))     { defIdx     = i; continue }
    if (readingIdx === -1 && readingKeywords.some((k) => f.includes(k))) { readingIdx = i; continue }
    if (exTransIdx === -1 && exTransKeywords.some((k) => f.includes(k))) { exTransIdx = i; continue }
    if (exIdx      === -1 && exampleKeywords.some((k) => f.includes(k))) { exIdx      = i; continue }
  }

  // Fallbacks: if no word/def detected, guess col 0 = word, col 1 = def
  if (wordIdx === -1) wordIdx = 0
  if (defIdx  === -1 && model.fields.length > 1) defIdx = wordIdx === 0 ? 1 : 0

  for (let i = 0; i < model.fields.length; i++) {
    if      (i === wordIdx)    mapping[i] = 'word'
    else if (i === defIdx)     mapping[i] = 'definition'
    else if (i === readingIdx) mapping[i] = 'reading'
    else if (i === exIdx)      mapping[i] = 'example'
    else if (i === exTransIdx) mapping[i] = 'example_translation'
    else                       mapping[i] = 'skip'
  }

  return mapping
}

function DuolingoSync({ userId: _userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSync = async () => {
    setLoading(true)
    setMsg('')
    try {
      const { supabase } = await import('../lib/supabase')
      const res = await supabase.functions.invoke('duolingo-sync')
      if (res.error) throw res.error
      setMsg(`Synced ${(res.data as { count?: number })?.count ?? 0} words from Duolingo.`)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={cardStyle}>
      <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
        <strong style={{ color: '#fbbf24', fontSize: '0.875rem' }}>⚠ Unofficial API</strong>
        <p style={{ color: '#94a3b8', fontSize: '0.825rem', margin: '4px 0 0', lineHeight: 1.5 }}>
          Duolingo sync uses an unofficial API that may break at any time.
        </p>
      </div>
      <button onClick={handleSync} disabled={loading} style={{
        padding: '0.7rem 1.75rem',
        borderRadius: 10,
        border: 'none',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: '#fff',
        fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '0.9rem',
        opacity: loading ? 0.6 : 1,
      }}>
        {loading ? 'Syncing…' : 'Sync Duolingo Words'}
      </button>
      {msg && <p style={{ marginTop: '0.75rem', color: '#94a3b8', fontSize: '0.875rem' }}>{msg}</p>}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
  padding: '1.5rem',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#64748b',
  marginBottom: '0.3rem',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const selectStyle: React.CSSProperties = {
  padding: '0.6rem 0.85rem',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(15,23,42,0.9)',
  color: '#f1f5f9',
  fontSize: '0.875rem',
  outline: 'none',
  fontFamily: 'inherit',
  cursor: 'pointer',
  minWidth: 220,
}

const infoBox: React.CSSProperties = {
  background: 'rgba(99,102,241,0.06)',
  border: '1px solid rgba(99,102,241,0.15)',
  borderRadius: 12,
  padding: '1.25rem',
  marginBottom: '1.25rem',
}

const codeStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  padding: '1px 5px',
  borderRadius: 4,
  fontFamily: 'monospace',
  fontSize: '0.85em',
}

const authGuardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '60vh',
  gap: '1rem',
}

const primaryBtn: React.CSSProperties = {
  padding: '0.65rem 1.75rem',
  borderRadius: 8,
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  color: '#fff',
  fontWeight: 600,
  textDecoration: 'none',
  fontSize: '0.9rem',
  display: 'inline-block',
}

const secondaryBtn: React.CSSProperties = {
  padding: '0.6rem 1.25rem',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'transparent',
  color: '#94a3b8',
  fontSize: '0.875rem',
  textDecoration: 'none',
  display: 'inline-block',
}

// Suppress unused import warning — parseAnkiRaw is available for future use
void parseAnkiRaw
