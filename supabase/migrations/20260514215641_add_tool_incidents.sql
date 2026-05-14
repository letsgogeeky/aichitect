-- Vendor incident records, scraped hourly from public status pages.
-- The sync-incidents cron upserts by (tool_id, external_id) so re-runs are
-- idempotent. Once an incident's `ended_at` flips from null, an
-- incident_resolved event is emitted; on first sight of a major-or-worse
-- incident we emit incident_started. This lets us:
--   - render an uptime % and incident timeline on the tool detail page
--   - rank tools by reliability over a rolling 90-day window
--   - feed a "reliability tax" line into the simulator at scale

CREATE TABLE IF NOT EXISTS tool_incidents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id         text NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  external_id     text NOT NULL,
  started_at      timestamptz NOT NULL,
  ended_at        timestamptz,
  -- Atlassian Statuspage values: 'none' | 'minor' | 'major' | 'critical'
  severity        text NOT NULL,
  -- Statuspage lifecycle: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  status          text NOT NULL,
  title           text NOT NULL,
  -- Affected components (Statuspage "components" field, name array)
  scope           text[],
  url             text NOT NULL,
  last_synced_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tool_id, external_id)
);

CREATE INDEX IF NOT EXISTS tool_incidents_tool_started_idx
  ON tool_incidents (tool_id, started_at DESC);
