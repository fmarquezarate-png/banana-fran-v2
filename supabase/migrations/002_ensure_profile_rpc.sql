-- Migration 002: ensure_own_profile RPC + backfill missing profiles
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Function called by the app to guarantee a profile row exists.
--    SECURITY DEFINER bypasses RLS, so it always works regardless of policy state.
--    Uses only the 'id' column — no assumption about other columns.
CREATE OR REPLACE FUNCTION ensure_own_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (auth.uid())
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  -- Swallow errors so the caller can still attempt the insert
  NULL;
END;
$$;

-- Allow any authenticated user to call this function
GRANT EXECUTE ON FUNCTION ensure_own_profile() TO authenticated;

-- 2. Backfill: create profiles for any auth.users rows that have no profile yet.
INSERT INTO profiles (id)
SELECT u.id
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;
