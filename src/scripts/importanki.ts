#!/usr/bin/env node
/**
 * VocabForge — Anki APKG Import Script
 *
 * Usage:  npm run import:anki -- <file.apkg> --deck "Deck Name" --language Japanese
 * Env:    SUPABASE_URL, SUPABASE_SERVICE_KEY, ANKI_USER_ID  (from .env.local)
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import * as readline from 'node:readline'
import * as crypto from 'node:crypto'
import { createWriteStream, mkdirSync } from 'node:fs'
import yauzl from 'yauzl'
import Database from 'better-sqlite3'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ─── 1. Env loader ────────────────────────────────────────────────────────────

function loadEnv(envPath: string): void {
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnv(path.join(process.cwd(), '.env.local'))
loadEnv(path.join(process.cwd(), '..', '.env.local'))

// ─── 2. Types ─────────────────────────────────────────────────────────────────

export type FieldRole =
  | 'word'
  | 'definition'
  | 'reading'
  | 'example'
  | 'example_translation'
  | 'sentence'
  | 'sentence_translation'
  | 'word_audio'
  | 'sentence_audio'
  | 'image'
  | 'notes'
  | 'skip'

export type FieldMapping = Record<number, FieldRole>

export interface AnkiModel {
  id: string
  name: string
  fields: string[]
}

export interface AnkiNote {
  id: number
  mid: string
  fields: string[]
  tags: string
}

export interface MappedWord {
  word?: string
  definition?: string
  reading?: string
  example?: string
  example_translation?: string
  sentence?: string
  sentence_translation?: string
  word_audio?: string
  sentence_audio?: string
  image?: string
  notes?: string
  card_type: 'word' | 'sentence'
  tags: string
}

export interface WordInsert {
  user_id: string
  list_id: string
  word: string
  definition: string
  reading?: string
  example?: string
  example_translation?: string
  notes?: string
  image_url?: string
  sentence_audio_url?: string
  word_audio_url?: string
  card_type: 'word' | 'sentence'
  language: string
  source: string
}

// ─── 3. ZIP extraction ────────────────────────────────────────────────────────

function extractApkg(apkgPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocabforge-anki-'))

    const cleanup = () => {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch { /* ignore */ }
    }
    process.on('exit', cleanup)
    process.on('SIGINT', () => { cleanup(); process.exit(1) })
    process.on('SIGTERM', () => { cleanup(); process.exit(1) })

    yauzl.open(apkgPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(new Error(`Cannot open APKG: ${err.message}`))
      if (!zipfile) return reject(new Error('Failed to open ZIP file'))

      zipfile.readEntry()

      zipfile.on('entry', (entry) => {
        if (/\/$/.test(entry.fileName)) {
          zipfile.readEntry()
          return
        }
        const outPath = path.join(tmpDir, entry.fileName.replace(/\//g, path.sep))
        mkdirSync(path.dirname(outPath), { recursive: true })

        zipfile.openReadStream(entry, (streamErr, readStream) => {
          if (streamErr) return reject(streamErr)
          if (!readStream) return reject(new Error('No read stream for entry'))

          const writeStream = createWriteStream(outPath)
          readStream.pipe(writeStream)
          writeStream.on('close', () => zipfile.readEntry())
          writeStream.on('error', reject)
        })
      })

      zipfile.on('end', () => resolve(tmpDir))
      zipfile.on('error', reject)
    })
  })
}

// ─── 4. SQLite parsing ────────────────────────────────────────────────────────

function openCollection(tmpDir: string): Database.Database {
  const db2Path = path.join(tmpDir, 'collection.anki2')
  if (fs.existsSync(db2Path)) return new Database(db2Path, { readonly: true })

  const db21Path = path.join(tmpDir, 'collection.anki21')
  if (fs.existsSync(db21Path)) return new Database(db21Path, { readonly: true })

  throw new Error('No collection.anki2 or collection.anki21 found in APKG')
}

function parseModels(db: Database.Database): Map<string, AnkiModel> {
  const row = db.prepare('SELECT models FROM col LIMIT 1').get() as { models: string } | undefined
  if (!row) throw new Error('No col table found in collection')

  const modelsJson = JSON.parse(row.models) as Record<
    string,
    { name: string; flds: Array<{ name: string }> }
  >
  const models = new Map<string, AnkiModel>()
  for (const [id, model] of Object.entries(modelsJson)) {
    models.set(id, { id, name: model.name, fields: model.flds.map((f) => f.name) })
  }
  return models
}

