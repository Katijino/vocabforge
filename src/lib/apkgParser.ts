/**
 * Browser-side APKG parser.
 * Uses fflate for ZIP extraction and sql.js (WASM) for SQLite.
 */

import { unzipSync } from 'fflate'
import initSqlJs from 'sql.js'

export interface ApkgModel {
  id: string
  name: string
  fields: string[]
}

export interface ApkgParsed {
  /** Models (note types) found in the deck */
  models: ApkgModel[]
  /** Raw field arrays per model id — rows for FieldMapper */
  rowsByModel: Map<string, string[][]>
  /** Media files: original name → Uint8Array bytes */
  mediaFiles: Map<string, Uint8Array>
}

/** Strip HTML tags and Anki-specific markup, decode entities. */
function stripField(raw: string): string {
  return raw
    .replace(/\[sound:[^\]]+\]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(parseInt(code, 10)))
    .trim()
}

export async function parseApkg(file: File): Promise<ApkgParsed> {
  // Read file as binary
  const buffer = await file.arrayBuffer()
  const uint8 = new Uint8Array(buffer)

  // Unzip
  const unzipped = unzipSync(uint8)

  // Find the SQLite collection (try both Anki 2.0 and 2.1 formats)
  const dbBytes = unzipped['collection.anki2'] ?? unzipped['collection.anki21']
  if (!dbBytes) throw new Error('Not a valid APKG: no collection database found.')

  // Init sql.js — WASM file served from /public/sql-wasm.wasm
  const SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' })
  const db = new SQL.Database(dbBytes)

  try {
    // Parse models (note types)
    const colResult = db.exec('SELECT models FROM col LIMIT 1')
    const modelsRaw = colResult[0]?.values[0]?.[0]
    if (!modelsRaw) throw new Error('Collection has no model data.')

    const modelsJson = JSON.parse(modelsRaw as string) as Record<
      string,
      { name: string; flds: Array<{ name: string }> }
    >

    const models: ApkgModel[] = Object.entries(modelsJson).map(([id, m]) => ({
      id,
      name: m.name,
      fields: m.flds.map((f) => f.name),
    }))

    // Fetch notes per model
    const rowsByModel = new Map<string, string[][]>()
    for (const model of models) {
      // Use CAST to ensure integer comparison works reliably
      const result = db.exec(
        `SELECT flds FROM notes WHERE CAST(mid AS TEXT) = ?`,
        [model.id],
      )
      const rows: string[][] = (result[0]?.values ?? []).map((row: unknown[]) =>
        (row[0] as string).split('\x1f').map(stripField),
      )
      if (rows.length > 0) rowsByModel.set(model.id, rows)
    }

    // Parse media manifest
    const mediaFiles = new Map<string, Uint8Array>()
    const mediaJsonBytes = unzipped['media']
    if (mediaJsonBytes) {
      const mediaJson = JSON.parse(
        new TextDecoder().decode(mediaJsonBytes),
      ) as Record<string, string>
      for (const [num, originalName] of Object.entries(mediaJson)) {
        const fileBytes = unzipped[num]
        if (fileBytes) mediaFiles.set(originalName, fileBytes)
      }
    }

    // Only return models that actually have notes
    const activeModels = models.filter((m) => rowsByModel.has(m.id))

    return { models: activeModels, rowsByModel, mediaFiles }
  } finally {
    db.close()
  }
}
