export interface ParsedWord {
  word: string
  definition: string
  reading?: string
  example?: string
  example_translation?: string
}

export type FieldRole = 'word' | 'definition' | 'reading' | 'example' | 'example_translation' | 'skip'
export type FieldMapping = Record<number, FieldRole>

interface AnkiMeta {
  separator: string
  tagsColumn?: number
  notetypeColumn?: number
  deckColumn?: number
  htmlEnabled: boolean
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/\[sound:[^\]]+\]/g, '')   // strip [sound:file.mp3]
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}

export function stripFurigana(s: string): string {
  // Remove inline furigana like 話[はなし] → 話
  return s.replace(/\[[\u3040-\u30ff\u3041-\u3096]+\]/g, '').trim()
}

function isNumericOnly(s: string): boolean {
  return /^\d+\.?\d*$/.test(s.trim())
}

function isJapanese(s: string): boolean {
  return /[\u3040-\u30ff\u4e00-\u9fff\uff00-\uffef]/.test(s)
}

function isEnglish(s: string): boolean {
  if (!s || s.length < 2) return false
  const letters = s.split('').filter((c) => /[a-zA-Z]/.test(c)).length
  return letters / s.length > 0.4 && /[a-zA-Z]{2,}/.test(s)
}

function isSentence(s: string): boolean {
  return s.length > 15 && /[.。！!？?]$/.test(s.trim())
}

function isPureKana(s: string): boolean {
  const kana = s.split('').filter((c) => /[\u3040-\u30ff]/.test(c)).length
  return kana > 0 && kana / s.replace(/\s/g, '').length > 0.6
}

// ─── Anki header parser ──────────────────────────────────────────────────────

function parseAnkiHeaders(lines: string[]): AnkiMeta {
  const meta: AnkiMeta = { separator: '\t', htmlEnabled: false }
  for (const line of lines) {
    if (!line.startsWith('#')) break
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(1, colonIdx).trim().toLowerCase()
    const val = line.slice(colonIdx + 1).trim()
    switch (key) {
      case 'separator':
        if (val === 'tab') meta.separator = '\t'
        else if (val === 'comma') meta.separator = ','
        else if (val === 'semicolon') meta.separator = ';'
        else if (val === 'pipe') meta.separator = '|'
        else meta.separator = val
        break
      case 'html':
        meta.htmlEnabled = val.toLowerCase() === 'true'
        break
      case 'tags column':
        meta.tagsColumn = parseInt(val) - 1
        break
      case 'notetype column':
        meta.notetypeColumn = parseInt(val) - 1
        break
      case 'deck column':
        meta.deckColumn = parseInt(val) - 1
        break
    }
  }
  return meta
}

// ─── Smart column detection ──────────────────────────────────────────────────

