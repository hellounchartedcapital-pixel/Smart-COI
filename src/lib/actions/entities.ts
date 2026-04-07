'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { checkVendorTenantLimit } from '@/lib/plan-limits';
import { checkActivePlan } from '@/lib/require-active-plan';
import type { CoveredEntityType, ComplianceStatus } from '@/types';

// ============================================================================
// Auth helper (same pattern as properties.ts)
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
// Types
// ============================================================================

export interface CreateEntityInput {
  property_id: string | null;
  name: string;
  entity_type: CoveredEntityType;
  entity_category?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  unit_suite?: string;
  template_id?: string;
}

export interface UpdateEntityInput {
  name?: string;
  entity_type?: CoveredEntityType;
  entity_category?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  unit_suite?: string;
  template_id?: string | null;
  property_id?: string | null;
}

export interface EntityFilters {
  entity_type?: CoveredEntityType | CoveredEntityType[];
  property_id?: string | null;
  status?: 'active' | 'archived' | 'deleted' | 'all';
  compliance_status?: ComplianceStatus;
}

// ============================================================================
// CRUD Operations
// ============================================================================

/** Create a new entity (replaces createVendor / createTenant) */
export async function createEntity(input: CreateEntityInput) {
  const planCheck = await checkActivePlan('Subscribe to add vendors and tenants.');
  if ('error' in planCheck) return { error: planCheck.error };
  const { supabase, userId, orgId } = await getAuthContext();

  const limitCheck = await checkVendorTenantLimit(orgId);
  if (!limitCheck.allowed) throw new Error(limitCheck.error);

  const { data, error } = await supabase
    .from('entities')
    .insert({
      organization_id: orgId,
      property_id: input.property_id,
      name: input.name,
      entity_type: input.entity_type,
      entity_category: input.entity_category || null,
      contact_name: input.contact_name || null,
      contact_email: input.contact_email || null,
      contact_phone: input.contact_phone || null,
      unit_suite: input.unit_suite || null,
      template_id: input.template_id || null,
      compliance_status: 'pending',
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  await supabase.from('activity_log').insert({
    organization_id: orgId,
    property_id: input.property_id,
    entity_id: data.id,
    action: 'entity_created',
    description: `${input.entity_type} "${input.name}" created`,
    performed_by: userId,
  });

  revalidatePath('/dashboard');
  return { id: data.id };
}

/** Update an existing entity (replaces updateVendor / updateTenant) */
export async function updateEntity(entityId: string, input: UpdateEntityInput) {
  const { supabase, orgId } = await getAuthContext();

  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.entity_type !== undefined) updateData.entity_type = input.entity_type;
  if (input.entity_category !== undefined) updateData.entity_category = input.entity_category || null;
  if (input.contact_name !== undefined) updateData.contact_name = input.contact_name || null;
  if (input.contact_email !== undefined) updateData.contact_email = input.contact_email || null;
  if (input.contact_phone !== undefined) updateData.contact_phone = input.contact_phone || null;
  if (input.unit_suite !== undefined) updateData.unit_suite = input.unit_suite || null;
  if (input.template_id !== undefined) updateData.template_id = input.template_id || null;
  if (input.property_id !== undefined) updateData.property_id = input.property_id;

  if (Object.keys(updateData).length === 0) return { success: true };

  const { error } = await supabase
    .from('entities')
    .update(updateData)
    .eq('id', entityId)
    .eq('organization_id', orgId);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard');
  return { success: true };
}

/** Soft-archive an entity */
export async function archiveEntity(entityId: string) {
  const { supabase, orgId } = await getAuthContext();

  const { error } = await supabase
    .from('entities')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', entityId)
    .eq('organization_id', orgId);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard');
  return { success: true };
}

/** Restore a previously archived entity */
export async function restoreEntity(entityId: string) {
  const { supabase, orgId } = await getAuthContext();

  const { error } = await supabase
    .from('entities')
    .update({ archived_at: null })
    .eq('id', entityId)
    .eq('organization_id', orgId);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard');
  return { success: true };
}

/** Soft-delete an entity */
export async function deleteEntity(entityId: string) {
  const { supabase, orgId } = await getAuthContext();

  const { error } = await supabase
    .from('entities')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', entityId)
    .eq('organization_id', orgId);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard');
  return { success: true };
}

/** Permanently delete an entity */
export async function permanentlyDeleteEntity(entityId: string) {
  const { supabase, orgId } = await getAuthContext();

  const { error } = await supabase
    .from('entities')
    .delete()
    .eq('id', entityId)
    .eq('organization_id', orgId);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard');
  return { success: true };
}

/** Toggle notifications for an entity */
export async function toggleEntityNotifications(entityId: string, paused: boolean) {
  const { supabase, orgId } = await getAuthContext();

  const { error } = await supabase
    .from('entities')
    .update({ notifications_paused: paused })
    .eq('id', entityId)
    .eq('organization_id', orgId);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard');
  return { success: true };
}

// ============================================================================
// Query Operations
// ============================================================================

/** Get entity by ID */
export async function getEntityById(entityId: string) {
  const { supabase, orgId } = await getAuthContext();

  const { data, error } = await supabase
    .from('entities')
    .select('*, property:properties(id, name, property_type), template:requirement_templates(*)')
    .eq('id', entityId)
    .eq('organization_id', orgId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Get entities for an organization with optional filters */
export async function getEntitiesByOrg(filters?: EntityFilters) {
  const { supabase, orgId } = await getAuthContext();

  let query = supabase
    .from('entities')
    .select('*, property:properties(id, name)')
    .eq('organization_id', orgId);

  // Entity type filter
  if (filters?.entity_type) {
    if (Array.isArray(filters.entity_type)) {
      query = query.in('entity_type', filters.entity_type);
    } else {
      query = query.eq('entity_type', filters.entity_type);
    }
  }

  // Property filter
  if (filters?.property_id !== undefined) {
    if (filters.property_id === null) {
      query = query.is('property_id', null);
    } else {
      query = query.eq('property_id', filters.property_id);
    }
  }

  // Status filter (active/archived/deleted)
  const status = filters?.status ?? 'active';
  if (status === 'active') {
    query = query.is('deleted_at', null).is('archived_at', null);
  } else if (status === 'archived') {
    query = query.is('deleted_at', null).not('archived_at', 'is', null);
  } else if (status === 'deleted') {
    query = query.not('deleted_at', 'is', null);
  }
  // 'all' = no filter

  // Compliance status filter
  if (filters?.compliance_status) {
    query = query.eq('compliance_status', filters.compliance_status);
  }

  const { data, error } = await query.order('name');
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ============================================================================
// Bulk Operations
// ============================================================================

/** Archive multiple entities */
export async function bulkArchiveEntities(entityIds: string[]) {
  const { supabase, orgId } = await getAuthContext();

  const { error } = await supabase
    .from('entities')
    .update({ archived_at: new Date().toISOString() })
    .in('id', entityIds)
    .eq('organization_id', orgId);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard');
  return { success: true };
}

/** Delete multiple entities */
export async function bulkDeleteEntities(entityIds: string[]) {
  const { supabase, orgId } = await getAuthContext();

  const { error } = await supabase
    .from('entities')
    .update({ deleted_at: new Date().toISOString() })
    .in('id', entityIds)
    .eq('organization_id', orgId);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard');
  return { success: true };
}

// ============================================================================
// Template & Compliance
// ============================================================================

/** Assign a template to an entity and optionally run compliance */
export async function assignTemplateToEntity(
  entityId: string,
  templateId: string | null,
) {
  const { supabase, orgId } = await getAuthContext();

  const { error } = await supabase
    .from('entities')
    .update({ template_id: templateId })
    .eq('id', entityId)
    .eq('organization_id', orgId);

  if (error) throw new Error(error.message);

  revalidatePath('/dashboard');
  return { success: true };
}
