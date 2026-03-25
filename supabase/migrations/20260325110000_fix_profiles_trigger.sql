-- ============================================================
-- Fix profiles trigger (AIC-20)
-- Migration: 20260325110000_fix_profiles_trigger
--
-- The initial trigger used raw_user_meta_data->>'provider_id'
-- for github_id, but GitHub's numeric user ID is in the 'sub'
-- field. Also relaxes github_id to nullable so a bad cast
-- never blocks sign-up.
-- ============================================================

-- Make github_id nullable so a missing/bad value never blocks auth
ALTER TABLE profiles ALTER COLUMN github_id DROP NOT NULL;

-- Supabase-only: replace the trigger function with corrected field lookups
DO $outer$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth'
  ) THEN
    EXECUTE $func$
      CREATE OR REPLACE FUNCTION handle_new_user()
      RETURNS TRIGGER AS $trig$
      BEGIN
        INSERT INTO profiles (id, github_id, github_username, avatar_url)
        VALUES (
          NEW.id,
          -- GitHub numeric user ID lives in 'sub'; fall back gracefully
          NULLIF(COALESCE(
            NEW.raw_user_meta_data->>'sub',
            NEW.raw_user_meta_data->>'provider_id'
          ), '')::bigint,
          COALESCE(
            NEW.raw_user_meta_data->>'user_name',
            NEW.raw_user_meta_data->>'preferred_username',
            NEW.raw_user_meta_data->>'login',
            ''
          ),
          NEW.raw_user_meta_data->>'avatar_url'
        )
        ON CONFLICT (id) DO UPDATE SET
          github_id       = EXCLUDED.github_id,
          github_username = EXCLUDED.github_username,
          avatar_url      = EXCLUDED.avatar_url,
          updated_at      = now();
        RETURN NEW;
      END;
      $trig$ LANGUAGE plpgsql SECURITY DEFINER
    $func$;
  END IF;
END $outer$;
