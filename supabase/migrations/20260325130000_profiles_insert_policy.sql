-- Allow authenticated users to insert their own profile row.
-- Required for the upsert in /auth/callback to succeed.
-- Wrapped in auth-schema guard for local Postgres compat (no GoTrue).
DO $outer$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth'
  ) THEN
    EXECUTE '
      CREATE POLICY "Users can insert own profile"
        ON profiles FOR INSERT
        WITH CHECK (auth.uid() = id)
    ';
  END IF;
END $outer$;
