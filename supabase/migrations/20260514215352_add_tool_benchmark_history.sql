-- Weekly time series of LLM benchmark numbers (TTFT, throughput, price).
-- The sync-benchmarks cron currently writes the latest value back onto
-- the tools row and discards the previous one — fine for the simulator
-- but it leaves us blind to drift. With this table every weekly run banks
-- a row, so we can render throughput trends, fire benchmark_drift events
-- on significant WoW change, and chart the speed-of-light frontier across
-- providers over time.

CREATE TABLE IF NOT EXISTS tool_benchmark_history (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id                  text NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  recorded_at              timestamptz NOT NULL DEFAULT now(),
  ttft_p50_ms              integer,
  output_tokens_per_second integer,
  -- AA also exposes a separate "time to first answer token" for reasoning models.
  ttfa_p50_ms              integer,
  input_cost_per_1k        numeric(10, 8),
  output_cost_per_1k       numeric(10, 8),
  -- AA slug at time of measurement. Drift on this field signals the upstream
  -- model rolled over (e.g. claude-sonnet-4-6 → claude-sonnet-4-7).
  model_slug               text,
  source                   text NOT NULL DEFAULT 'artificial_analysis'
);

CREATE INDEX IF NOT EXISTS tool_benchmark_history_tool_recorded_idx
  ON tool_benchmark_history (tool_id, recorded_at DESC);
