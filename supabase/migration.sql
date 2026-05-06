-- ================================================
-- KEIRETSU DATABASE MIGRATION
-- Run this entire file in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ================================================

-- 1. Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT NOT NULL,
  college TEXT NOT NULL DEFAULT '',
  year INTEGER NOT NULL DEFAULT 1 CHECK (year >= 1 AND year <= 6),
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  github_url TEXT NOT NULL DEFAULT '',
  availability_status TEXT DEFAULT 'open_to_collab'
    CHECK (availability_status IN ('open_to_collab', 'busy', 'looking_for_cofounder')),
  location GEOGRAPHY(POINT, 4326),
  location_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial index for radius queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_profiles_college ON profiles(college);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- 3. Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT 'general'
);

-- 4. Create profile_skills junction table
CREATE TABLE IF NOT EXISTS profile_skills (
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (profile_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_skills_skill ON profile_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_profile_skills_profile ON profile_skills(profile_id);

-- 5. Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_skills ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only owner can insert/update
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Skills: read-only for all
CREATE POLICY "Skills are viewable by everyone"
  ON skills FOR SELECT USING (true);

-- Profile skills: anyone can read, owner can manage
CREATE POLICY "Profile skills viewable by everyone"
  ON profile_skills FOR SELECT USING (true);

CREATE POLICY "Users can insert own skills"
  ON profile_skills FOR INSERT WITH CHECK (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own skills"
  ON profile_skills FOR DELETE USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- 6. Seed skill tags
INSERT INTO skills (name, category) VALUES
  ('React', 'frontend'), ('Next.js', 'frontend'), ('Vue.js', 'frontend'),
  ('Angular', 'frontend'), ('HTML/CSS', 'frontend'), ('Svelte', 'frontend'),
  ('TypeScript', 'language'), ('JavaScript', 'language'),
  ('Python', 'language'), ('Java', 'language'), ('C++', 'language'),
  ('C', 'language'), ('Rust', 'language'), ('Go', 'language'),
  ('Ruby', 'language'), ('PHP', 'language'),
  ('Node.js', 'backend'), ('Express', 'backend'), ('Django', 'backend'),
  ('FastAPI', 'backend'), ('Spring Boot', 'backend'), ('Flask', 'backend'),
  ('PostgreSQL', 'database'), ('MongoDB', 'database'), ('Redis', 'database'),
  ('MySQL', 'database'), ('Firebase', 'database'),
  ('Machine Learning', 'ai'), ('Deep Learning', 'ai'), ('NLP', 'ai'),
  ('Computer Vision', 'ai'), ('LLMs', 'ai'), ('TensorFlow', 'ai'),
  ('PyTorch', 'ai'),
  ('Data Science', 'data'), ('Data Analysis', 'data'), ('Pandas', 'data'),
  ('React Native', 'mobile'), ('Flutter', 'mobile'), ('Swift', 'mobile'),
  ('Kotlin', 'mobile'), ('Android', 'mobile'), ('iOS', 'mobile'),
  ('AWS', 'devops'), ('Docker', 'devops'), ('Kubernetes', 'devops'),
  ('CI/CD', 'devops'), ('Linux', 'devops'), ('Git', 'devops'),
  ('UI/UX Design', 'design'), ('Figma', 'design'), ('Adobe XD', 'design'),
  ('Blockchain', 'web3'), ('Solidity', 'web3'), ('Web3', 'web3'),
  ('Cybersecurity', 'security'), ('Penetration Testing', 'security'),
  ('Networking', 'security')
ON CONFLICT (name) DO NOTHING;

-- 7. Function: Update user location
CREATE OR REPLACE FUNCTION update_user_location(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET
    location = ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
    location_updated_at = NOW(),
    updated_at = NOW()
  WHERE user_id = auth.uid();
END;
$$;

-- 8. Function: Get nearby users
CREATE OR REPLACE FUNCTION get_nearby_users(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 2.0,
  skill_filter TEXT[] DEFAULT NULL,
  college_filter TEXT DEFAULT NULL,
  name_search TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  college TEXT,
  year INTEGER,
  bio TEXT,
  avatar_url TEXT,
  github_url TEXT,
  availability_status TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_km DOUBLE PRECISION,
  skills TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.college,
    p.year,
    p.bio,
    p.avatar_url,
    p.github_url,
    p.availability_status,
    ST_Y(p.location::geometry) AS latitude,
    ST_X(p.location::geometry) AS longitude,
    ROUND((ST_Distance(
      p.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
    ) / 1000.0)::numeric, 2)::double precision AS distance_km,
    ARRAY(
      SELECT s.name FROM profile_skills ps
      JOIN skills s ON s.id = ps.skill_id
      WHERE ps.profile_id = p.id
    ) AS skills
  FROM profiles p
  WHERE
    p.location IS NOT NULL
    AND p.user_id != auth.uid()
    AND ST_DWithin(
      p.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_km * 1000
    )
    AND (skill_filter IS NULL OR EXISTS (
      SELECT 1 FROM profile_skills ps
      JOIN skills s ON s.id = ps.skill_id
      WHERE ps.profile_id = p.id AND s.name = ANY(skill_filter)
    ))
    AND (college_filter IS NULL OR p.college ILIKE '%' || college_filter || '%')
    AND (name_search IS NULL OR p.name ILIKE '%' || name_search || '%')
  ORDER BY distance_km ASC;
END;
$$;

-- 9. Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION update_user_location TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_users TO authenticated;
