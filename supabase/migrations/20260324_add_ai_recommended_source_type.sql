-- ============================================================================
-- Migration: Add 'ai_recommended' to source_type CHECK constraint
-- Date: 2026-03-24
-- Description: Extends the source_type CHECK constraint on requirement_templates
--   to allow 'ai_recommended' alongside existing 'manual' and 'lease_extraction'.
--
-- ⚠️  Run this in the Supabase SQL Editor BEFORE deploying the code changes.
-- ============================================================================

DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  -- Drop any existing CHECK constraints on source_type
  FOR constraint_rec IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON con.conrelid = rel.oid
    JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
    WHERE rel.relname = 'requirement_templates'
      AND att.attname = 'source_type'
      AND con.contype = 'c'
  LOOP
    EXECUTE 'ALTER TABLE requirement_templates DROP CONSTRAINT ' || quote_ident(constraint_rec.conname);
  END LOOP;
END $$;

-- Add updated CHECK constraint with new value
ALTER TABLE requirement_templates ADD CONSTRAINT requirement_templates_source_type_check
  CHECK (source_type IN ('manual', 'lease_extraction', 'ai_recommended'));