function fetchNotesByModel(db: Database.Database, modelId: string): AnkiNote[] {
  const midNum = parseInt(modelId, 10)
  const rows = db
    .prepare('SELECT id, mid, flds, tags FROM notes WHERE mid = ?')
    .all(midNum) as Array<{ id: number; mid: number; flds: string; tags: string }>

  return rows.map((r) => ({
    id: r.id,
    mid: String(r.mid),
    fields: r.flds.split('\x1f'),
    tags: r.tags.trim(),
  }))
}

function fetchMediaMap(tmpDir: string): Map<number, string> {
  const mediaPath = path.join(tmpDir, 'media')
  if (!fs.existsSync(mediaPath)) return new Map()

  const mediaJson = JSON.parse(fs.readFileSync(mediaPath, 'utf8')) as Record<string, string>
  const map = new Map<number, string>()
  for (const [num, name] of Object.entries(mediaJson)) {
    map.set(parseInt(num, 10), name)
  }
  return map
}

/**
 * Extract media references from a raw field value, strip HTML, decode entities.
 */
function parseFieldValue(raw: string): { text: string; audioFile?: string; imageFile?: string } {
  let audioFile: string | undefined
  let imageFile: string | undefined
  let s = raw

  const soundMatch = s.match(/\[sound:([^\]]+)\]/)
  if (soundMatch) {
    audioFile = soundMatch[1]
    s = s.replace(soundMatch[0], '')
  }

  const imgMatch = s.match(/<img[^>]+src=["']?([^"'\s>]+)["']?[^>]*>/i)
  if (imgMatch) {
    imageFile = imgMatch[1]
    s = s.replace(imgMatch[0], '')
  }

  s = s
    .replace(/<[^>]+>/g, '')
    .replace(/\[sound:[^\]]+\]/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(parseInt(code, 10)))
    .trim()

  return { text: s, audioFile, imageFile }
}

// ─── 5. Mapping cache ─────────────────────────────────────────────────────────

const CACHE_DIR = path.join(os.homedir(), '.vocabforge', 'anki-mappings')

function getCacheKey(modelName: string, fieldNames: string[]): string {
  const content = `${modelName}:${fieldNames.join('|')}`
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16)
}

function loadMappingCache(modelName: string, fieldNames: string[]): FieldMapping | null {
  const hash = getCacheKey(modelName, fieldNames)
  const cachePath = path.join(CACHE_DIR, `${hash}.json`)
  if (!fs.existsSync(cachePath)) return null
  try {
    return JSON.parse(fs.readFileSync(cachePath, 'utf8')) as FieldMapping
  } catch {
    return null
  }
}

function saveMappingCache(modelName: string, fieldNames: string[], mapping: FieldMapping): void {
  mkdirSync(CACHE_DIR, { recursive: true })
  const hash = getCacheKey(modelName, fieldNames)
  const cachePath = path.join(CACHE_DIR, `${hash}.json`)
  fs.writeFileSync(cachePath, JSON.stringify(mapping, null, 2))
}

// ─── 6. Interactive mapper ────────────────────────────────────────────────────

const ROLE_DESCRIPTIONS: Record<FieldRole, string> = {
  word:                 'Word / term (required)',
  definition:           'Definition / meaning (required)',
  reading:              'Reading / pronunciation',
  example:              'Example sentence',
  example_translation:  'Example sentence translation',
  sentence:             'Main sentence (for sentence cards)',
  sentence_translation: 'Sentence translation',
  word_audio:           'Word audio',
  sentence_audio:       'Sentence audio',
  image:                'Image',
  notes:                'Extra notes',
  skip:                 'Skip this field',
}

const ALL_ROLES: FieldRole[] = [
  'word', 'definition', 'reading', 'example', 'example_translation',
  'sentence', 'sentence_translation', 'word_audio', 'sentence_audio',
  'image', 'notes', 'skip',
]

