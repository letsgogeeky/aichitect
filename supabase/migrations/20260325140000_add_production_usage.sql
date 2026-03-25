-- ============================================================
-- AIchitect — Production Usage Table (AIC-26)
-- Migration: 20260325140000_add_production_usage
--
-- Allows users to self-report that they use a stack or tool
-- combination in production. One report per user per stack.
-- ============================================================

CREATE TABLE production_usage (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL,
  github_username  text        NOT NULL,
  avatar_url       text,
  -- tool IDs for custom builder stacks; empty when stack_id is set
  tools            text[]      NOT NULL DEFAULT '{}',
  -- set when reporting from a curated stack page
  stack_id         text,
  -- optional user-supplied context
  company_name     text,
  project_url      text,
  reported_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE production_usage ENABLE ROW LEVEL SECURITY;

-- Anyone can read production usage (social proof is public)
CREATE POLICY "Public can read production usage"
  ON production_usage FOR SELECT
  USING (true);

-- Supabase-only: FK to auth.users, insert/delete policies, unique constraint
DO $outer$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth'
  ) THEN
    EXECUTE '
      ALTER TABLE production_usage
        ADD CONSTRAINT production_usage_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
    ';

    EXECUTE '
      CREATE POLICY "Users can insert own production usage"
        ON production_usage FOR INSERT
        WITH CHECK (auth.uid() = user_id)
    ';

    EXECUTE '
      CREATE POLICY "Users can delete own production usage"
        ON production_usage FOR DELETE
        USING (auth.uid() = user_id)
    ';
  END IF;
END $outer$;

-- One report per user per curated stack
CREATE UNIQUE INDEX production_usage_user_stack_uniq
  ON production_usage (user_id, stack_id)
  WHERE stack_id IS NOT NULL;
