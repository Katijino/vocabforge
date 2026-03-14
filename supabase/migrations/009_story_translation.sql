ALTER TABLE generated_stories
  ADD COLUMN IF NOT EXISTS content_translation TEXT;
