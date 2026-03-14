import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useStories(userId: string) {
  return useQuery({
    queryKey: ['stories', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_stories')
        .select('*')
        .eq('user_id', userId)
        .order('generated_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!userId,
  })
}

export function useStory(storyId: string) {
  return useQuery({
    queryKey: ['story', storyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_stories')
        .select('*')
        .eq('id', storyId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!storyId,
  })
}

export function useGenerateStory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      timeWindow,
      language,
      deckId,
      wordIds,
    }: {
      userId: string
      timeWindow?: 7 | 14 | 30
      language: string
      deckId?: string | null
      wordIds?: string[]
    }) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await supabase.functions.invoke('generate-story', {
        body: { time_window: timeWindow ?? 7, language, deck_id: deckId ?? null, word_ids: wordIds ?? null },
      })

      // Edge function errors come back in res.data when the function returns a non-2xx JSON body
      if (res.error || (res.data && (res.data as { error?: string }).error)) {
        const data = res.data as { error?: string; code?: string } | null
        const message = data?.error ?? res.error?.message ?? 'Failed to generate story'
        const err = new Error(message) as Error & { code?: string }
        if (data?.code) err.code = data.code
        throw err
      }
      return res.data as { id: string; title: string; content: string; cached: boolean }
    },
    onSuccess: (_d, { userId }) => {
      qc.invalidateQueries({ queryKey: ['stories', userId] })
      qc.invalidateQueries({ queryKey: ['user-settings', userId] })
    },
  })
}
