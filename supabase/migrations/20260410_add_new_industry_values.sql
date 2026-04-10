-- ============================================================================
-- SmartCOI — Add new industry values for simplified onboarding
-- Adds 'general_contractor' and 'professional_services' to the industry
-- CHECK constraint on organizations table.
-- ============================================================================

-- Drop the existing constraint and re-create with expanded values
ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_industry_check;

ALTER TABLE organizations
  ADD CONSTRAINT organizations_industry_check
  CHECK (industry IS NULL OR industry IN (
    'property_management',
    'general_contractor',
    'construction',
    'logistics',
    'healthcare',
    'professional_services',
    'manufacturing',
    'hospitality',
    'retail',
    'other'
  ));
