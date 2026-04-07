-- Add industry column to organizations table
-- Run this migration via the Supabase SQL Editor

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS industry TEXT DEFAULT NULL;

-- Add a CHECK constraint for valid industry values
ALTER TABLE organizations
  ADD CONSTRAINT organizations_industry_check
  CHECK (industry IS NULL OR industry IN (
    'property_management',
    'construction',
    'logistics',
    'healthcare',
    'manufacturing',
    'hospitality',
    'retail',
    'other'
  ));

-- No RLS changes needed: the industry column inherits the existing
-- row-level policies on the organizations table, which already allow
-- authenticated org members to SELECT and UPDATE their own org row.
