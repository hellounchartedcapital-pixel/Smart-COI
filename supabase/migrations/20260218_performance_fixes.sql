-- ============================================================================
-- Supabase Advisor Performance Fixes
-- 1. Drop legacy tables not in the SmartCOI schema
-- 2. Fix RLS initplan: wrap auth.uid() in (select ...) for per-query eval
-- 3. Fix duplicate permissive policies on template_coverage_requirements
-- ============================================================================


-- ============================================================================
-- 1. DROP LEGACY TABLES
-- These tables are not part of the current SmartCOI schema and may exist
-- from an older version of the application. Drop policies first, then tables.
-- Using IF EXISTS throughout so this is safe on fresh databases.
-- ============================================================================

-- user_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON user_settings;
DROP TABLE IF EXISTS user_settings CASCADE;

-- documents
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
DROP TABLE IF EXISTS documents CASCADE;

-- notification_settings
DROP POLICY IF EXISTS "Users can view own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can insert own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can update own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can delete own notification settings" ON notification_settings;
DROP TABLE IF EXISTS notification_settings CASCADE;

-- units
DROP POLICY IF EXISTS "Users can view own units" ON units;
DROP POLICY IF EXISTS "Users can insert own units" ON units;
DROP POLICY IF EXISTS "Users can update own units" ON units;
DROP POLICY IF EXISTS "Users can delete own units" ON units;
DROP TABLE IF EXISTS units CASCADE;


-- ============================================================================
-- 2. FIX RLS INITPLAN PERFORMANCE
-- Wrap auth.uid() in (select auth.uid()) so Postgres evaluates it once per
-- query instead of once per row. This is the Supabase-recommended pattern.
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
--
-- Note: get_user_organization_id() is already STABLE + SECURITY DEFINER,
-- so Postgres can cache its result. But we also update the function body
-- to use (select auth.uid()) for consistency.
-- ============================================================================

-- 2a. Update get_user_organization_id helper to use initplan
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.users WHERE id = (select auth.uid())
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ---- users ----
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT TO authenticated
  WITH CHECK (id = (select auth.uid()));


-- ============================================================================
-- 3. FIX DUPLICATE PERMISSIVE POLICIES ON template_coverage_requirements
-- The table currently has two overlapping SELECT policies for authenticated:
--   a) "Org members can view coverage requirements" (SELECT, includes system defaults)
--   b) "Org members can manage own coverage requirements" (ALL, org-only)
-- For SELECT operations, both are evaluated and OR'd together, which is
-- redundant and triggers the Supabase Advisor warning.
--
-- Fix: Drop both. Create one SELECT that includes system defaults, and one
-- for INSERT/UPDATE/DELETE scoped to org-only templates.
-- ============================================================================

DROP POLICY IF EXISTS "Org members can view coverage requirements" ON template_coverage_requirements;
DROP POLICY IF EXISTS "Org members can manage own coverage requirements" ON template_coverage_requirements;

-- Single SELECT policy: org templates + system defaults
CREATE POLICY "Org members can view coverage requirements"
  ON template_coverage_requirements FOR SELECT TO authenticated
  USING (
    template_id IN (
      SELECT id FROM requirement_templates
      WHERE organization_id = get_user_organization_id()
        OR (is_system_default = true AND organization_id IS NULL)
    )
  );

-- Separate INSERT policy for org templates only
CREATE POLICY "Org members can insert coverage requirements"
  ON template_coverage_requirements FOR INSERT TO authenticated
  WITH CHECK (
    template_id IN (
      SELECT id FROM requirement_templates WHERE organization_id = get_user_organization_id()
    )
  );

-- Separate UPDATE policy for org templates only
CREATE POLICY "Org members can update coverage requirements"
  ON template_coverage_requirements FOR UPDATE TO authenticated
  USING (
    template_id IN (
      SELECT id FROM requirement_templates WHERE organization_id = get_user_organization_id()
    )
  );

-- Separate DELETE policy for org templates only
CREATE POLICY "Org members can delete coverage requirements"
  ON template_coverage_requirements FOR DELETE TO authenticated
  USING (
    template_id IN (
      SELECT id FROM requirement_templates WHERE organization_id = get_user_organization_id()
    )
  );
