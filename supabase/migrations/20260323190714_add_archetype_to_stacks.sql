-- AIC-67: Add archetype to stacks table
-- Classifies each stack as dev-productivity, app-infrastructure, or hybrid.
-- Used by the Genome for archetype-aware graduation detection, and by the
-- Stacks view for filtering/grouping by paradigm.

ALTER TABLE stacks
  ADD COLUMN archetype text NOT NULL DEFAULT 'app-infrastructure'
    CHECK (archetype IN ('dev-productivity', 'app-infrastructure', 'hybrid'));

-- Back-fill from the classification in stacks.json.

UPDATE stacks SET archetype = 'dev-productivity'
  WHERE id IN ('design-to-code', 'mcp-power-user');

UPDATE stacks SET archetype = 'hybrid'
  WHERE id IN (
    'indie-hacker',
    'typescript-only',
    'zero-budget-oss',
    'agentic-coding',
    'multi-agent-devops',
    'browser-agent',
    'spec-driven-ai'
  );

-- Remaining 16 stacks keep the default 'app-infrastructure'.
