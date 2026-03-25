-- ============================================================
-- AIchitect — Tool Usage Table (AIC-85)
-- Migration: 20260325160000_add_tool_usage
--
-- Allows users to self-report that they use an individual tool.
-- One mark per user per tool. Powers per-tool usage counts and
-- the per-tool badge system (/badge/tool/[toolId]).
-- ============================================================

CREATE TABLE tool_usage (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL,
  github_username  text        NOT NULL,
  avatar_url       text,
  tool_id          text        NOT NULL,
  used_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, tool_id)
);

ALTER TABLE tool_usage ENABLE ROW LEVEL SECURITY;

-- Anyone can read tool usage (social proof is public)
CREATE POLICY "Public can read tool usage"
  ON tool_usage FOR SELECT
  USING (true);

-- Supabase-only: FK to auth.users, insert/delete policies
DO $outer$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth'
  ) THEN
    EXECUTE '
      ALTER TABLE tool_usage
        ADD CONSTRAINT tool_usage_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
    ';

    EXECUTE '
      CREATE POLICY "Users can insert own tool usage"
        ON tool_usage FOR INSERT
        WITH CHECK (auth.uid() = user_id)
    ';

    EXECUTE '
      CREATE POLICY "Users can delete own tool usage"
        ON tool_usage FOR DELETE
        USING (auth.uid() = user_id)
    ';
  END IF;
END $outer$;
