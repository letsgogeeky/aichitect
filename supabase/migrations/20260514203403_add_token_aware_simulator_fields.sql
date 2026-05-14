-- Token-aware simulator fields. Together with the existing latency_p50_ms / cost_model
-- jsonb, this lets the engine compute total LLM latency as TTFT + (output / throughput),
-- enforce rate-limit ceilings, and project vector-DB storage from a vector count.

ALTER TABLE tools ADD COLUMN IF NOT EXISTS ttft_p50_ms INTEGER;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS output_tokens_per_second INTEGER;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS max_tpm INTEGER;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS max_rpm INTEGER;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS bytes_per_vector INTEGER;
