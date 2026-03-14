-- 007_anki_import_fields.sql
-- Adds columns for rich Anki card data: notes, media URLs, and card type

ALTER TABLE words
  ADD COLUMN IF NOT EXISTS notes               TEXT,
  ADD COLUMN IF NOT EXISTS image_url           TEXT,
  ADD COLUMN IF NOT EXISTS sentence_audio_url  TEXT,
  ADD COLUMN IF NOT EXISTS word_audio_url      TEXT,
  ADD COLUMN IF NOT EXISTS card_type           TEXT NOT NULL DEFAULT 'word'
    CHECK (card_type IN ('word', 'sentence'));
