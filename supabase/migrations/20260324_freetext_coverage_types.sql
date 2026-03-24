-- ============================================================================
-- Migration: Remove coverage_type CHECK constraints for freetext coverage names
-- Date: 2026-03-24
-- Description: Drops the coverage_type enum CHECK constraints on both
--   template_coverage_requirements and extracted_coverages tables, allowing
--   any freetext string value in the coverage_type column.
--
-- This migration is REQUIRED before deploying the freetext coverage names
-- code changes. Without it, inserts with non-enum coverage_type values
-- (e.g., "Commercial General Liability" instead of "general_liability")
-- will fail with a CHECK constraint violation.
--
-- ⚠️  Run this in the Supabase SQL Editor BEFORE deploying the code changes.
-- ============================================================================

-- Drop CHECK constraint on template_coverage_requirements.coverage_type
-- The constraint name may vary — this covers common naming patterns.
DO $$
BEGIN
  -- Try to drop by common constraint names
  BEGIN
    ALTER TABLE template_coverage_requirements DROP CONSTRAINT IF EXISTS template_coverage_requirements_coverage_type_check;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;

  BEGIN
    ALTER TABLE template_coverage_requirements DROP CONSTRAINT IF EXISTS coverage_type_check;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
END $$;

-- Drop CHECK constraint on extracted_coverages.coverage_type
DO $$
BEGIN
  BEGIN
    ALTER TABLE extracted_coverages DROP CONSTRAINT IF EXISTS extracted_coverages_coverage_type_check;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;

  BEGIN
    ALTER TABLE extracted_coverages DROP CONSTRAINT IF EXISTS coverage_type_check;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
END $$;

-- Also drop any remaining CHECK constraints on these columns by querying
-- the information_schema and dynamically dropping them.
DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  -- template_coverage_requirements
  FOR constraint_rec IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON con.conrelid = rel.oid
    JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
    WHERE rel.relname = 'template_coverage_requirements'
      AND att.attname = 'coverage_type'
      AND con.contype = 'c'  -- CHECK constraint
  LOOP
    EXECUTE 'ALTER TABLE template_coverage_requirements DROP CONSTRAINT ' || quote_ident(constraint_rec.conname);
    RAISE NOTICE 'Dropped constraint % from template_coverage_requirements', constraint_rec.conname;
  END LOOP;

  -- extracted_coverages
  FOR constraint_rec IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON con.conrelid = rel.oid
    JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
    WHERE rel.relname = 'extracted_coverages'
      AND att.attname = 'coverage_type'
      AND con.contype = 'c'  -- CHECK constraint
  LOOP
    EXECUTE 'ALTER TABLE extracted_coverages DROP CONSTRAINT ' || quote_ident(constraint_rec.conname);
    RAISE NOTICE 'Dropped constraint % from extracted_coverages', constraint_rec.conname;
  END LOOP;
END $$;

-- Verify: the coverage_type columns should now accept any text value.
-- Existing data (with old enum values like 'general_liability') is preserved.
