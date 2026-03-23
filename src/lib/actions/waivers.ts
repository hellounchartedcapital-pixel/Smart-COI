'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export interface ComplianceWaiver {
  id: string;
  organization_id: string;
  vendor_id: string | null;
  tenant_id: string | null;
  reason: string;
  expires_at: string;
  granted_by: string | null;
  granted_at: string;
  revoked_at: string | null;
  revoked_by: string | null;
  created_at: string;
  // Joined
  granted_by_user?: { full_name: string | null; email: string } | null;
}

// ============================================================================
// Helpers
// ============================================================================

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();
  if (!profile?.organization_id) throw new Error('No organization');

  return { supabase, userId: user.id, orgId: profile.organization_id };
}

// ============================================================================
// Grant a waiver
// ============================================================================

export async function grantWaiver(
  entityType: 'vendor' | 'tenant',
  entityId: string,
  reason: string,
  expiresAt: string
): Promise<{ success: true } | { error: string }> {
  try {
    const { supabase, userId, orgId } = await getAuthContext();

    // Verify entity belongs to org
    const table = entityType === 'vendor' ? 'vendors' : 'tenants';
    const { data: entity } = await supabase
      .from(table)
      .select('id, company_name')
      .eq('id', entityId)
      .eq('organization_id', orgId)
      .single();

    if (!entity) return { error: `${entityType} not found` };

    // Check for existing active waiver
    const col = entityType === 'vendor' ? 'vendor_id' : 'tenant_id';
    const { data: existing } = await supabase
      .from('compliance_waivers')
      .select('id')
      .eq(col, entityId)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .single();

    if (existing) {
      return { error: 'An active waiver already exists for this entity' };
    }

    // Create waiver
    const { error: insertError } = await supabase.from('compliance_waivers').insert({
      organization_id: orgId,
      vendor_id: entityType === 'vendor' ? entityId : null,
      tenant_id: entityType === 'tenant' ? entityId : null,
      reason,
      expires_at: new Date(expiresAt).toISOString(),
      granted_by: userId,
    });

    if (insertError) return { error: insertError.message };

    // Update entity compliance status to 'compliant' (waived)
    // We track the waiver separately but the entity shows as waived in the UI
    // We don't change the compliance_status in the DB since it's computed.
    // Instead, the UI will check for active waivers.

    // Log activity
    await supabase.from('activity_log').insert({
      organization_id: orgId,
      vendor_id: entityType === 'vendor' ? entityId : null,
      tenant_id: entityType === 'tenant' ? entityId : null,
      action: 'status_changed',
      description: `Compliance waiver granted for ${entity.company_name}: ${reason}`,
      performed_by: userId,
    });

    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/${entityType}s/${entityId}`);

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to grant waiver' };
  }
}

// ============================================================================
// Revoke a waiver
// ============================================================================

export async function revokeWaiver(waiverId: string): Promise<{ success: true } | { error: string }> {
  try {
    const { supabase, userId, orgId } = await getAuthContext();

    const { data: waiver } = await supabase
      .from('compliance_waivers')
      .select('id, vendor_id, tenant_id')
      .eq('id', waiverId)
      .eq('organization_id', orgId)
      .single();

    if (!waiver) return { error: 'Waiver not found' };

    const { error } = await supabase
      .from('compliance_waivers')
      .update({ revoked_at: new Date().toISOString(), revoked_by: userId })
      .eq('id', waiverId);

    if (error) return { error: error.message };

    const entityType = waiver.vendor_id ? 'vendor' : 'tenant';
    const entityId = waiver.vendor_id ?? waiver.tenant_id;

    await supabase.from('activity_log').insert({
      organization_id: orgId,
      vendor_id: waiver.vendor_id,
      tenant_id: waiver.tenant_id,
      action: 'status_changed',
      description: 'Compliance waiver revoked',
      performed_by: userId,
    });

    revalidatePath('/dashboard');
    if (entityId) revalidatePath(`/dashboard/${entityType}s/${entityId}`);

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to revoke waiver' };
  }
}

// ============================================================================
// Get active waivers for the org
// ============================================================================

export async function getActiveWaivers(): Promise<ComplianceWaiver[]> {
  const { supabase, orgId } = await getAuthContext();

  const { data } = await supabase
    .from('compliance_waivers')
    .select('*')
    .eq('organization_id', orgId)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  return (data ?? []) as ComplianceWaiver[];
}

// ============================================================================
// Get active waiver for a specific entity
// ============================================================================

export async function getEntityWaiver(
  entityType: 'vendor' | 'tenant',
  entityId: string
): Promise<ComplianceWaiver | null> {
  const { supabase, orgId } = await getAuthContext();

  const col = entityType === 'vendor' ? 'vendor_id' : 'tenant_id';
  const { data } = await supabase
    .from('compliance_waivers')
    .select('*')
    .eq(col, entityId)
    .eq('organization_id', orgId)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return (data as ComplianceWaiver) ?? null;
}

// ============================================================================
// Get waiver history for an entity
// ============================================================================

export async function getEntityWaiverHistory(
  entityType: 'vendor' | 'tenant',
  entityId: string
): Promise<ComplianceWaiver[]> {
  const { supabase, orgId } = await getAuthContext();

  const col = entityType === 'vendor' ? 'vendor_id' : 'tenant_id';
  const { data } = await supabase
    .from('compliance_waivers')
    .select('*')
    .eq(col, entityId)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  return (data ?? []) as ComplianceWaiver[];
}
