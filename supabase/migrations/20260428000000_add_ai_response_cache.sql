-- Cache table for AI-generated roast and challenge responses.
-- Keyed by SHA-256 of (sorted input params + type). TTL enforced by expires_at.
-- RLS disabled — responses contain no user-specific or sensitive data.
CREATE TABLE ai_response_cache (
  cache_key  TEXT        PRIMARY KEY,
  response   JSONB       NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_ai_response_cache_expires ON ai_response_cache (expires_at);

ALTER TABLE ai_response_cache DISABLE ROW LEVEL SECURITY;
