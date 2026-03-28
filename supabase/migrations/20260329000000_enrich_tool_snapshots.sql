-- ============================================================
-- AIchitect — Enrich tool_snapshots
-- Migration: 20260329000000_enrich_tool_snapshots
--
-- AIC-96: add health_score + stars_delta to tool_snapshots so
-- the sync pipeline can persist historical score trends and
-- actual star velocity instead of just direction.
-- ============================================================

ALTER TABLE tool_snapshots
  ADD COLUMN health_score integer CHECK (health_score BETWEEN 0 AND 100),
  ADD COLUMN stars_delta  integer;  -- null on first snapshot for a tool; computed vs 30d-prior snapshot
