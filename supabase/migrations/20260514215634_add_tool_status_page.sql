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
INSERT INTO tool_status_page (tool_id, url) VALUES
  ('openai-api',         'https://status.openai.com'),
  ('anthropic-api',      'https://status.anthropic.com'),
  ('mistral-api',        'https://status.mistral.ai'),
  ('groq',               'https://groqstatus.com'),
  ('cohere-api',         'https://status.cohere.com'),
  ('perplexity-api',     'https://status.perplexity.com'),
  ('pinecone',           'https://status.pinecone.io'),
  ('weaviate',           'https://status.weaviate.io')
ON CONFLICT (tool_id) DO NOTHING;
