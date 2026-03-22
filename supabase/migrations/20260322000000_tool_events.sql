-- ============================================================
-- AIchitect — Tool Events
-- Migration: 20260322000000_tool_events
--
-- Stores change events detected during nightly sync.
-- First event type: "pricing_change" (AIC-45).
-- Future: stale detection, health threshold crossing, etc.
-- ============================================================

CREATE TABLE tool_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id     text        NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  type        text        NOT NULL,       -- e.g. 'pricing_change'
  detected_at timestamptz NOT NULL DEFAULT now(),
  old_hash    text,                       -- null on first-run hash initialisation
  new_hash    text,
  metadata    jsonb       NOT NULL DEFAULT '{}'
);

CREATE INDEX tool_events_tool_id_idx    ON tool_events (tool_id);
CREATE INDEX tool_events_type_idx       ON tool_events (type);
CREATE INDEX tool_events_detected_at_idx ON tool_events (detected_at DESC);

ALTER TABLE tool_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read tool_events"
  ON tool_events FOR SELECT
  TO anon, authenticated
  USING (true);
