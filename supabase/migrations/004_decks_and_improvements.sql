-- Migration 004: Deck enhancements and bulk operations

-- Add description and daily_review_limit to word_lists (decks)
ALTER TABLE word_lists
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS daily_review_limit INTEGER NOT NULL DEFAULT 20;

-- Index for fast deck-filtered word queries
CREATE INDEX IF NOT EXISTS idx_words_list_id ON words(list_id);

-- RPC: Delete all words for the current authenticated user
CREATE OR REPLACE FUNCTION delete_all_user_words()
RETURNS void LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
  DELETE FROM words WHERE user_id = auth.uid();
END;
$$;

-- RPC: Delete words by deck (all words in a specific deck for current user)
CREATE OR REPLACE FUNCTION delete_deck_words(p_deck_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
  DELETE FROM words WHERE list_id = p_deck_id AND user_id = auth.uid();
END;
$$;

-- RPC: Move words to a different deck
CREATE OR REPLACE FUNCTION move_words_to_deck(p_word_ids UUID[], p_deck_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER AS $$
BEGIN
  UPDATE words
  SET list_id = p_deck_id
  WHERE id = ANY(p_word_ids) AND user_id = auth.uid();
END;
$$;
