-- Track when a card was first successfully learned (repetitions 0→1)
ALTER TABLE srs_cards ADD COLUMN IF NOT EXISTS learned_at TIMESTAMPTZ;

-- Backfill: treat existing reviewed cards as already learned
UPDATE srs_cards SET learned_at = last_reviewed
WHERE last_reviewed IS NOT NULL AND learned_at IS NULL;

-- Index for stories query
CREATE INDEX IF NOT EXISTS idx_srs_cards_learned ON srs_cards(user_id, learned_at);
