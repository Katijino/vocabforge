import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FREE_STORY_LIMIT = 5

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing Authorization' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) return json({ error: 'Unauthorized' }, 401)

    const body = await req.json() as { time_window?: number; language?: string }
    const timeWindow = body.time_window ?? 7
    const language = body.language ?? 'Japanese'

    // Check settings + free tier
    const { data: settings } = await supabase
      .from('user_settings')
      .select('stories_used_month, stories_reset_at, subscription_tier')
      .eq('user_id', user.id)
      .single()

    const isPro = settings?.subscription_tier === 'pro'
    const storiesUsed = settings?.stories_used_month ?? 0

    // Monthly reset check
    const resetAt = new Date(settings?.stories_reset_at ?? 0)
    const monthStart = new Date()
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    const actualUsed = resetAt < monthStart ? 0 : storiesUsed

    if (!isPro && actualUsed >= FREE_STORY_LIMIT) {
      return json({ error: 'Story limit reached. Upgrade to Pro for unlimited stories.' }, 402)
    }

    // Fetch words from time window
    const since = new Date()
    since.setDate(since.getDate() - timeWindow)

    const { data: words } = await supabase
      .from('words')
      .select('id, word, definition')
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(30)

    if (!words || words.length === 0) {
      return json({ error: `No words added in the last ${timeWindow} days. Add some vocabulary first!` }, 400)
    }

    // Compute cache key: sha256 of sorted word IDs + language
    const sortedIds = [...words.map((w) => w.id)].sort()
    const cacheInput = sortedIds.join(',') + '|' + language
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(cacheInput))
    const cacheKey = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('')

    // Check cache (< 3 days old)
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const { data: cached } = await supabase
      .from('generated_stories')
      .select('id, title, content')
      .eq('user_id', user.id)
      .eq('cache_key', cacheKey)
      .gte('generated_at', threeDaysAgo.toISOString())
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (cached) {
      return json({ id: cached.id, title: cached.title, content: cached.content, cached: true })
    }

    // Call Gemini 1.5 Flash
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) return json({ error: 'AI not configured' }, 500)

    const wordList = words.map((w) => `${w.word} (${w.definition})`).join(', ')
    const prompt = `Write a short story (200-300 words) in ${language} that naturally incorporates ALL of these vocabulary words: ${wordList}. Each word must appear at least once. Begin with "Title: ". Do not bold or mark the vocabulary words. Keep it natural and engaging.`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 600, temperature: 0.8 },
        }),
      }
    )

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error('Gemini error:', errText)
      return json({ error: 'AI generation failed' }, 500)
    }

    const geminiData = await geminiRes.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (!content) return json({ error: 'AI returned empty response' }, 500)

    // Extract title
    const titleMatch = content.match(/^Title:\s*(.+)/m)
    const title = titleMatch ? titleMatch[1].trim() : `${language} Story — ${new Date().toLocaleDateString()}`

    // Save story
    const { data: story, error: insertErr } = await supabase
      .from('generated_stories')
      .insert({
        user_id: user.id,
        title,
        content,
        language,
        word_ids: words.map((w) => w.id),
        time_window: timeWindow,
        cache_key: cacheKey,
      })
      .select()
      .single()

    if (insertErr || !story) return json({ error: 'Failed to save story' }, 500)

    // Increment stories_used_month
    await supabase
      .from('user_settings')
      .update({
        stories_used_month: actualUsed >= storiesUsed ? 1 : actualUsed + 1,
        stories_reset_at: resetAt < monthStart ? monthStart.toISOString() : settings?.stories_reset_at,
      })
      .eq('user_id', user.id)

    return json({ id: story.id, title: story.title, content: story.content, cached: false })
  } catch (e) {
    console.error('generate-story error:', e)
    return json({ error: 'Internal server error' }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
