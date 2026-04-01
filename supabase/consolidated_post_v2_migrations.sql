-- ============================================================================
-- SmartCOI — Consolidated Post-v2 Migrations
-- ============================================================================
-- Run this in the Supabase SQL Editor to apply ALL schema changes that were
-- added after the v2 base schema (fresh_setup.sql).
--
-- This script is IDEMPOTENT — safe to re-run on any database that already
-- has some or all of these changes.
--
-- Changes included:
--   1. create_org_and_profile() signup helper function
--   2. Tighten organizations INSERT RLS policy
--   3. organizations.plan + trial_ends_at (trial tracking)
--   4. organizations.stripe_customer_id/stripe_subscription_id/payment_failed
--   5. certificates.insured_name
--   6. notifications type constraint expanded for 'portal_upload'
--   7. Revoke anon SELECT on vendors/tenants
--   8. vendors.archived_at + tenants.archived_at
-- ============================================================================


-- ============================================================================
-- 1. SIGNUP HELPER FUNCTION: create_org_and_profile()
-- Creates an organization + user profile in a single SECURITY DEFINER call,
-- bypassing RLS so the signup flow works before the user has an org.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_org_and_profile(
  org_name TEXT,
  user_email TEXT,
  user_full_name TEXT
)
RETURNS UUID AS $$
DECLARE
  new_org_id UUID;
BEGIN
  INSERT INTO public.organizations (name)
  VALUES (org_name)
  RETURNING id INTO new_org_id;

  INSERT INTO public.users (id, organization_id, email, full_name, role)
  VALUES (auth.uid(), new_org_id, user_email, user_full_name, 'manager');

  RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- ============================================================================
-- 2. TIGHTEN ORGANIZATIONS INSERT POLICY
-- The fresh_setup has WITH CHECK (true) which allows any authenticated user
-- to insert any org. Since create_org_and_profile bypasses RLS anyway,
-- tighten to prevent direct INSERT abuse.
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT TO authenticated
  WITH CHECK (id = get_user_organization_id());


-- ============================================================================
-- 3. TRIAL TRACKING: organizations.plan + trial_ends_at
-- ============================================================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT NULL;

-- Backfill existing orgs with a 14-day trial if not already set
UPDATE organizations
SET
  trial_ends_at = COALESCE(trial_ends_at, now() + INTERVAL '14 days'),
  plan = COALESCE(NULLIF(plan, 'trial'), 'trial')
WHERE trial_ends_at IS NULL;


-- ============================================================================
-- 4. STRIPE BILLING COLUMNS
-- ============================================================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_failed BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer_id
  ON organizations (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;


-- ============================================================================
-- 5. CERTIFICATES: insured_name column
-- Stores the extracted insured name from COI for vendor matching
-- ============================================================================

ALTER TABLE certificates ADD COLUMN IF NOT EXISTS insured_name TEXT;


-- ============================================================================
-- 6. NOTIFICATIONS: expand type constraint to include 'portal_upload'
-- ============================================================================

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'expiration_warning', 'gap_notification', 'follow_up_reminder',
    'escalation', 'portal_upload'
  ));


-- ============================================================================
-- 7. REVOKE ANON SELECT ON VENDORS/TENANTS
-- Portal routes use the service role client, so anon access is not needed.
-- ============================================================================

REVOKE SELECT ON vendors FROM anon;
REVOKE SELECT ON tenants FROM anon;


-- ============================================================================
-- 8. ARCHIVE FEATURE: archived_at on vendors and tenants
-- Archived entities are hidden from active lists but preserved for history.
-- ============================================================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_vendors_archived_at
  ON vendors (archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_archived_at
  ON tenants (archived_at) WHERE archived_at IS NOT NULL;


-- ============================================================================
-- DONE. Verify by running:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'organizations' ORDER BY ordinal_position;
--
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'certificates' ORDER BY ordinal_position;
--
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'vendors' ORDER BY ordinal_position;
-- ============================================================================

-- ============================================================================
-- Add endorsement_data JSONB column to certificates
-- ============================================================================
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS endorsement_data JSONB DEFAULT NULL;

-- ============================================================================
-- Add entity name columns to requirement_templates (for lease extraction)
-- ============================================================================
ALTER TABLE requirement_templates
  ADD COLUMN IF NOT EXISTS additional_insured_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS certificate_holder_name TEXT DEFAULT NULL;

-- ============================================================================
-- Add trial_emails_sent JSONB column for lifecycle email tracking
-- ============================================================================
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS trial_emails_sent JSONB DEFAULT '{}';
