export interface ParsedWord {
  word: string
  definition: string
  reading?: string
  example?: string
}

/**
 * Parse Anki .txt export (tab-separated: word\tdefinition[\ttags])
 * or Quizlet export (tab-separated: word\tdefinition)
 * or generic CSV with configurable columns
 */
export function parseTabSeparated(text: string): ParsedWord[] {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
  const results: ParsedWord[] = []

  for (const line of lines) {
    const cols = line.split('\t')
    if (cols.length < 2) continue
    const word = cols[0].trim()
    const definition = cols[1].trim()
    if (!word || !definition) continue
    results.push({ word, definition })
  }

  return results
}

/**
 * Parse generic CSV with header row.
 * Attempts to auto-detect columns named: word/term/front, definition/meaning/back
 */
export function parseCSV(text: string): { rows: ParsedWord[]; error?: string } {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return { rows: [], error: 'File appears empty.' }

  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim())

  const wordIdx = findCol(header, ['word', 'term', 'front', 'vocabulary', 'vocab'])
  const defIdx  = findCol(header, ['definition', 'meaning', 'back', 'translation', 'def'])

  if (wordIdx === -1 || defIdx === -1) {
    // Fall back to treating as tab-separated
    const rows = parseTabSeparated(text)
    if (rows.length > 0) return { rows }
    return { rows: [], error: 'Could not detect word/definition columns. Expected headers: word, definition (or similar).' }
  }

  const readingIdx = findCol(header, ['reading', 'furigana', 'pronunciation', 'phonetic'])
  const exampleIdx = findCol(header, ['example', 'sentence', 'context'])

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
    })
  }

  return { rows }
}

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

export function detectFormat(text: string): 'tsv' | 'csv' {
  const firstLine = text.split('\n')[0]
  return firstLine.includes('\t') ? 'tsv' : 'csv'
}
