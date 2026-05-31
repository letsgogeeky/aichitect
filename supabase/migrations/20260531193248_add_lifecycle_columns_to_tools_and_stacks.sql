-- PR 10: Land the lifecycle metadata columns from PRs 1-7 in the DB schema.
-- After this migration the PR 8 hydration in lib/data/hydrateLifecycle.ts
-- becomes a no-op for canonical rows: DB has the values, hydrate-helper's
-- nullish-coalescing chain picks the DB value first.
--
-- Defaults are chosen so existing rows are valid the moment the column lands:
--   tools.scope            → 'ai-native' (the catalog majority)
--   tools.lifecycle_phases → '{}' (empty array — UI iterates safely)
--   tools.archived         → false
--   stacks.track           → 'specialized' (catalog default)
--   stacks.phases          → '{}' (empty array — UI iterates safely)
--
-- The next seed pass populates real values from data/*.json via the extended
-- DbTool / DbStack mappings in scripts/seed-data.ts.

ALTER TABLE tools
  ADD COLUMN IF NOT EXISTS scope            text    NOT NULL DEFAULT 'ai-native',
  ADD COLUMN IF NOT EXISTS lifecycle_phases text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS archived         boolean NOT NULL DEFAULT false;

ALTER TABLE tools
  ADD CONSTRAINT tools_scope_check
    CHECK (scope IN ('ai-native', 'substrate'));

ALTER TABLE stacks
  ADD COLUMN IF NOT EXISTS track  text   NOT NULL DEFAULT 'specialized',
  ADD COLUMN IF NOT EXISTS phases text[] NOT NULL DEFAULT '{}';

ALTER TABLE stacks
  ADD CONSTRAINT stacks_track_check
    CHECK (track IN ('development', 'runtime', 'specialized'));

-- Hot lookups: filter by archived status and by track on the listing pages.
CREATE INDEX IF NOT EXISTS tools_archived_idx ON tools (archived) WHERE archived = true;
CREATE INDEX IF NOT EXISTS stacks_track_idx   ON stacks (track);
