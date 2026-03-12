import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../types/database'

type SettingsUpdate = Database['public']['Tables']['user_settings']['Update']

export function useUserSettings(userId: string) {
  return useQuery({
    queryKey: ['user-settings', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: SettingsUpdate }) => {
      const { error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: (_d, { userId }) => {
      qc.invalidateQueries({ queryKey: ['user-settings', userId] })
    },
  })
}
