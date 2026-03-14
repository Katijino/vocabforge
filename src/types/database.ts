export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      generated_stories: {
        Row: {
          cache_key: string
          content: string
          content_translation: string | null
          generated_at: string
          id: string
          language: string
          time_window: number
          title: string
          title_translation: string | null
          user_id: string
          word_ids: string[]
        }
        Insert: {
          cache_key: string
          content: string
          content_translation?: string | null
          generated_at?: string
          id?: string
          language: string
          time_window: number
          title: string
          title_translation?: string | null
          user_id: string
          word_ids?: string[]
        }
        Update: {
          cache_key?: string
          content?: string
          content_translation?: string | null
          generated_at?: string
          id?: string
          language?: string
          time_window?: number
          title?: string
          title_translation?: string | null
          user_id?: string
          word_ids?: string[]
        }
        Relationships: []
      }
      review_logs: {
        Row: {
          grade: number
          id: string
          reviewed_at: string
          session_id: string
          user_id: string
          word_id: string
        }
        Insert: {
          grade: number
          id?: string
          reviewed_at?: string
          session_id: string
          user_id: string
          word_id: string
        }
        Update: {
          grade?: number
          id?: string
          reviewed_at?: string
          session_id?: string
          user_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "review_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_logs_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      review_sessions: {
        Row: {
          cards_correct: number
          cards_reviewed: number
          finished_at: string | null
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          cards_correct?: number
          cards_reviewed?: number
          finished_at?: string | null
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          cards_correct?: number
          cards_reviewed?: number
          finished_at?: string | null
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      srs_cards: {
        Row: {
          due_date: string
          ease_factor: number
          id: string
          interval_days: number
          last_reviewed: string | null
          learned_at: string | null
          repetitions: number
          user_id: string
          word_id: string
        }
        Insert: {
          due_date?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed?: string | null
          learned_at?: string | null
          repetitions?: number
          user_id: string
          word_id: string
        }
        Update: {
          due_date?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_reviewed?: string | null
          learned_at?: string | null
          repetitions?: number
          user_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "srs_cards_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          daily_review_limit: number
          learning_language: string
          review_time_window: number
          stories_reset_at: string
          stories_used_month: number
          stripe_customer_id: string | null
          subscription_status: string | null
          subscription_tier: string
          user_id: string
          words_count: number
        }
        Insert: {
          daily_review_limit?: number
          learning_language?: string
          review_time_window?: number
          stories_reset_at?: string
          stories_used_month?: number
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string
          user_id: string
          words_count?: number
        }
        Update: {
          daily_review_limit?: number
          learning_language?: string
          review_time_window?: number
          stories_reset_at?: string
          stories_used_month?: number
          stripe_customer_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string
          user_id?: string
          words_count?: number
        }
        Relationships: []
      }
      word_lists: {
        Row: {
          created_at: string
          daily_review_limit: number
          description: string | null
          id: string
          language: string
          name: string
          source: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_review_limit?: number
          description?: string | null
          id?: string
          language?: string
          name: string
          source?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          daily_review_limit?: number
          description?: string | null
          id?: string
          language?: string
          name?: string
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      words: {
        Row: {
          created_at: string
          definition: string | null
          example: string | null
          example_translation: string | null
          id: string
          language: string
          list_id: string | null
          reading: string | null
          source: string | null
          user_id: string
          word: string
        }
        Insert: {
          created_at?: string
          definition?: string | null
          example?: string | null
          example_translation?: string | null
          id?: string
          language?: string
          list_id?: string | null
          reading?: string | null
          source?: string | null
          user_id: string
          word: string
        }
        Update: {
          created_at?: string
          definition?: string | null
          example?: string | null
          example_translation?: string | null
          id?: string
          language?: string
          list_id?: string | null
          reading?: string | null
          source?: string | null
          user_id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "words_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "word_lists"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_all_user_words: { Args: Record<PropertyKey, never>; Returns: undefined }
      delete_deck_words: { Args: { p_deck_id: string }; Returns: undefined }
      delete_words: { Args: { word_ids: string[] }; Returns: undefined }
      get_deck_stats: {
        Args: { p_deck_id: string }
        Returns: {
          due_count: number
          new_count: number
        }[]
      }
      move_words_to_deck: { Args: { p_word_ids: string[]; p_deck_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export type Word = Tables<'words'>
export type SrsCard = Tables<'srs_cards'>
export type GeneratedStory = Tables<'generated_stories'>
export type UserSettings = Tables<'user_settings'>
export type WordList = Tables<'word_lists'>
export type ReviewSession = Tables<'review_sessions'>
export type ReviewLog = Tables<'review_logs'>

export const Constants = {
  public: {
    Enums: {},
  },
} as const
