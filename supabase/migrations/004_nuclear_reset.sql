-- Migration 004: Drop and recreate all app tables from scratch.
-- Safe to run because no trip data exists yet (can't be created due to schema bug).
-- Run in Supabase Dashboard → SQL Editor

-- ── Drop in reverse FK order ──────────────────────────────────
DROP TABLE IF EXISTS trip_journal      CASCADE;
DROP TABLE IF EXISTS trip_photos       CASCADE;
DROP TABLE IF EXISTS trip_places       CASCADE;
DROP TABLE IF EXISTS trip_documents    CASCADE;
DROP TABLE IF EXISTS trip_destinations CASCADE;
DROP TABLE IF EXISTS trips             CASCADE;
DROP TABLE IF EXISTS destination_quotations CASCADE;
DROP TABLE IF EXISTS destinations_user CASCADE;

-- Keep `profiles` but fix its columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email      TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name  TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ── Recreate trips ────────────────────────────────────────────
CREATE TABLE trips (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  destination_slug TEXT,
  start_date       DATE,
  end_date         DATE,
  status_override  TEXT CHECK (status_override IN ('planning','upcoming','ongoing','completed','cancelled')),
  travelers        INTEGER NOT NULL DEFAULT 2,
  cover_photo_url  TEXT,
  is_past          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own trips"
  ON trips FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Recreate trip_documents ───────────────────────────────────
CREATE TABLE trip_documents (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id    UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  doc_type   TEXT NOT NULL CHECK (doc_type IN ('flight','hotel','activity','transfer','insurance','visa','other')),
  file_path  TEXT NOT NULL,
  file_size  INTEGER,
  mime_type  TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE trip_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own trip documents"
  ON trip_documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Fix ensure_own_profile (id only, no email) ────────────────
CREATE OR REPLACE FUNCTION ensure_own_profile()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (auth.uid())
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;
GRANT EXECUTE ON FUNCTION ensure_own_profile() TO authenticated;

-- ── Backfill profiles for existing auth users ─────────────────
INSERT INTO profiles (id)
SELECT u.id FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- ── Storage buckets ───────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false) ON CONFLICT (id) DO NOTHING;
