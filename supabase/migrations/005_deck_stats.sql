CREATE OR REPLACE FUNCTION get_deck_stats(p_deck_id UUID)
RETURNS TABLE(due_count BIGINT, new_count BIGINT)
LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  today DATE := CURRENT_DATE;
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE sc.due_date <= today AND sc.repetitions > 0) AS due_count,
    COUNT(*) FILTER (WHERE sc.repetitions = 0) AS new_count
  FROM srs_cards sc
  JOIN words w ON w.id = sc.word_id
  WHERE w.list_id = p_deck_id AND sc.user_id = auth.uid();
END;
$$;
