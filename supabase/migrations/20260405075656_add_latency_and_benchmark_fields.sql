-- Add benchmark fields to tools table (AIC-126 / Artificial Analysis integration).
-- latency_p50_ms: TTFT in ms. LLM providers synced from AA API; vector DBs
--   and frameworks populated from their own documentation benchmarks.
-- benchmark_synced_at: timestamp of last successful Artificial Analysis sync.
ALTER TABLE tools ADD COLUMN IF NOT EXISTS latency_p50_ms INTEGER;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS benchmark_synced_at TIMESTAMPTZ;
