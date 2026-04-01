-- ============================================================================
-- Add trial_emails_sent JSONB column to organizations for tracking which
-- lifecycle emails have been delivered during the trial period.
-- ============================================================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS trial_emails_sent JSONB DEFAULT '{}';
