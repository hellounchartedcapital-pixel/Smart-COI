-- Fix plan limit triggers to exclude soft-deleted records
-- The enforce_vendor_limit and enforce_tenant_limit triggers were counting
-- soft-deleted records (deleted_at IS NOT NULL) toward the plan limit,
-- preventing users from creating new vendors/tenants even after deletion.

CREATE OR REPLACE FUNCTION enforce_vendor_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get current vendor count for this user, excluding soft-deleted
  SELECT COUNT(*) INTO current_count
  FROM vendors
  WHERE user_id = NEW.user_id
    AND deleted_at IS NULL;

  -- Get the user's vendor limit
  max_allowed := get_user_vendor_limit(NEW.user_id);

  -- Check if adding this vendor would exceed the limit
  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Vendor limit reached. Your plan allows % vendors. Please upgrade to add more.', max_allowed;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION enforce_tenant_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get current tenant count for this user, excluding soft-deleted
  SELECT COUNT(*) INTO current_count
  FROM tenants
  WHERE user_id = NEW.user_id
    AND deleted_at IS NULL;

  -- Get the user's vendor limit (tenants share the same limit as vendors)
  max_allowed := get_user_vendor_limit(NEW.user_id);

  -- Check if adding this tenant would exceed the limit
  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Tenant limit reached. Your plan allows % tenants. Please upgrade to add more.', max_allowed;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