function renderMappingTable(fields: string[], mapping: FieldMapping, sample: string[]): string {
  const lines: string[] = ['  Fields:']
  fields.forEach((name, i) => {
    const role = mapping[i]
    const roleStr =
      !role || role === 'skip'
        ? '\x1b[33mskip\x1b[0m'
        : `\x1b[32m${role}\x1b[0m`
    const val = (sample[i] ?? '').slice(0, 40).replace(/\n/g, ' ')
    lines.push(`  [${i + 1}] ${name.padEnd(22)} → ${roleStr.padEnd(40)}  sample: "${val}"`)
  })
  return lines.join('\n')
}

function renderPreview(fields: string[], mapping: FieldMapping, sample: string[]): string {
  void fields
  const get = (role: FieldRole): string => {
    const entry = Object.entries(mapping).find(([, r]) => r === role)
    if (!entry) return ''
    return (sample[parseInt(entry[0])] ?? '').slice(0, 60)
  }

  const word    = get('word') || get('sentence') || '...'
  const def     = get('definition') || get('sentence_translation') || '...'
  const reading = get('reading')
  const example = get('example') || get('sentence')

  const lines = [
    '  ┌─────────────────────────────────────────┐',
    `  │ ${word.padEnd(41)}│`,
    reading ? `  │ ${reading.padEnd(41)}│` : null,
    `  │ ${def.padEnd(41)}│`,
    example ? `  │ ${'e.g. '.concat(example).slice(0, 41).padEnd(41)}│` : null,
    '  └─────────────────────────────────────────┘',
  ].filter(Boolean) as string[]

  return lines.join('\n')
}

async function promptMapping(
  model: AnkiModel,
  notes: AnkiNote[],
  cachedMapping: FieldMapping | null,
): Promise<FieldMapping> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const ask = (q: string): Promise<string> =>
    new Promise((resolve) => rl.question(q, resolve))

  const sample = notes[0]?.fields ?? []
  const mapping: FieldMapping = cachedMapping ? { ...cachedMapping } : {}

  for (let i = 0; i < model.fields.length; i++) {
    if (mapping[i] === undefined) mapping[i] = 'skip'
  }

  console.log(
    `\n\x1b[1m═══ Note Type: ${model.name} (${model.fields.length} fields, ${notes.length} notes) ═══\x1b[0m`,
  )
  if (cachedMapping) {
    console.log('  \x1b[36m(Loaded saved mapping — press Enter to use)\x1b[0m')
  }

  while (true) {
    console.log('\n' + renderMappingTable(model.fields, mapping, sample))
    console.log('\n' + renderPreview(model.fields, mapping, sample))

    const hasWord = Object.values(mapping).some((r) => r === 'word' || r === 'sentence')
    const hasDef  = Object.values(mapping).some(
      (r) => r === 'definition' || r === 'sentence_translation',
    )

    if (hasWord && hasDef) {
      console.log('\n  \x1b[32m✓ Primary and definition fields mapped\x1b[0m')
    } else {
      console.log(
        '\n  \x1b[33m⚠ Map at least: word (or sentence) + definition (or sentence_translation)\x1b[0m',
      )
    }

    const input = await ask('\n  Map field number (1-N), or Enter to accept: ')

    if (input.trim() === '') {
      if (!hasWord || !hasDef) {
        const skip = await ask('  Missing required fields. Skip this note type? [y/N]: ')
        if (skip.trim().toLowerCase() === 'y') { rl.close(); return {} }
        continue
      }
      break
    }

    const fieldNum = parseInt(input.trim(), 10)
    if (isNaN(fieldNum) || fieldNum < 1 || fieldNum > model.fields.length) {
      console.log(`  Invalid field number. Enter 1–${model.fields.length}.`)
      continue
    }

    const fieldIdx = fieldNum - 1
    console.log(`\n  Roles for field "${model.fields[fieldIdx]}":`)
    ALL_ROLES.forEach((role, i) => {
      console.log(`    [${i + 1}] ${role.padEnd(25)} ${ROLE_DESCRIPTIONS[role]}`)
    })

    const roleInput = await ask('  Select role number: ')
    const roleIdx   = parseInt(roleInput.trim(), 10) - 1
    if (isNaN(roleIdx) || roleIdx < 0 || roleIdx >= ALL_ROLES.length) {
      console.log('  Invalid role number.')
      continue
    }

    mapping[fieldIdx] = ALL_ROLES[roleIdx]
  }

  rl.close()
  return mapping
}

