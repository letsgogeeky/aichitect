-- ============================================================
-- Drop profiles auto-create trigger (AIC-20)
-- Migration: 20260325120000_drop_profiles_trigger
--
-- Removes the on_auth_user_created trigger and handle_new_user()
-- function. Profile creation is now handled in the app's
-- /auth/callback route after exchangeCodeForSession succeeds,
-- giving us full visibility and control over errors.
-- ============================================================

DO $outer$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth'
  ) THEN
    EXECUTE '
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users
    ';
  END IF;
END $outer$;

DROP FUNCTION IF EXISTS handle_new_user();
