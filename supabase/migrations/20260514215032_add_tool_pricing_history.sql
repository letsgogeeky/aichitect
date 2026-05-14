-- Persist a snapshot every time a tool's pricing or cost_model changes.
-- The existing sync-health cron computes pricing_hash and emits a single
-- pricing_change event with old+new snapshots — but we throw away history
-- after that. This table banks the full timeline so we can render trends
-- (sparklines, 90-day cost deltas, category averages) and reason about
-- price-cut velocity.

CREATE TABLE IF NOT EXISTS tool_pricing_history (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id      text NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  recorded_at  timestamptz NOT NULL DEFAULT now(),
  pricing      jsonb NOT NULL,
  cost_model   jsonb,
  pricing_hash text NOT NULL,
  -- Structured diff vs previous row: { field_path: { old, new, delta_pct? } }
  -- Computed in sync-health for analytic queries without rejson-walking on read.
  diff         jsonb
);

CREATE INDEX IF NOT EXISTS tool_pricing_history_tool_recorded_idx
  ON tool_pricing_history (tool_id, recorded_at DESC);
