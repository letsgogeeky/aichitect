-- Add context column to relationships
-- Stores the archetype context for cross-paradigm edges.
-- NULL means the edge applies universally.
-- 'hybrid' means the edge only applies when the detected stack spans both archetypes.

ALTER TABLE relationships
  ADD COLUMN context text CHECK (context IN ('dev-productivity', 'app-infrastructure', 'hybrid'));
