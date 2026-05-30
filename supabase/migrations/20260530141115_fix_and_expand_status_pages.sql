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

INSERT INTO tool_status_page (tool_id, url) VALUES
  ('replicate', 'https://status.replicate.com')
ON CONFLICT (tool_id) DO NOTHING;
