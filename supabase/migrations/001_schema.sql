-- VocabForge Schema Migration 001
-- Run via: supabase db push

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────

CREATE TABLE word_lists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  language    TEXT NOT NULL DEFAULT 'Japanese',
  source      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE words (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  list_id     UUID REFERENCES word_lists(id) ON DELETE SET NULL,
  word        TEXT NOT NULL,
  reading     TEXT,
  definition  TEXT,
  example     TEXT,
  language    TEXT NOT NULL DEFAULT 'Japanese',
  source      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE srs_cards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id       UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  ease_factor   NUMERIC NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  repetitions   INTEGER NOT NULL DEFAULT 0,
  due_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  last_reviewed TIMESTAMPTZ,
  UNIQUE(user_id, word_id)
);

CREATE TABLE review_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at    TIMESTAMPTZ,
  cards_reviewed INTEGER NOT NULL DEFAULT 0,
  cards_correct  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE review_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES review_sessions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id     UUID NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  grade       SMALLINT NOT NULL CHECK (grade IN (0, 2, 3, 5)),
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE generated_stories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  language      TEXT NOT NULL,
  word_ids      UUID[] NOT NULL DEFAULT '{}',
  time_window   INTEGER NOT NULL,
  cache_key     TEXT NOT NULL,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_settings (
  user_id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  learning_language    TEXT NOT NULL DEFAULT 'Japanese',
  review_time_window   INTEGER NOT NULL DEFAULT 7,
  daily_review_limit   INTEGER NOT NULL DEFAULT 20,
  stories_used_month   INTEGER NOT NULL DEFAULT 0,
  stories_reset_at     TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()),
  words_count          INTEGER NOT NULL DEFAULT 0,
  stripe_customer_id   TEXT,
  subscription_tier    TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  subscription_status  TEXT
);

-- ─────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────

CREATE INDEX idx_words_user_id     ON words(user_id);
CREATE INDEX idx_words_created_at  ON words(user_id, created_at);
CREATE INDEX idx_srs_cards_due     ON srs_cards(user_id, due_date);
CREATE INDEX idx_stories_user_id   ON generated_stories(user_id);
CREATE INDEX idx_stories_cache_key ON generated_stories(user_id, cache_key);

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────

ALTER TABLE word_lists         ENABLE ROW LEVEL SECURITY;
ALTER TABLE words              ENABLE ROW LEVEL SECURITY;
ALTER TABLE srs_cards          ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_stories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings      ENABLE ROW LEVEL SECURITY;

-- word_lists
CREATE POLICY "Users own word_lists"
  ON word_lists FOR ALL USING (auth.uid() = user_id);

-- words
CREATE POLICY "Users own words"
  ON words FOR ALL USING (auth.uid() = user_id);

-- srs_cards
CREATE POLICY "Users own srs_cards"
  ON srs_cards FOR ALL USING (auth.uid() = user_id);

-- review_sessions
CREATE POLICY "Users own review_sessions"
  ON review_sessions FOR ALL USING (auth.uid() = user_id);

-- review_logs
CREATE POLICY "Users own review_logs"
  ON review_logs FOR ALL USING (auth.uid() = user_id);

-- generated_stories
CREATE POLICY "Users own generated_stories"
  ON generated_stories FOR ALL USING (auth.uid() = user_id);

-- user_settings
CREATE POLICY "Users own user_settings"
  ON user_settings FOR ALL USING (auth.uid() = user_id);
