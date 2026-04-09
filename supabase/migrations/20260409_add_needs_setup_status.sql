-- ============================================================================
-- Migration: Add 'needs_setup' to compliance_status CHECK constraints
--
-- Context: Entities without requirement templates should show 'needs_setup'
-- instead of 'under_review' (which means COI is being processed).
-- This adds the new value to all 3 tables with compliance_status columns.
--
-- Safe to run on production — only widens the CHECK constraint.
-- ============================================================================

-- Drop and recreate CHECK constraints to include 'needs_setup'

-- vendors table
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_compliance_status_check;
ALTER TABLE vendors ADD CONSTRAINT vendors_compliance_status_check
  CHECK (compliance_status IN ('compliant', 'non_compliant', 'expiring_soon', 'expired', 'pending', 'under_review', 'needs_setup'));

-- tenants table
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_compliance_status_check;
ALTER TABLE tenants ADD CONSTRAINT tenants_compliance_status_check
  CHECK (compliance_status IN ('compliant', 'non_compliant', 'expiring_soon', 'expired', 'pending', 'under_review', 'needs_setup'));

-- entities table
ALTER TABLE entities DROP CONSTRAINT IF EXISTS entities_compliance_status_check;
ALTER TABLE entities ADD CONSTRAINT entities_compliance_status_check
  CHECK (compliance_status IN ('compliant', 'non_compliant', 'expiring_soon', 'expired', 'pending', 'under_review', 'needs_setup'));
