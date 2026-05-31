-- Status-page seed cleanup.
--
-- Three of the original eight status pages no longer return an
-- Atlassian Statuspage payload (verified 2026-05-30):
--   - status.mistral.ai     → HTML, Mistral migrated off Atlassian
--   - status.perplexity.com → 404, Perplexity moved their status page
--   - status.weaviate.io    → DNS fails, host no longer exists
--
-- Disable rather than delete so we keep the row history for when those
-- vendors expose a new endpoint and we can flip enabled back on.
--
-- Also adds replicate, the only new candidate from the May 30 sweep
-- that returned a clean Atlassian payload.

UPDATE tool_status_page
SET enabled = false
WHERE tool_id IN ('mistral-api', 'perplexity-api', 'weaviate');

-- Same WHERE EXISTS guard as 20260514215634 — fresh local DBs apply migrations
-- before seeding, so the FK target tool may not exist yet. Skipped rows are
-- backfilled by scripts/seed-db.ts after tools are seeded. No-op in prod.
INSERT INTO tool_status_page (tool_id, url)
SELECT v.tool_id, v.url
FROM (VALUES
  ('replicate', 'https://status.replicate.com')
) AS v(tool_id, url)
WHERE EXISTS (SELECT 1 FROM tools WHERE tools.id = v.tool_id)
ON CONFLICT (tool_id) DO NOTHING;
