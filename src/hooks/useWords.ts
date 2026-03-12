import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { defaultCard } from '../lib/sm2'
import type { Database } from '../types/database'

type WordInsert = Database['public']['Tables']['words']['Insert']

export function useWords(userId: string) {
  return useQuery({
    queryKey: ['words', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
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
      await supabase.from('srs_cards').insert(card)
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
    mutationFn: async ({ wordId, userId }: { wordId: string; userId: string }) => {
      const { error } = await supabase.from('words').delete().eq('id', wordId).eq('user_id', userId)
      if (error) throw error
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
        await supabase.from('srs_cards').insert(cards)
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

export function useDueCards(userId: string) {
  return useQuery({
    queryKey: ['due-cards', userId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('srs_cards')
        .select('*, words(*)')
        .eq('user_id', userId)
        .lte('due_date', today)
        .order('due_date', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!userId,
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
    }: {
      cardId: string
      userId: string
      wordId: string
      sessionId: string
      grade: 0 | 2 | 3 | 5
      newState: { ease_factor: number; interval_days: number; repetitions: number; due_date: string }
    }) => {
      const { error: cardErr } = await supabase
        .from('srs_cards')
        .update({ ...newState, last_reviewed: new Date().toISOString() })
        .eq('id', cardId)
      if (cardErr) throw cardErr

      await supabase.from('review_logs').insert({
        session_id: sessionId,
        user_id: userId,
        word_id: wordId,
        grade,
      })
    },
    onSuccess: (_d, { userId }) => {
      qc.invalidateQueries({ queryKey: ['due-cards', userId] })
    },
  })
}
