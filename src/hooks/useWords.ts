import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { defaultCard } from '../lib/sm2'
import type { Database } from '../types/database'

type WordInsert = Database['public']['Tables']['words']['Insert']

export function useWordsByIds(wordIds: string[]) {
  return useQuery({
    queryKey: ['words-by-ids', wordIds.slice().sort().join(',')],
    queryFn: async () => {
      if (wordIds.length === 0) return []
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .in('id', wordIds)
      if (error) throw error
      return data ?? []
    },
    enabled: wordIds.length > 0,
  })
}

export function useWords(userId: string, deckId?: string | null) {
  return useQuery({
    queryKey: ['words', userId, deckId ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('words')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5000)

      if (deckId && deckId !== 'all') {
        if (deckId === 'undecked') {
          query = query.is('list_id', null)
        } else {
          query = query.eq('list_id', deckId)
        }
      }

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    enabled: !!userId,
  })
}

export function useAddWord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (insert: WordInsert) => {
      const { data, error } = await supabase
        .from('words')
        .insert(insert)
        .select()
        .single()
      if (error) throw error
      // Create SRS card for this word
      const card = defaultCard(data.id, data.user_id)
      const { error: srsError } = await supabase.from('srs_cards').insert(card)
      if (srsError) throw srsError
      return data
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['words', vars.user_id] })
      qc.invalidateQueries({ queryKey: ['user-settings', vars.user_id] })
      qc.invalidateQueries({ queryKey: ['due-cards', vars.user_id] })
    },
  })
}

export function useDeleteWord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ wordId, userId: _userId }: { wordId: string; userId: string }) => {
      const { error } = await supabase.rpc('delete_words', { word_ids: [wordId] })
      if (error) throw new Error(error.message)
    },
    onSuccess: (_d, { userId }) => {
      qc.invalidateQueries({ queryKey: ['words', userId] })
      qc.invalidateQueries({ queryKey: ['user-settings', userId] })
      qc.invalidateQueries({ queryKey: ['due-cards', userId] })
    },
  })
}

export function useBulkDeleteWords() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ wordIds, userId: _userId }: { wordIds: string[]; userId: string }) => {
      const BATCH = 50
      for (let i = 0; i < wordIds.length; i += BATCH) {
        const batch = wordIds.slice(i, i + BATCH)
        const { error } = await supabase.rpc('delete_words', { word_ids: batch })
        if (error) {
          throw new Error(`Batch ${i / BATCH + 1} failed: ${error.message} (code: ${error.code})`)
        }
      }
    },
    onSuccess: (_d, { userId }) => {
      qc.invalidateQueries({ queryKey: ['words', userId] })
      qc.invalidateQueries({ queryKey: ['user-settings', userId] })
      qc.invalidateQueries({ queryKey: ['due-cards', userId] })
    },
  })
}

export function useBulkAddWords() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ words, userId }: { words: Omit<WordInsert, 'user_id'>[]; userId: string }) => {
      const inserts = words.map((w) => ({ ...w, user_id: userId }))
      const { data, error } = await supabase.from('words').insert(inserts).select()
      if (error) throw error
      // Create SRS cards for all new words
      if (data && data.length > 0) {
        const cards = data.map((w) => defaultCard(w.id, userId))
        const { error: srsError } = await supabase.from('srs_cards').insert(cards)
        if (srsError) throw srsError
      }
      return data
    },
    onSuccess: (_d, { userId }) => {
      qc.invalidateQueries({ queryKey: ['words', userId] })
      qc.invalidateQueries({ queryKey: ['user-settings', userId] })
      qc.invalidateQueries({ queryKey: ['due-cards', userId] })
    },
  })
}

export function useDueCards(userId: string, deckId?: string) {
  return useQuery({
    queryKey: ['due-cards', userId, deckId ?? 'all'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      let query = supabase
        .from('srs_cards')
        .select('*, words!inner(*)')
        .eq('user_id', userId)
        .lte('due_date', today)
        .order('repetitions', { ascending: true })
        .order('due_date', { ascending: true })
        .limit(10_000)

      if (deckId) {
        query = query.eq('words.list_id', deckId)
      }

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    enabled: !!userId,
  })
}

export function useNewCards(userId: string, deckId?: string, limit?: number) {
  return useQuery({
    queryKey: ['new-cards', userId, deckId ?? 'all', limit ?? 20],
    queryFn: async () => {
      let query = supabase
        .from('srs_cards')
        .select('*, words!inner(*)')
        .eq('user_id', userId)
        .is('last_reviewed', null)
        .eq('due_date', '9999-12-31')
        .order('created_at', { ascending: true, foreignTable: 'words' })
        .limit(limit ?? 20)

      if (deckId) {
        query = query.eq('words.list_id', deckId)
      }

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    enabled: !!userId,
  })
}

export function useNewCardsLearnedToday(userId: string) {
  return useQuery({
    queryKey: ['learned-today', userId],
    queryFn: async () => {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const { count, error } = await supabase
        .from('srs_cards')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('learned_at', todayStart.toISOString())
        .not('learned_at', 'is', null)
      if (error) throw error
      return count ?? 0
    },
    enabled: !!userId,
  })
}

export function useDeleteAllWords() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId: _userId }: { userId: string }) => {
      const { error } = await supabase.rpc('delete_all_user_words')
      if (error) throw new Error(error.message)
    },
    onSuccess: (_d, { userId }) => {
      qc.invalidateQueries({ queryKey: ['words', userId] })
      qc.invalidateQueries({ queryKey: ['user-settings', userId] })
      qc.invalidateQueries({ queryKey: ['due-cards', userId] })
    },
  })
}

export function useGradeCard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      cardId,
      userId,
      wordId,
      sessionId,
      grade,
      newState,
      learnedAt,
    }: {
      cardId: string
      userId: string
      wordId: string
      sessionId: string
      grade: 0 | 2 | 3 | 5
      newState: { ease_factor: number; interval_days: number; repetitions: number; due_date: string }
      learnedAt?: string
    }) => {
      const { error: cardErr } = await supabase
        .from('srs_cards')
        .update({
          ...newState,
          last_reviewed: new Date().toISOString(),
          ...(learnedAt ? { learned_at: learnedAt } : {}),
        })
        .eq('id', cardId)
      if (cardErr) throw cardErr

      const { error: logError } = await supabase.from('review_logs').insert({
        session_id: sessionId,
        user_id: userId,
        word_id: wordId,
        grade,
      })
      if (logError) throw logError
    },
    onSuccess: (_d, { userId }) => {
      qc.invalidateQueries({ queryKey: ['due-cards', userId] })
      qc.invalidateQueries({ queryKey: ['learned-today', userId] })
      qc.invalidateQueries({ queryKey: ['new-cards', userId] })
    },
  })
}
