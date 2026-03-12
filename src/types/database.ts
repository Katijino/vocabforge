export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      word_lists: {
        Row: {
          id: string
          user_id: string
          name: string
          language: string
          source: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          language: string
          source?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          language?: string
          source?: string | null
          created_at?: string
        }
      }
      words: {
        Row: {
          id: string
          user_id: string
          list_id: string | null
          word: string
          reading: string | null
          definition: string | null
          example: string | null
          language: string
          source: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          list_id?: string | null
          word: string
          reading?: string | null
          definition?: string | null
          example?: string | null
          language?: string
          source?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          list_id?: string | null
          word?: string
          reading?: string | null
          definition?: string | null
          example?: string | null
          language?: string
          source?: string | null
          created_at?: string
        }
      }
      srs_cards: {
        Row: {
          id: string
          user_id: string
          word_id: string
          ease_factor: number
          interval_days: number
          repetitions: number
          due_date: string
          last_reviewed: string | null
        }
        Insert: {
          id?: string
          user_id: string
          word_id: string
          ease_factor?: number
          interval_days?: number
          repetitions?: number
          due_date?: string
          last_reviewed?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          word_id?: string
          ease_factor?: number
          interval_days?: number
          repetitions?: number
          due_date?: string
          last_reviewed?: string | null
        }
      }
      review_sessions: {
        Row: {
          id: string
          user_id: string
          started_at: string
          finished_at: string | null
          cards_reviewed: number
          cards_correct: number
        }
        Insert: {
          id?: string
          user_id: string
          started_at?: string
          finished_at?: string | null
          cards_reviewed?: number
          cards_correct?: number
        }
        Update: {
          id?: string
          user_id?: string
          started_at?: string
          finished_at?: string | null
          cards_reviewed?: number
          cards_correct?: number
        }
      }
      review_logs: {
        Row: {
          id: string
          session_id: string
          user_id: string
          word_id: string
          grade: number
          reviewed_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          word_id: string
          grade: number
          reviewed_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          word_id?: string
          grade?: number
          reviewed_at?: string
        }
      }
      generated_stories: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          language: string
          word_ids: string[]
          time_window: number
          cache_key: string
          generated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          language: string
          word_ids: string[]
          time_window: number
          cache_key: string
          generated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          language?: string
          word_ids?: string[]
          time_window?: number
          cache_key?: string
          generated_at?: string
        }
      }
      user_settings: {
        Row: {
          user_id: string
          learning_language: string
          review_time_window: number
          daily_review_limit: number
          stories_used_month: number
          stories_reset_at: string
          words_count: number
          stripe_customer_id: string | null
          subscription_tier: 'free' | 'pro'
          subscription_status: string | null
        }
        Insert: {
          user_id: string
          learning_language?: string
          review_time_window?: number
          daily_review_limit?: number
          stories_used_month?: number
          stories_reset_at?: string
          words_count?: number
          stripe_customer_id?: string | null
          subscription_tier?: 'free' | 'pro'
          subscription_status?: string | null
        }
        Update: {
          user_id?: string
          learning_language?: string
          review_time_window?: number
          daily_review_limit?: number
          stories_used_month?: number
          stories_reset_at?: string
          words_count?: number
          stripe_customer_id?: string | null
          subscription_tier?: 'free' | 'pro'
          subscription_status?: string | null
        }
      }
    }
  }
}

// Convenience row types
export type WordList = Database['public']['Tables']['word_lists']['Row']
export type Word = Database['public']['Tables']['words']['Row']
export type SrsCard = Database['public']['Tables']['srs_cards']['Row']
export type ReviewSession = Database['public']['Tables']['review_sessions']['Row']
export type ReviewLog = Database['public']['Tables']['review_logs']['Row']
export type GeneratedStory = Database['public']['Tables']['generated_stories']['Row']
export type UserSettings = Database['public']['Tables']['user_settings']['Row']