// ─── Apply mapping to a single note ──────────────────────────────────────────

function applyNoteMapping(note: AnkiNote, mapping: FieldMapping): MappedWord | null {
  const get = (role: FieldRole) => {
    const entry = Object.entries(mapping).find(([, r]) => r === role)
    if (!entry) return undefined
    return parseFieldValue(note.fields[parseInt(entry[0])] ?? '')
  }

  const word          = get('word')
  const sentence      = get('sentence')
  const definition    = get('definition')
  const sentenceTrans = get('sentence_translation')

  const hasSentenceRole = Object.values(mapping).some(
    (r) => r === 'sentence' || r === 'sentence_translation',
  )
  const card_type: 'word' | 'sentence' = hasSentenceRole ? 'sentence' : 'word'

  const primary = word ?? sentence
  if (!primary?.text) return null

  const wordAudioField = get('word_audio')
  const sentAudioField = get('sentence_audio')
  const imageField     = get('image')

  return {
    word:                word?.text || sentence?.text,
    definition:          definition?.text || sentenceTrans?.text,
    reading:             get('reading')?.text,
    example:             get('example')?.text,
    example_translation: get('example_translation')?.text,
    sentence:            sentence?.text,
    sentence_translation: sentenceTrans?.text,
    word_audio:          wordAudioField?.audioFile ?? word?.audioFile,
    sentence_audio:      sentAudioField?.audioFile ?? sentence?.audioFile,
    image:               imageField?.imageFile,
    notes:               get('notes')?.text,
    card_type,
    tags:                note.tags,
  }
}

// ─── 7. Supabase import ───────────────────────────────────────────────────────

async function createDeck(
  client: SupabaseClient,
  userId: string,
  deckName: string,
  language: string,
): Promise<string> {
  const { data, error } = await client
    .from('word_lists')
    .insert({ user_id: userId, name: deckName, language, source: 'anki_import' })
    .select('id')
    .single()
  if (error) throw new Error(`Failed to create deck: ${error.message}`)
  return (data as { id: string }).id
}

async function ensureMediaBucket(client: SupabaseClient): Promise<void> {
  const { error } = await client.storage.createBucket('media', { public: true })
  if (
    error &&
    !error.message.includes('already exists') &&
    !error.message.includes('duplicate')
  ) {
    throw new Error(`Failed to create storage bucket: ${error.message}`)
  }
}

async function uploadMediaFile(
  client: SupabaseClient,
  userId: string,
  listId: string,
  localPath: string,
  originalName: string,
): Promise<string> {
  const fileBuffer = fs.readFileSync(localPath)
  const ext = path.extname(originalName).toLowerCase()
  const storagePath = `${userId}/anki/${listId}/${originalName}`.replace(/\\/g, '/')

  const mimeMap: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  }
  const contentType = mimeMap[ext] ?? 'application/octet-stream'

  const { error } = await client.storage
    .from('media')
    .upload(storagePath, fileBuffer, { contentType, upsert: true })
  if (error) throw new Error(`Media upload failed for ${originalName}: ${error.message}`)

  const { data } = client.storage.from('media').getPublicUrl(storagePath)
  return data.publicUrl
}

async function insertWordsBatch(
  client: SupabaseClient,
  words: WordInsert[],
  batchSize = 50,
): Promise<string[]> {
  const ids: string[] = []
  const errors: string[] = []

  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize)
    const { data, error } = await client.from('words').insert(batch).select('id')
    if (error) {
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
      continue
    }
    ids.push(...((data as Array<{ id: string }>)?.map((r) => r.id) ?? []))
    process.stdout.write(
      `\r  Inserting words: ${Math.min(i + batchSize, words.length)}/${words.length}`,
    )
  }
  process.stdout.write('\n')

  if (errors.length > 0) {
    console.error(
      `  \x1b[31mInsert errors:\x1b[0m\n${errors.map((e) => `    - ${e}`).join('\n')}`,
    )
  }
  return ids
}

