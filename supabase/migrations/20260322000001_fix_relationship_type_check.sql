-- Fix relationship type check constraint.
-- The initial schema used 'commonly-paired' but the data and codebase
-- use 'commonly-paired-with'. Drop and re-add with the correct value.

-- 1. Drop constraint so the UPDATE below isn't blocked by the old allowed values.
ALTER TABLE relationships
  DROP CONSTRAINT relationships_type_check;

-- 2. Normalise existing rows to the canonical value.
UPDATE relationships
  SET type = 'commonly-paired-with'
  WHERE type = 'commonly-paired';

-- 3. Re-add constraint with the correct value.
ALTER TABLE relationships
  ADD CONSTRAINT relationships_type_check
  CHECK (type IN ('integrates-with', 'commonly-paired-with', 'competes-with'));
