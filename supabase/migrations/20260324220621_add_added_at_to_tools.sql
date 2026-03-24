-- AIC-78: Add added_at column to tools table
-- Tracks when a tool was first added to the directory.
-- Drives the "New" badge (tools added within 30 days) and the /changelog page.
-- Nullable — existing tools have no known add date; set during seed or backfill.

ALTER TABLE tools
  ADD COLUMN IF NOT EXISTS added_at date;

COMMENT ON COLUMN tools.added_at IS
  'ISO date when this tool was first added to the directory. Drives the "New" badge and /changelog freshness view.';