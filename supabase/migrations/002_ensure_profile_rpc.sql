-- Migration 002: ensure_own_profile RPC + backfill missing profiles
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Function called by the app to guarantee a profile row exists.
--    SECURITY DEFINER bypasses RLS, so it always works regardless of policy state.
CREATE OR REPLACE FUNCTION ensure_own_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email)
  SELECT
    auth.uid(),
    COALESCE(
      (SELECT email FROM auth.users WHERE id = auth.uid()),
      ''
    )
  WHERE auth.uid() IS NOT NULL
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Allow any authenticated user to call this function
GRANT EXECUTE ON FUNCTION ensure_own_profile() TO authenticated;

-- 2. Backfill: create profiles for any auth.users rows that have no profile yet.
--    This fixes accounts created before the trigger was in place.
INSERT INTO profiles (id, email)
SELECT u.id, COALESCE(u.email, '')
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = u.id
);
