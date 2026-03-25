-- ============================================================
-- AIchitect — Profiles Table (AIC-20)
-- Migration: 20260325100000_add_profiles
--
-- Creates a profiles table that mirrors auth.users (populated
-- automatically on GitHub OAuth sign-in via trigger).
--
-- On local plain Postgres (docker-compose): table is created
-- without the auth.users FK or trigger — auth is not used locally.
-- On remote Supabase: full FK + auto-create trigger applied.
--
-- RLS: users can read/update only their own profile.
-- ============================================================


-- ------------------------------------------------------------
-- Table: profiles
-- id is a uuid PK; FK to auth.users added below on Supabase only.
-- ------------------------------------------------------------

CREATE TABLE profiles (
  id               uuid        PRIMARY KEY,
  github_id        bigint      NOT NULL UNIQUE,
  github_username  text        NOT NULL,
  avatar_url       text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- Supabase-only: RLS policies, FK to auth.users + auto-create trigger
-- Skipped on plain Postgres (no auth schema).
-- ------------------------------------------------------------

DO $outer$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth'
  ) THEN
    EXECUTE '
      CREATE POLICY "Users can read own profile"
        ON profiles FOR SELECT
        USING (auth.uid() = id)
    ';

    EXECUTE '
      CREATE POLICY "Users can update own profile"
        ON profiles FOR UPDATE
        USING (auth.uid() = id)
    ';

    -- FK: cascade deletes from auth.users → profiles
    EXECUTE '
      ALTER TABLE profiles
        ADD CONSTRAINT profiles_id_fkey
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
    ';

    -- Function: auto-populate profiles on GitHub OAuth sign-up
    EXECUTE $func$
      CREATE OR REPLACE FUNCTION handle_new_user()
      RETURNS TRIGGER AS $trig$
      BEGIN
        INSERT INTO profiles (id, github_id, github_username, avatar_url)
        VALUES (
          NEW.id,
          (NEW.raw_user_meta_data->>'provider_id')::bigint,
          COALESCE(
            NEW.raw_user_meta_data->>'user_name',
            NEW.raw_user_meta_data->>'preferred_username',
            ''
          ),
          NEW.raw_user_meta_data->>'avatar_url'
        )
        ON CONFLICT (id) DO UPDATE SET
          github_username = EXCLUDED.github_username,
          avatar_url      = EXCLUDED.avatar_url,
          updated_at      = now();
        RETURN NEW;
      END;
      $trig$ LANGUAGE plpgsql SECURITY DEFINER
    $func$;

    -- Trigger: fires after every new user row in auth.users
    EXECUTE '
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user()
    ';
  END IF;
END $outer$;
