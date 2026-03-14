import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type DeckInsert = Database['public']['Tables']['word_lists']['Insert']
type DeckUpdate = Database['public']['Tables']['word_lists']['Update']

export function useDecks(userId: string) {
  return useQuery({
    queryKey: ['decks', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('word_lists')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!userId,
  })
}

export function useCreateDeck() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (insert: DeckInsert) => {
      const { data, error } = await supabase
        .from('word_lists')
        .insert(insert)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['decks', vars.user_id] })
    },
  })
}

export function useUpdateDeck() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ deckId, userId, updates }: { deckId: string; userId: string; updates: DeckUpdate }) => {
      const { data, error } = await supabase
        .from('word_lists')
        .update(updates)
        .eq('id', deckId)
        .eq('user_id', userId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_d, { userId }) => {
      qc.invalidateQueries({ queryKey: ['decks', userId] })
    },
  })
}

export function useDeleteDeck() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ deckId, userId }: { deckId: string; userId: string }) => {
      // Words with this list_id get SET NULL (cascade on delete set null)
      const { error } = await supabase
        .from('word_lists')
        .delete()
        .eq('id', deckId)
        .eq('user_id', userId)
      if (error) throw new Error(error.message)
    },
    onSuccess: (_d, { userId }) => {
      qc.invalidateQueries({ queryKey: ['decks', userId] })
      qc.invalidateQueries({ queryKey: ['words', userId] })
    },
  })
}

export function useDeleteAllUserWords() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { error } = await supabase.rpc('delete_all_user_words')
      if (error) throw new Error(error.message)
      // Also reset words_count
      const { error: settingsError } = await supabase.from('user_settings').update({ words_count: 0 }).eq('user_id', userId)
      if (settingsError) throw settingsError
    },
    onSuccess: (_d, { userId }) => {
      qc.invalidateQueries({ queryKey: ['words', userId] })
      qc.invalidateQueries({ queryKey: ['user-settings', userId] })
      qc.invalidateQueries({ queryKey: ['due-cards', userId] })
    },
  })
}

export function useDeleteDeckWords() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ deckId, userId: _userId }: { deckId: string; userId: string }) => {
      const { error } = await supabase.rpc('delete_deck_words', { p_deck_id: deckId })
      if (error) throw new Error(error.message)
    },
    onSuccess: (_d, { userId }) => {
      qc.invalidateQueries({ queryKey: ['words', userId] })
      qc.invalidateQueries({ queryKey: ['user-settings', userId] })
      qc.invalidateQueries({ queryKey: ['due-cards', userId] })
      qc.invalidateQueries({ queryKey: ['decks', userId] })
    },
  })
}

export function useDeckStats(deckId: string) {
  return useQuery({
    queryKey: ['deck-stats', deckId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_deck_stats', { p_deck_id: deckId })
      if (error) throw error
      const row = (data as Array<{ due_count: unknown; new_count: unknown }> | null)?.[0]
      return {
        due_count: Number(row?.due_count ?? 0),
        new_count: Number(row?.new_count ?? 0),
      }
    },
    enabled: !!deckId,
  })
}

export function useMoveWordsToDeck() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ wordIds, deckId, userId }: { wordIds: string[]; deckId: string | null; userId: string }) => {
      if (deckId === null) {
        // Move to "no deck" by setting list_id = null
        const { error } = await supabase
          .from('words')
          .update({ list_id: null })
          .in('id', wordIds)
          .eq('user_id', userId)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase.rpc('move_words_to_deck', { p_word_ids: wordIds, p_deck_id: deckId })
        if (error) throw new Error(error.message)
      }
    },
    onSuccess: (_d, { userId }) => {
      qc.invalidateQueries({ queryKey: ['words', userId] })
    },
  })
}