async function insertSrsCards(
  client: SupabaseClient,
  userId: string,
  wordIds: string[],
  batchSize = 50,
): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  const cards = wordIds.map((word_id) => ({
    user_id: userId,
    word_id,
    ease_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
    due_date: today,
    last_reviewed: null,
  }))

  for (let i = 0; i < cards.length; i += batchSize) {
    const batch = cards.slice(i, i + batchSize)
    const { error } = await client.from('srs_cards').insert(batch)
    if (error) console.error(`  SRS batch error: ${error.message}`)
    process.stdout.write(
      `\r  Creating SRS cards: ${Math.min(i + batchSize, cards.length)}/${cards.length}`,
    )
  }
  process.stdout.write('\n')
}

// ─── 8. Main orchestrator ─────────────────────────────────────────────────────

function parseArgs(argv: string[]): {
  apkgPath: string
  deckName: string
  language: string
  userId: string
} {
  const args = argv.slice(2)

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`VocabForge Anki Importer

Usage:
  npm run import:anki -- <file.apkg> --deck <name> --language <lang> [--user-id <uid>]

Options:
  --deck       Deck name to create in VocabForge (required)
  --language   Language of the deck (default: Japanese)
  --user-id    Supabase user ID (or set ANKI_USER_ID env var)

.env.local variables:
  SUPABASE_URL          https://xxx.supabase.co
  SUPABASE_SERVICE_KEY  eyJ... (service role key — bypasses RLS)
  ANKI_USER_ID          your auth.users uid

Example:
  npm run import:anki -- ./n3vocab.apkg --deck "N3 Vocab" --language Japanese`)
    process.exit(0)
  }

  const apkgPath = args[0]
  let deckName = ''
  let language = 'Japanese'
  let userId   = process.env.ANKI_USER_ID ?? ''

  for (let i = 1; i < args.length; i++) {
    if      (args[i] === '--deck'     && args[i + 1]) { deckName = args[++i] }
    else if (args[i] === '--language' && args[i + 1]) { language = args[++i] }
    else if (args[i] === '--user-id'  && args[i + 1]) { userId   = args[++i] }
  }

  if (!apkgPath)                { console.error('Error: APKG file path required.');           process.exit(1) }
  if (!fs.existsSync(apkgPath)) { console.error(`Error: File not found: ${apkgPath}`);        process.exit(1) }
  if (!deckName)                { console.error('Error: --deck name required.');               process.exit(1) }
  if (!userId)                  { console.error('Error: --user-id or ANKI_USER_ID required.'); process.exit(1) }

  return { apkgPath, deckName, language, userId }
}

