-- AIC-65: Archetype-aware slot priority
-- Changes slots.priority from a plain text enum to a jsonb map keyed by
-- StackArchetype (dev-productivity | app-infrastructure | hybrid).
-- This allows the Genome engine to skip irrelevant slots per stack type
-- (e.g. inference is not-applicable for dev-productivity stacks).

-- 1. Drop the old CHECK constraint and change column type to jsonb.
ALTER TABLE slots
  DROP CONSTRAINT IF EXISTS slots_priority_check;

ALTER TABLE slots
  ALTER COLUMN priority TYPE jsonb USING priority::jsonb;

-- 2. Back-fill all 20 slots with their per-archetype priority maps.
UPDATE slots SET priority = '{"dev-productivity": "required", "app-infrastructure": "not-applicable", "hybrid": "optional"}' WHERE id = 'code-editor';
UPDATE slots SET priority = '{"dev-productivity": "recommended", "app-infrastructure": "not-applicable", "hybrid": "optional"}' WHERE id = 'cli-agent';
UPDATE slots SET priority = '{"dev-productivity": "optional", "app-infrastructure": "not-applicable", "hybrid": "optional"}' WHERE id = 'swe-agent';
UPDATE slots SET priority = '{"dev-productivity": "not-applicable", "app-infrastructure": "recommended", "hybrid": "recommended"}' WHERE id = 'agent-framework';
UPDATE slots SET priority = '{"dev-productivity": "not-applicable", "app-infrastructure": "optional", "hybrid": "optional"}' WHERE id = 'orchestration';
UPDATE slots SET priority = '{"dev-productivity": "not-applicable", "app-infrastructure": "optional", "hybrid": "optional"}' WHERE id = 'model-router';
UPDATE slots SET priority = '{"dev-productivity": "not-applicable", "app-infrastructure": "required", "hybrid": "required"}' WHERE id = 'inference';
UPDATE slots SET priority = '{"dev-productivity": "not-applicable", "app-infrastructure": "optional", "hybrid": "optional"}' WHERE id = 'vector-db';
UPDATE slots SET priority = '{"dev-productivity": "not-applicable", "app-infrastructure": "recommended", "hybrid": "recommended"}' WHERE id = 'observability';
UPDATE slots SET priority = '{"dev-productivity": "optional", "app-infrastructure": "not-applicable", "hybrid": "optional"}' WHERE id = 'design-to-code';
UPDATE slots SET priority = '{"dev-productivity": "optional", "app-infrastructure": "not-applicable", "hybrid": "optional"}' WHERE id = 'devops-automation';
UPDATE slots SET priority = '{"dev-productivity": "optional", "app-infrastructure": "optional", "hybrid": "optional"}' WHERE id = 'mcp-infra';
UPDATE slots SET priority = '{"dev-productivity": "not-applicable", "app-infrastructure": "recommended", "hybrid": "optional"}' WHERE id = 'prompt-eval';
UPDATE slots SET priority = '{"dev-productivity": "optional", "app-infrastructure": "optional", "hybrid": "optional"}' WHERE id = 'docs';
UPDATE slots SET priority = '{"dev-productivity": "optional", "app-infrastructure": "optional", "hybrid": "optional"}' WHERE id = 'product-mgmt';
UPDATE slots SET priority = '{"dev-productivity": "optional", "app-infrastructure": "optional", "hybrid": "optional"}' WHERE id = 'specifications';
UPDATE slots SET priority = '{"dev-productivity": "not-applicable", "app-infrastructure": "optional", "hybrid": "optional"}' WHERE id = 'fine-tuning';
UPDATE slots SET priority = '{"dev-productivity": "not-applicable", "app-infrastructure": "optional", "hybrid": "optional"}' WHERE id = 'voice-ai';
UPDATE slots SET priority = '{"dev-productivity": "not-applicable", "app-infrastructure": "optional", "hybrid": "optional"}' WHERE id = 'multimodal';
UPDATE slots SET priority = '{"dev-productivity": "optional", "app-infrastructure": "optional", "hybrid": "optional"}' WHERE id = 'browser-automation';

-- 3. Add a NOT NULL constraint (column was already NOT NULL, preserve it).
ALTER TABLE slots
  ALTER COLUMN priority SET NOT NULL;
