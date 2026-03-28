-- ============================================================
-- AIchitect — Add stars_delta to tools
-- Migration: 20260329000001_add_stars_delta_to_tools
--
-- AIC-97: denormalize the latest 30d star velocity from
-- tool_snapshots onto the tools row so it is available
-- without an extra join wherever a Tool is loaded.
-- The nightly cron keeps this in sync.
-- ============================================================

ALTER TABLE tools
  ADD COLUMN stars_delta integer;  -- null until first 30d comparison point exists