/** Heuristically assigns word/definition/reading/example columns from sample data. */
function detectColumns(
  sampleRows: string[][],
  skipCols: Set<number>,
  maxCols: number,
): { wordCol: number; defCol: number; readingCol: number; exampleCol: number; exampleTranslationCol: number } {
  let wordCol = -1
  let defCol = -1
  let readingCol = -1
  let exampleCol = -1
  let exampleTranslationCol = -1

  // Word: first non-skipped, non-numeric, short, non-sentence column
  for (let c = 0; c < maxCols; c++) {
    if (skipCols.has(c)) continue
    const vals = sampleRows.map((r) => r[c] ?? '').filter(Boolean)
    if (vals.length === 0) continue
    const allNonNumeric = vals.every((v) => !isNumericOnly(v))
    const allShort = vals.every((v) => v.length <= 60)
    const notSentences = vals.every((v) => !isSentence(v))
    const hasContent = vals.some((v) => v.length >= 1)
    if (allNonNumeric && allShort && notSentences && hasContent) {
      wordCol = c
      break
    }
  }
  if (wordCol === -1) wordCol = 0

  // Definition: first English-ish, non-sentence column after wordCol
  for (let c = wordCol + 1; c < maxCols; c++) {
    if (skipCols.has(c)) continue
    const vals = sampleRows.map((r) => r[c] ?? '').filter(Boolean)
    if (vals.length === 0) continue
    const englishCount = vals.filter((v) => isEnglish(v) && !isSentence(v)).length
    if (englishCount >= Math.ceil(vals.length * 0.5)) {
      defCol = c
      break
    }
  }
  if (defCol === -1) {
    for (let c = wordCol + 1; c < maxCols; c++) {
      if (skipCols.has(c)) continue
      const vals = sampleRows.map((r) => r[c] ?? '').filter(Boolean)
      if (vals.length > 0 && vals.some((v) => !isNumericOnly(v) && !isSentence(v))) {
        defCol = c
        break
      }
    }
  }
  if (defCol === -1) defCol = wordCol + 1

  // Reading: kana-heavy or contains furigana markers [], short, not same col as def
  for (let c = wordCol + 1; c < Math.min(maxCols, wordCol + 8); c++) {
    if (skipCols.has(c) || c === defCol) continue
    const vals = sampleRows.map((r) => r[c] ?? '').filter(Boolean)
    if (vals.length === 0) continue
    const readingCount = vals.filter((v) => isPureKana(v) || v.includes('[')).length
    if (readingCount >= Math.ceil(vals.length * 0.4) && vals.every((v) => v.length < 100)) {
      readingCol = c
      break
    }
  }

  // Example: Japanese sentence
  for (let c = defCol + 1; c < maxCols; c++) {
    if (skipCols.has(c) || c === readingCol) continue
    const vals = sampleRows.map((r) => r[c] ?? '').filter(Boolean)
    if (vals.length === 0) continue
    const jpSentence = vals.filter((v) => isSentence(v) && isJapanese(v)).length
    if (jpSentence >= Math.ceil(vals.length * 0.4)) {
      exampleCol = c
      break
    }
  }

  // Example translation: English sentence after exampleCol (or any English sentence if no JP example found)
  const searchFrom = exampleCol !== -1 ? exampleCol + 1 : defCol + 1
  for (let c = searchFrom; c < maxCols; c++) {
    if (skipCols.has(c) || c === readingCol || c === exampleCol) continue
    const vals = sampleRows.map((r) => r[c] ?? '').filter(Boolean)
    if (vals.length === 0) continue
    const enSentence = vals.filter((v) => isSentence(v) && isEnglish(v)).length
    if (enSentence >= Math.ceil(vals.length * 0.4)) {
      exampleTranslationCol = c
      break
    }
  }

  return { wordCol, defCol, readingCol, exampleCol, exampleTranslationCol }
}

// ─── Raw Anki parser (returns all columns for manual mapping) ─────────────────

export interface AnkiRawResult {
  meta: AnkiMeta
  rows: string[][]
  columnCount: number
  suggestedMapping: FieldMapping
}

/** Parses Anki-exported text into raw column data with a suggested field mapping. */
export function parseAnkiRaw(text: string): AnkiRawResult {
  const allLines = text.split('\n')
  const meta = parseAnkiHeaders(allLines)

  const dataLines = allLines
    .filter((l) => !l.startsWith('#'))
    .map((l) => l.trim())
    .filter(Boolean)

  const rows = dataLines.map((l) =>
    l.split(meta.separator).map((c) => stripHtml(c.trim()))
  )

  const columnCount = Math.max(...rows.map((r) => r.length), 0)

  const skipCols = new Set<number>()
  if (meta.tagsColumn !== undefined) skipCols.add(meta.tagsColumn)
  if (meta.notetypeColumn !== undefined) skipCols.add(meta.notetypeColumn)
  if (meta.deckColumn !== undefined) skipCols.add(meta.deckColumn)

  const sample = rows.slice(0, 10)
  const { wordCol, defCol, readingCol, exampleCol, exampleTranslationCol } =
    detectColumns(sample, skipCols, columnCount)

  const suggestedMapping: FieldMapping = {}
  for (let i = 0; i < columnCount; i++) {
    if (skipCols.has(i)) suggestedMapping[i] = 'skip'
    else if (i === wordCol) suggestedMapping[i] = 'word'
    else if (i === defCol) suggestedMapping[i] = 'definition'
    else if (i === readingCol) suggestedMapping[i] = 'reading'
    else if (i === exampleCol) suggestedMapping[i] = 'example'
    else if (i === exampleTranslationCol) suggestedMapping[i] = 'example_translation'
    else suggestedMapping[i] = 'skip'
  }

  return { meta, rows, columnCount, suggestedMapping }
}

// ─── Apply a field mapping to raw rows ────────────────────────────────────────

