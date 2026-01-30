-- Add RLS policies for tenants table
-- Enables users to manage their own tenant records

-- Ensure RLS is enabled
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own tenants" ON tenants;
DROP POLICY IF EXISTS "Users can insert own tenants" ON tenants;
DROP POLICY IF EXISTS "Users can update own tenants" ON tenants;
DROP POLICY IF EXISTS "Users can delete own tenants" ON tenants;

-- Policy: Users can view their own tenants
CREATE POLICY "Users can view own tenants"
ON tenants FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own tenants
CREATE POLICY "Users can insert own tenants"
ON tenants FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tenants
CREATE POLICY "Users can update own tenants"
ON tenants FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own tenants
CREATE POLICY "Users can delete own tenants"
ON tenants FOR DELETE
USING (auth.uid() = user_id);
