-- ============================================================
-- AIchitect — Initial Schema
-- Migration: 20260321000000_initial_schema
--
-- Creates the five core tables that replace the static JSON files,
-- plus health/snapshot fields required by the sync pipeline.
--
-- RLS policy: all tables are publicly readable; writes are
-- restricted to the service role (which bypasses RLS).
-- ============================================================


-- ------------------------------------------------------------
-- Helpers
-- ------------------------------------------------------------

-- Automatically update updated_at on row changes.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ------------------------------------------------------------
-- Table: tools
-- Mirrors data/tools.json + health fields populated by the
-- nightly sync pipeline (AIC-9).
-- ------------------------------------------------------------

CREATE TABLE tools (
  id              text        PRIMARY KEY,
  name            text        NOT NULL,
  category        text        NOT NULL,
  tagline         text        NOT NULL,
  description     text        NOT NULL,
  type            text        NOT NULL CHECK (type IN ('oss', 'commercial')),
  pricing         jsonb       NOT NULL DEFAULT '{}',
  github_stars    integer,
  slot            text        NOT NULL,
  prominent       boolean     NOT NULL DEFAULT false,
  provider        text,
  choose_if       text[]      NOT NULL DEFAULT '{}',
  aliases         jsonb       NOT NULL DEFAULT '{"npm":[],"pip":[],"env_vars":[],"config_files":[]}',
  website_url     text,
  github_url      text,

  -- Populated by nightly health sync (AIC-9); null until first run
  health_score    integer     CHECK (health_score BETWEEN 0 AND 100),
  last_synced_at  timestamptz,
  is_stale        boolean     NOT NULL DEFAULT false,

  -- Pricing change detection (AIC-11)
  pricing_hash    text,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER tools_set_updated_at
  BEFORE UPDATE ON tools
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ------------------------------------------------------------
-- Table: stacks
-- Mirrors data/stacks.json.
-- ------------------------------------------------------------

CREATE TABLE stacks (
  id              text        PRIMARY KEY,
  name            text        NOT NULL,
  description     text        NOT NULL,
  target          text        NOT NULL,
  cluster         text        NOT NULL CHECK (cluster IN ('build', 'automate', 'ship', 'comply', 'understand')),
  mission         text        NOT NULL,
  tools           text[]      NOT NULL DEFAULT '{}',
  -- [{ from: string, to: string, label: string }]
  flow            jsonb       NOT NULL DEFAULT '[]',
  -- [{ tool: string, reason: string }]
  not_in_stack    jsonb       NOT NULL DEFAULT '[]',
  kill_conditions text[]      NOT NULL DEFAULT '{}',
  graduates_to    text        REFERENCES stacks(id),
  tags            text[]      NOT NULL DEFAULT '{}',
  why             text,
  tradeoffs       text,
  complexity      text        CHECK (complexity IN ('beginner', 'intermediate', 'advanced')),
  monthly_cost    text,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER stacks_set_updated_at
  BEFORE UPDATE ON stacks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ------------------------------------------------------------
-- Table: relationships
-- Mirrors data/relationships.json.
-- Enriched relationships include `how` and `achieves` fields.
-- ------------------------------------------------------------

CREATE TABLE relationships (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source      text        NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  target      text        NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  type        text        NOT NULL CHECK (type IN ('integrates-with', 'commonly-paired', 'competes-with')),
  how         text,
  achieves    text,
  created_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE (source, target, type)
);

CREATE INDEX relationships_source_idx ON relationships (source);
CREATE INDEX relationships_target_idx ON relationships (target);
CREATE INDEX relationships_type_idx   ON relationships (type);


-- ------------------------------------------------------------
-- Table: slots
-- Mirrors data/slots.json.
-- ------------------------------------------------------------

CREATE TABLE slots (
  id             text        PRIMARY KEY,
  name           text        NOT NULL,
  description    text        NOT NULL,
  tools          text[]      NOT NULL DEFAULT '{}',
  priority       text        NOT NULL CHECK (priority IN ('required', 'recommended', 'optional')),
  suggest        text,
  suggest_reason text,

  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER slots_set_updated_at
  BEFORE UPDATE ON slots
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ------------------------------------------------------------
-- Table: tool_snapshots
-- One row per tool per sync run. Grows by ~(tools with github_url)
-- rows per nightly cron execution.
-- ------------------------------------------------------------

CREATE TABLE tool_snapshots (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id        text        NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  stars          integer,
  last_commit_at timestamptz,
  open_issues    integer,
  forks          integer,
  archived       boolean     NOT NULL DEFAULT false,
  recorded_at    timestamptz NOT NULL DEFAULT now()
);

-- Required for efficient time-series queries: "latest snapshot for tool X"
CREATE INDEX tool_snapshots_tool_recorded_idx
  ON tool_snapshots (tool_id, recorded_at DESC);


-- ------------------------------------------------------------
-- Roles
--
-- `anon` and `authenticated` are built-in Supabase roles.
-- On bare Postgres (local dev) they don't exist, so we create
-- them as no-login roles. On hosted Supabase this is a no-op.
-- ------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END
$$;

-- ------------------------------------------------------------
-- Row-Level Security
--
-- Strategy: reads are public (anon + authenticated).
-- Writes are service-role only — the service_role key bypasses
-- RLS entirely, so no write policies are needed.
-- ------------------------------------------------------------

ALTER TABLE tools          ENABLE ROW LEVEL SECURITY;
ALTER TABLE stacks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships  ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "public read tools"
  ON tools FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public read stacks"
  ON stacks FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public read relationships"
  ON relationships FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public read slots"
  ON slots FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public read tool_snapshots"
  ON tool_snapshots FOR SELECT
  TO anon, authenticated
  USING (true);
