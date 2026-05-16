-- ================================================
-- KEIRETSU — Skill Counts by Proximity
-- Run this in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ================================================

-- Function: Get skill builder counts within a radius
-- Returns how many builders near a coordinate have each skill.
-- Used by the search page to show "React (12 nearby)" badges.
CREATE OR REPLACE FUNCTION get_skill_counts_nearby(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 10.0
)
RETURNS TABLE (
  skill_name TEXT,
  category TEXT,
  builder_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.name AS skill_name,
    s.category,
    COUNT(DISTINCT p.id) AS builder_count
  FROM profile_skills ps
  JOIN profiles p ON p.id = ps.profile_id
  JOIN skills s ON s.id = ps.skill_id
  WHERE
    p.location IS NOT NULL
    AND p.user_id != auth.uid()
    AND ST_DWithin(
      p.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_km * 1000
    )
  GROUP BY s.name, s.category
  ORDER BY builder_count DESC, s.name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_skill_counts_nearby TO authenticated;
