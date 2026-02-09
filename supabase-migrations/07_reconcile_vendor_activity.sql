-- Migration: Reconcile vendor_activity schema
-- Two prior migrations created this table with different column names.
-- This migration ensures ALL columns exist regardless of which migration ran first.
-- Run this in the Supabase SQL Editor.

-- First, ensure the table exists at all
CREATE TABLE IF NOT EXISTS vendor_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT,
  details JSONB,
  activity_type VARCHAR(50),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns (safe to run regardless of which schema exists)
ALTER TABLE vendor_activity ADD COLUMN IF NOT EXISTS action TEXT;
ALTER TABLE vendor_activity ADD COLUMN IF NOT EXISTS details JSONB;
ALTER TABLE vendor_activity ADD COLUMN IF NOT EXISTS activity_type VARCHAR(50);
ALTER TABLE vendor_activity ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE vendor_activity ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Remove NOT NULL constraints that may exist (so either column set can be used)
DO $$
BEGIN
  -- Make activity_type nullable if it exists and has NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_activity' AND column_name = 'activity_type' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE vendor_activity ALTER COLUMN activity_type DROP NOT NULL;
  END IF;

  -- Make action nullable if it exists and has NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendor_activity' AND column_name = 'action' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE vendor_activity ALTER COLUMN action DROP NOT NULL;
  END IF;
END $$;

-- Backfill: copy data between column sets for any existing rows
UPDATE vendor_activity SET action = activity_type WHERE action IS NULL AND activity_type IS NOT NULL;
UPDATE vendor_activity SET activity_type = action WHERE activity_type IS NULL AND action IS NOT NULL;
UPDATE vendor_activity SET details = metadata WHERE details IS NULL AND metadata IS NOT NULL;
UPDATE vendor_activity SET metadata = details WHERE metadata IS NULL AND details IS NOT NULL;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_vendor_activity_vendor ON vendor_activity(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_activity_user ON vendor_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_activity_action ON vendor_activity(action);
CREATE INDEX IF NOT EXISTS idx_vendor_activity_created_at ON vendor_activity(created_at DESC);

-- Enable RLS
ALTER TABLE vendor_activity ENABLE ROW LEVEL SECURITY;

-- RLS policies (use IF NOT EXISTS to avoid errors if they already exist)
DO $$
BEGIN
  -- Drop and recreate policies to ensure they're correct
  DROP POLICY IF EXISTS "Users can view own vendor activity" ON vendor_activity;
  DROP POLICY IF EXISTS "Users can insert own vendor activity" ON vendor_activity;
  DROP POLICY IF EXISTS "Allow anonymous activity insert" ON vendor_activity;
END $$;

CREATE POLICY "Users can view own vendor activity"
  ON vendor_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vendor activity"
  ON vendor_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow anonymous insert for vendor upload portal (unauthenticated uploads)
CREATE POLICY "Allow anonymous activity insert"
  ON vendor_activity FOR INSERT
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT ON vendor_activity TO authenticated;
GRANT INSERT ON vendor_activity TO anon;
GRANT ALL ON vendor_activity TO service_role;