export function applyMapping(rows: string[][], mapping: FieldMapping): ParsedWord[] {
  const wordCol = Object.entries(mapping).find(([, r]) => r === 'word')?.[0]
  const defCol = Object.entries(mapping).find(([, r]) => r === 'definition')?.[0]
  if (wordCol === undefined || defCol === undefined) return []

  const wc = parseInt(wordCol)
  const dc = parseInt(defCol)
  const rc = parseInt(Object.entries(mapping).find(([, r]) => r === 'reading')?.[0] ?? '-1')
  const ec = parseInt(Object.entries(mapping).find(([, r]) => r === 'example')?.[0] ?? '-1')
  const etc = parseInt(Object.entries(mapping).find(([, r]) => r === 'example_translation')?.[0] ?? '-1')

  const result: ParsedWord[] = []
  for (const cols of rows) {
    const word = cols[wc]?.trim()
    const definition = cols[dc]?.trim()
    if (!word || !definition) continue
    if (isNumericOnly(word)) continue

    const rawReading = rc >= 0 ? cols[rc]?.trim() : undefined
    const reading = rawReading ? (stripFurigana(rawReading) || rawReading) : undefined

    const rawExample = ec >= 0 ? cols[ec]?.trim() : undefined
    const example = rawExample ? (stripFurigana(rawExample) || rawExample) : undefined

    const rawExTrans = etc >= 0 ? cols[etc]?.trim() : undefined
    const exampleTranslation = rawExTrans || undefined

    result.push({
      word,
      definition,
      reading: reading && reading !== word ? reading : undefined,
      example: example || undefined,
      example_translation: exampleTranslation,
    })
  }
  return result
}

// ─── Anki / TSV parser (auto mode — kept for CSV fallback path) ───────────────

export function parseAnkiTxt(text: string): { rows: ParsedWord[]; error?: string } {
  const raw = parseAnkiRaw(text)
  if (raw.rows.length === 0) return { rows: [], error: 'No data found in file.' }
  const rows = applyMapping(raw.rows, raw.suggestedMapping)
  if (rows.length === 0) {
    return { rows: [], error: 'Could not extract word/definition pairs. Check the file format.' }
  }
  return { rows }
}

// ─── CSV parser ───────────────────────────────────────────────────────────────

export function parseCSV(text: string): { rows: ParsedWord[]; error?: string } {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return { rows: [], error: 'File appears empty.' }

  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim())

  const wordIdx = findCol(header, ['word', 'term', 'front', 'vocabulary', 'vocab'])
  const defIdx  = findCol(header, ['definition', 'meaning', 'back', 'translation', 'def'])

  if (wordIdx === -1 || defIdx === -1) {
    const result = parseAnkiTxt(text)
    if (result.rows.length > 0) return result
    return {
      rows: [],
      error: 'Could not detect word/definition columns. Expected headers like: word, definition (or term/meaning etc.)',
    }
  }

  const readingIdx = findCol(header, ['reading', 'furigana', 'pronunciation', 'phonetic'])
  const exampleIdx = findCol(header, ['example', 'sentence', 'context'])
  const exTransIdx = findCol(header, ['example_translation', 'sentence_translation', 'sentence translation'])

  const rows: ParsedWord[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i])
    const word = cols[wordIdx]?.trim()
    const definition = cols[defIdx]?.trim()
    if (!word || !definition) continue
    rows.push({
      word,
      definition,
      reading: readingIdx !== -1 ? cols[readingIdx]?.trim() || undefined : undefined,
      example: exampleIdx !== -1 ? cols[exampleIdx]?.trim() || undefined : undefined,
      example_translation: exTransIdx !== -1 ? cols[exTransIdx]?.trim() || undefined : undefined,
    })
  }

  return { rows }
}

// ─── Format detection ─────────────────────────────────────────────────────────

export function detectFormat(text: string): 'anki' | 'csv' {
  const firstLine = text.split('\n')[0]
  if (firstLine.startsWith('#') || firstLine.includes('\t')) return 'anki'
  return 'csv'
}

// ─── Shared utilities ─────────────────────────────────────────────────────────

function findCol(header: string[], candidates: string[]): number {
  for (const c of candidates) {
    const idx = header.findIndex((h) => h.includes(c))
    if (idx !== -1) return idx
  }
  return -1
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

export const parseTabSeparated = (text: string) => parseAnkiTxt(text).rows
