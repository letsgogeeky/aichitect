-- Add cost_model JSONB column to tools table for the AI Stack Simulator (AIC-124).
-- Kept separate from the existing pricing column by design: pricing is a display/marketing
-- model (tier names, price strings for UI); cost_model is a computation model
-- (numeric rates the simulator uses to project cost at scale).
ALTER TABLE tools ADD COLUMN IF NOT EXISTS cost_model JSONB;
