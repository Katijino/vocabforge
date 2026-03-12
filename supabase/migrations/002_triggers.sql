-- VocabForge Triggers Migration 002

-- ─────────────────────────────────────────────
-- Trigger: auto-create user_settings on signup
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────
-- Trigger: maintain words_count in user_settings
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_words_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.user_settings
    SET words_count = words_count + 1
    WHERE user_id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.user_settings
    SET words_count = GREATEST(0, words_count - 1)
    WHERE user_id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_word_insert
  AFTER INSERT ON public.words
  FOR EACH ROW EXECUTE FUNCTION update_words_count();

CREATE TRIGGER on_word_delete
  AFTER DELETE ON public.words
  FOR EACH ROW EXECUTE FUNCTION update_words_count();

-- ─────────────────────────────────────────────
-- Trigger: reset stories_used_month monthly
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION reset_stories_monthly()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.stories_reset_at < date_trunc('month', now()) THEN
    NEW.stories_used_month := 0;
    NEW.stories_reset_at := date_trunc('month', now());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_settings_read_reset_stories
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION reset_stories_monthly();
