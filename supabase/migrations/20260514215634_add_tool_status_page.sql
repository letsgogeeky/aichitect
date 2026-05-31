-- Mapping from tool_id to the vendor's public status page.
-- For now we only handle Atlassian Statuspage instances — they all expose
-- /api/v2/incidents.json in the same format, which is what the sync-incidents
-- cron parses. Other vendors (Vercel on Better Stack, GitHub's own format)
-- will need their own `kind` value and parser when added.

CREATE TABLE IF NOT EXISTS tool_status_page (
  tool_id  text PRIMARY KEY REFERENCES tools(id) ON DELETE CASCADE,
  url      text NOT NULL,
  kind     text NOT NULL DEFAULT 'atlassian_statuspage',
  enabled  boolean NOT NULL DEFAULT true
);

-- Initial mapping for major LLM + vector-DB providers. All Atlassian Statuspage.
--
-- The WHERE EXISTS guard is so a fresh local DB (where this migration runs
-- before seeding) doesn't crash on the FK to tools(id). Rows whose target tool
-- doesn't exist yet are skipped here; the seed pass populates them later via
-- scripts/seed-db.ts. In prod this is a no-op (tools were already seeded
-- when this migration first applied — verified May 2026).
INSERT INTO tool_status_page (tool_id, url)
SELECT v.tool_id, v.url
FROM (VALUES
  ('openai-api',         'https://status.openai.com'),
  ('anthropic-api',      'https://status.anthropic.com'),
  ('mistral-api',        'https://status.mistral.ai'),
  ('groq',               'https://groqstatus.com'),
  ('cohere-api',         'https://status.cohere.com'),
  ('perplexity-api',     'https://status.perplexity.com'),
  ('pinecone',           'https://status.pinecone.io'),
  ('weaviate',           'https://status.weaviate.io')
) AS v(tool_id, url)
WHERE EXISTS (SELECT 1 FROM tools WHERE tools.id = v.tool_id)
ON CONFLICT (tool_id) DO NOTHING;