async function main(): Promise<void> {
  const { apkgPath, deckName, language, userId } = parseArgs(process.argv)

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !serviceKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env.local')
    process.exit(1)
  }

  const client = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  console.log('\n\x1b[1mVocabForge Anki Importer\x1b[0m')
  console.log(`  File:     ${apkgPath}`)
  console.log(`  Deck:     ${deckName}`)
  console.log(`  Language: ${language}`)
  console.log(`  User ID:  ${userId}`)

  // ── Step 1: Extract ──────────────────────────────────────────────────────
  console.log('\n[1/5] Extracting APKG...')
  const tmpDir = await extractApkg(path.resolve(apkgPath))
  console.log(`  Extracted to: ${tmpDir}`)

  // ── Step 2: Parse collection ─────────────────────────────────────────────
  console.log('\n[2/5] Reading collection...')
  const db       = openCollection(tmpDir)
  const models   = parseModels(db)
  const mediaMap = fetchMediaMap(tmpDir)
  console.log(`  Found ${models.size} note type(s), ${mediaMap.size} media file(s)`)

  // ── Step 3: Interactive field mapping ────────────────────────────────────
  console.log('\n[3/5] Mapping fields...')
  const allMappedWords: MappedWord[] = []

  for (const [modelId, model] of models) {
    const notes = fetchNotesByModel(db, modelId)
    if (notes.length === 0) {
      console.log(`  Skipping "${model.name}": no notes`)
      continue
    }

    const cached  = loadMappingCache(model.name, model.fields)
    const mapping = await promptMapping(model, notes, cached)

    if (Object.keys(mapping).length === 0) {
      console.log(`  Skipped "${model.name}".`)
      continue
    }

    saveMappingCache(model.name, model.fields, mapping)

    let mapped = 0
    for (const note of notes) {
      const word = applyNoteMapping(note, mapping)
      if (word) { allMappedWords.push(word); mapped++ }
    }
    console.log(`  Mapped ${mapped}/${notes.length} notes from "${model.name}"`)
  }

  db.close()

  if (allMappedWords.length === 0) {
    console.log('\nNo cards to import. Exiting.')
    process.exit(0)
  }

  // ── Step 4: Confirm ──────────────────────────────────────────────────────
  const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout })
  const confirm = await new Promise<string>((resolve) =>
    rl2.question(
      `\n  Import ${allMappedWords.length} cards to deck "${deckName}"? [Y/n]: `,
      resolve,
    ),
  )
  rl2.close()

  if (confirm.trim().toLowerCase() === 'n') {
    console.log('Cancelled.')
    process.exit(0)
  }

  // ── Step 5: Import to Supabase ───────────────────────────────────────────
  console.log('\n[5/5] Importing to Supabase...')

  const listId = await createDeck(client, userId, deckName, language)
  console.log(`  Created deck: ${listId}`)

  // Upload media
  const audioUrlMap = new Map<string, string>()
  const imageUrlMap = new Map<string, string>()
  const audioExts   = new Set(['.mp3', '.ogg', '.wav', '.m4a'])

  const referencedMedia = new Set(
    allMappedWords.flatMap((w) =>
      [w.word_audio, w.sentence_audio, w.image].filter(Boolean) as string[],
    ),
  )

  if (referencedMedia.size > 0) {
    await ensureMediaBucket(client)
    console.log(`  Uploading ${referencedMedia.size} unique media file(s)...`)

    let uploaded     = 0
    let uploadErrors = 0

    for (const [num, originalName] of mediaMap) {
      if (!referencedMedia.has(originalName)) continue
      const localPath = path.join(tmpDir, String(num))
      if (!fs.existsSync(localPath)) continue

      try {
        const url = await uploadMediaFile(client, userId, listId, localPath, originalName)
        const ext = path.extname(originalName).toLowerCase()
        if (audioExts.has(ext)) audioUrlMap.set(originalName, url)
        else imageUrlMap.set(originalName, url)
        uploaded++
        process.stdout.write(`\r  Uploaded: ${uploaded}/${referencedMedia.size}`)
      } catch (err) {
        uploadErrors++
        console.error(`\n  Upload error for ${originalName}: ${err}`)
      }
    }
    process.stdout.write('\n')
    if (uploadErrors > 0) console.warn(`  ${uploadErrors} media file(s) failed to upload`)
  }

  // Build word inserts
  const wordInserts: WordInsert[] = allMappedWords
    .map((w): WordInsert | null => {
      const word       = (w.word ?? w.sentence ?? '').trim()
      const definition = (w.definition ?? w.sentence_translation ?? '').trim()
      if (!word || !definition) return null

      return {
        user_id:             userId,
        list_id:             listId,
        word,
        definition,
        reading:             w.reading             || undefined,
        example:             w.example             || w.sentence || undefined,
        example_translation: w.example_translation || w.sentence_translation || undefined,
        notes:               w.notes               || undefined,
        image_url:           w.image          ? imageUrlMap.get(w.image)          : undefined,
        sentence_audio_url:  w.sentence_audio ? audioUrlMap.get(w.sentence_audio) : undefined,
        word_audio_url:      w.word_audio     ? audioUrlMap.get(w.word_audio)     : undefined,
        card_type:           w.card_type,
        language,
        source:              `anki_import:${path.basename(apkgPath)}`,
      }
    })
    .filter((w): w is WordInsert => w !== null)

  const wordIds = await insertWordsBatch(client, wordInserts)
  console.log(`  Inserted ${wordIds.length} words`)

  await insertSrsCards(client, userId, wordIds)
  console.log(`  Created ${wordIds.length} SRS cards`)

  const errorCount = allMappedWords.length - wordIds.length
  console.log(
    `\n\x1b[1m\x1b[32mDone!\x1b[0m ${wordIds.length} cards imported to deck "${deckName}"` +
      (errorCount > 0 ? `, ${errorCount} errors` : '') +
      '.',
  )
  console.log(`  Deck ID: ${listId}`)
}

main().catch((err) => {
  console.error('\x1b[31mFatal error:\x1b[0m', err instanceof Error ? err.message : err)
  process.exit(1)
})
