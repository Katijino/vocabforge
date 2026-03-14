import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FREE_STORY_LIMIT = 5

// Structured error codes for client-side handling
type ErrorCode =
  | 'MISSING_AUTH'
  | 'UNAUTHORIZED'
  | 'STORY_LIMIT_REACHED'
  | 'NO_WORDS_FOUND'
  | 'MISSING_API_KEY'
  | 'AI_PROVIDER_ERROR'
  | 'AI_EMPTY_RESPONSE'
  | 'RATE_LIMITED'
  | 'INVALID_REQUEST'
  | 'SAVE_FAILED'
  | 'INTERNAL_ERROR'

function errorJson(code: ErrorCode, message: string, status: number, details?: Record<string, unknown>) {
  const payload: Record<string, unknown> = { error: message, code }
  if (details) payload.details = details
  console.error(`[generate-story] ${code}:`, message, details ?? '')
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

async function translateToEnglish(text: string, language: string): Promise<string | null> {
  if (language.toLowerCase() === 'english') return null
  try {
    const res = await fetch('https://translate.googleapis.com/translate_a/single', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client: 'gtx', sl: 'auto', tl: 'en', dt: 't', q: text }),
    })
    if (!res.ok) return null
    const data = await res.json() as Array<unknown>
    if (!Array.isArray(data[0])) return null
    return (data[0] as Array<[string, ...unknown[]]>).map(c => c[0]).join('')
  } catch {
    return null
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return errorJson('MISSING_AUTH', 'Missing Authorization header', 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return errorJson('UNAUTHORIZED', 'Invalid or expired session', 401)
    }

    let body: { time_window?: number; language?: string; deck_id?: string | null; word_ids?: string[] | null }
    try {
      body = await req.json()
    } catch {
      return errorJson('INVALID_REQUEST', 'Request body must be valid JSON', 400)
    }

    const timeWindow = body.time_window ?? 7
    const language = body.language ?? 'Japanese'
    const deckId = body.deck_id ?? null
    const wordIds = body.word_ids && body.word_ids.length > 0 ? body.word_ids : null

    // Validate time_window
    if (![7, 14, 30].includes(timeWindow) && !wordIds) {
      return errorJson('INVALID_REQUEST', `time_window must be 7, 14, or 30 (got ${timeWindow})`, 400)
    }

    // Check settings + free tier
    const { data: settings, error: settingsErr } = await supabase
      .from('user_settings')
      .select('stories_used_month, stories_reset_at, subscription_tier')
      .eq('user_id', user.id)
      .single()

    if (settingsErr) {
      console.error('[generate-story] Failed to load user_settings:', settingsErr)
    }

    const isPro = settings?.subscription_tier === 'pro'
    const storiesUsed = settings?.stories_used_month ?? 0

    // Monthly reset check
    const resetAt = new Date(settings?.stories_reset_at ?? 0)
    const monthStart = new Date()
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    const actualUsed = resetAt < monthStart ? 0 : storiesUsed

    if (!isPro && actualUsed >= FREE_STORY_LIMIT) {
      return errorJson(
        'STORY_LIMIT_REACHED',
        'Story limit reached. Upgrade to Pro for unlimited stories.',
        402,
        { used: actualUsed, limit: FREE_STORY_LIMIT }
      )
    }

    let words: Array<{ id: string; word: string; definition: string }> | null = null

    if (wordIds) {
      const { data, error: wordsErr } = await supabase
        .from('words')
        .select('id, word, definition')
        .eq('user_id', user.id)
        .in('id', wordIds)
        .limit(30)
      if (wordsErr) console.error('[generate-story] Word fetch error:', wordsErr)
      words = data
    } else {
      const since = new Date()
      since.setDate(since.getDate() - timeWindow)

      let query = supabase
        .from('srs_cards')
        .select('word_id, words!inner(id, word, definition)')
        .eq('user_id', user.id)
        .gte('learned_at', since.toISOString())
        .not('learned_at', 'is', null)
        .order('learned_at', { ascending: false })
        .limit(30)

      if (deckId) {
        query = query.eq('words.list_id', deckId)
      }

      const { data: cardData, error: cardErr } = await query
      if (cardErr) console.error('[generate-story] SRS card fetch error:', cardErr)
      words = cardData?.map((c) => c.words as { id: string; word: string; definition: string }) ?? null
    }

    if (!words || words.length === 0) {
      const deckMsg = deckId ? ' in this deck' : ''
      return errorJson(
        'NO_WORDS_FOUND',
        `No learned words${deckMsg} in this time window. Study some cards first!`,
        400,
        { time_window: timeWindow, deck_id: deckId }
      )
    }

    // Compute cache key
    const sortedIds = [...words.map((w) => w.id)].sort()
    const cacheInput = sortedIds.join(',') + '|' + language
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(cacheInput))
    const cacheKey = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('')

    // Check cache (< 3 days old)
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const { data: cached } = await supabase
      .from('generated_stories')
      .select('id, title, content, content_translation')
      .eq('user_id', user.id)
      .eq('cache_key', cacheKey)
      .gte('generated_at', threeDaysAgo.toISOString())
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Only use cache if the story already has a translation (or language is English)
    if (cached && (cached.content_translation || language.toLowerCase() === 'english')) {
      return json({ id: cached.id, title: cached.title, content: cached.content, cached: true })
    }

    // Check API key before attempting fetch
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      return errorJson('MISSING_API_KEY', 'AI provider is not configured (GEMINI_API_KEY missing)', 500)
    }

    const wordList = words.map((w) => `${w.word} (${w.definition})`).join(', ')
    console.log(`[generate-story] Calling Gemini for user=${user.id}, language=${language}, words=${words.length}`)

    const prompt = `
Write a short, natural story in ${language} that is 200–300 words long.

Vocabulary list:
${wordList}

Requirements:
- Use at least 75% of the words from the vocabulary list.
- Each vocabulary word that you choose to use must appear at least once in the story.
- Integrate the words naturally into the narrative (do not list them or force them unnaturally).
- Do NOT bold, highlight, or mark the vocabulary words in any way.
- Do NOT output the vocabulary list again.

Output format:
- Start with a title formatted exactly like this: Title: <story title>
- After the title, write the story as normal paragraphs.

The story should be engaging, coherent, and easy for a learner of ${language} to read.
`

    const geminiBody = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 600, temperature: 0.8 },
    })

    // Retry with exponential backoff for rate limits
    let geminiRes: Response | null = null
    let lastErrText = ''
    const maxAttempts = 3
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiKey}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: geminiBody }
        )
      } catch (fetchErr) {
        console.error(`[generate-story] Network error (attempt ${attempt}):`, fetchErr)
        if (attempt === maxAttempts) {
          return errorJson('AI_PROVIDER_ERROR', 'Could not reach AI provider (network failure)', 503, { cause: String(fetchErr) })
        }
        await new Promise((r) => setTimeout(r, 1000 * attempt))
        continue
      }

      if (geminiRes.ok) break

      lastErrText = await geminiRes.text()
      console.error(`[generate-story] Gemini HTTP ${geminiRes.status} (attempt ${attempt}):`, lastErrText)

      if (geminiRes.status === 429 && attempt < maxAttempts) {
        const retryAfter = geminiRes.headers.get('Retry-After')
        const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 2000 * attempt
        console.log(`[generate-story] Rate limited, waiting ${waitMs}ms before retry`)
        await new Promise((r) => setTimeout(r, waitMs))
        continue
      }

      // Non-retryable error
      break
    }

    if (!geminiRes || !geminiRes.ok) {
      let geminiErrMessage = lastErrText
      try {
        geminiErrMessage = JSON.parse(lastErrText)?.error?.message ?? lastErrText
      } catch { /* use raw text */ }

      const status = geminiRes?.status ?? 0
      const code = status === 429 ? 'RATE_LIMITED' : 'AI_PROVIDER_ERROR'
      const message = status === 429
        ? 'AI is temporarily busy. Please try again in a few seconds.'
        : status === 403
        ? 'AI API key is invalid or lacks permission'
        : status === 400
        ? 'AI rejected the request (invalid prompt or model config)'
        : `AI provider returned an error (HTTP ${status})`

      return errorJson(code, message, 500, { provider_status: status, provider_message: geminiErrMessage })
    }

    const geminiData = await geminiRes.json() as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> }
        finishReason?: string
      }>
      promptFeedback?: { blockReason?: string }
    }

    // Check for content blocking
    if (geminiData.promptFeedback?.blockReason) {
      console.error('[generate-story] Gemini blocked prompt:', geminiData.promptFeedback.blockReason)
      return errorJson('INVALID_PROMPT', `AI blocked the prompt: ${geminiData.promptFeedback.blockReason}`, 400)
    }

    const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (!content) {
      console.error('[generate-story] Gemini returned empty content. Full response:', JSON.stringify(geminiData))
      return errorJson(
        'AI_EMPTY_RESPONSE',
        'AI returned an empty story. Try again or use different words.',
        500,
        { finish_reason: geminiData.candidates?.[0]?.finishReason }
      )
    }

    // Extract title
    const titleMatch = content.match(/^Title:\s*(.+)/m)
    const title = titleMatch ? titleMatch[1].trim() : `${language} Story — ${new Date().toLocaleDateString()}`

    // Translate story body and title to English
    const bodyContent = content.replace(/^Title:.*\n?/, '').trim()
    const contentTranslation = await translateToEnglish(bodyContent, language)
    const titleTranslation = await translateToEnglish(title, language)
    console.log(`[generate-story] Translation: ${contentTranslation ? 'ok' : 'skipped/failed'}`)

    // Save story
    const { data: story, error: insertErr } = await supabase
      .from('generated_stories')
      .insert({
        user_id: user.id,
        title,
        title_translation: titleTranslation ?? null,
        content,
        content_translation: contentTranslation ?? null,
        language,
        word_ids: words.map((w) => w.id),
        time_window: wordIds ? 0 : timeWindow,
        cache_key: cacheKey,
      })
      .select()
      .single()

    if (insertErr || !story) {
      console.error('[generate-story] DB insert failed:', insertErr)
      return errorJson('SAVE_FAILED', 'Story was generated but could not be saved', 500)
    }

    // Increment stories_used_month (fixed logic)
    await supabase
      .from('user_settings')
      .update({
        stories_used_month: actualUsed + 1,
        stories_reset_at: resetAt < monthStart ? monthStart.toISOString() : settings?.stories_reset_at,
      })
      .eq('user_id', user.id)

    console.log(`[generate-story] Success: story=${story.id} for user=${user.id}`)
    return json({ id: story.id, title: story.title, content: story.content, cached: false })
  } catch (e) {
    console.error('[generate-story] Unhandled exception:', e)
    return errorJson('INTERNAL_ERROR', 'An unexpected error occurred', 500, { cause: String(e) })
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
