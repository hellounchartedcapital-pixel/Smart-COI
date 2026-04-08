'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { checkVendorTenantLimit, getRemainingExtractions } from '@/lib/plan-limits';
import { checkActivePlan } from '@/lib/require-active-plan';
import {
  calculateCompliance,
  type CoverageInput,
  type EntityInput,
  type RequirementInput,
  type PropertyEntityInput,
} from '@/lib/compliance/calculate';
import type { PropertyType, EntityType } from '@/types';

// ---------------------------------------------------------------------------
// Bulk upload helpers
// ---------------------------------------------------------------------------

export async function getBulkUploadCapacity() {
  const { orgId } = await getAuthContext();

  const extractionCapacity = await getRemainingExtractions(orgId);
  const entityCapacity = await checkVendorTenantLimit(orgId);

  return {
    extractionsRemaining: extractionCapacity.remaining,
    extractionsLimit: extractionCapacity.limit,
    extractionsUsed: extractionCapacity.used,
    canAddEntities: entityCapacity.allowed,
    entityError: entityCapacity.allowed ? null : entityCapacity.error,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Property CRUD
// ---------------------------------------------------------------------------

export interface CreatePropertyInput {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  property_type: PropertyType;
  accept_cert_holder_in_additional_insured?: boolean;
  entities: {
    entity_name: string;
    entity_address?: string;
    entity_type: EntityType;
  }[];
}

export async function createProperty(input: CreatePropertyInput) {
  const planCheck = await checkActivePlan('Subscribe to add properties.');
  if ('error' in planCheck) return { error: planCheck.error };
  const { supabase, userId, orgId } = await getAuthContext();

  const { data: property, error: propError } = await supabase
    .from('properties')
    .insert({
      organization_id: orgId,
      name: input.name,
      address: input.address || null,
      city: input.city || null,
      state: input.state || null,
      zip: input.zip || null,
      property_type: input.property_type,
      accept_cert_holder_in_additional_insured: input.accept_cert_holder_in_additional_insured ?? true,
    })
    .select('id')
    .single();

  if (propError) throw new Error(propError.message);

  if (input.entities.length > 0) {
    const entityRows = input.entities
      .filter((e) => e.entity_name.trim())
      .map((e) => ({
        property_id: property.id,
        entity_name: e.entity_name,
        entity_address: e.entity_address || null,
        entity_type: e.entity_type,
      }));

    if (entityRows.length > 0) {
      const { error: entError } = await supabase
        .from('property_entities')
        .insert(entityRows);
      if (entError) throw new Error(entError.message);
    }
  }

  await supabase.from('activity_log').insert({
    organization_id: orgId,
    property_id: property.id,
    action: 'status_changed',
    description: `Property "${input.name}" created`,
    performed_by: userId,
  });

  revalidatePath('/dashboard/properties');
  return { id: property.id };
}

export async function updateProperty(
  propertyId: string,
  input: CreatePropertyInput
) {
  const { supabase, userId, orgId } = await getAuthContext();

  const updateData: Record<string, unknown> = {
    name: input.name,
    address: input.address || null,
    city: input.city || null,
    state: input.state || null,
    zip: input.zip || null,
    property_type: input.property_type,
  };
  if (input.accept_cert_holder_in_additional_insured !== undefined) {
    updateData.accept_cert_holder_in_additional_insured = input.accept_cert_holder_in_additional_insured;
  }

  const { error: propError } = await supabase
    .from('properties')
    .update(updateData)
    .eq('id', propertyId)
    .eq('organization_id', orgId);

  if (propError) throw new Error(propError.message);

  // Replace entities: delete existing, insert new.
  // The property update above verified org ownership via .eq('organization_id', orgId),
  // so the entity delete is safe — the property_id is confirmed to belong to this org.
  await supabase
    .from('property_entities')
    .delete()
    .eq('property_id', propertyId);

  if (input.entities.length > 0) {
    const entityRows = input.entities
      .filter((e) => e.entity_name.trim())
      .map((e) => ({
        property_id: propertyId,
        entity_name: e.entity_name,
        entity_address: e.entity_address || null,
        entity_type: e.entity_type,
      }));

    if (entityRows.length > 0) {
      await supabase.from('property_entities').insert(entityRows);
    }
  }

  await supabase.from('activity_log').insert({
    organization_id: orgId,
    property_id: propertyId,
    action: 'status_changed',
    description: `Property "${input.name}" updated`,
    performed_by: userId,
  });

  revalidatePath('/dashboard/properties');
  revalidatePath(`/dashboard/properties/${propertyId}`);
  return { id: propertyId };
}

export async function deleteProperty(propertyId: string) {
  const { supabase, userId, orgId } = await getAuthContext();

  // Check for active vendors / tenants
  const { count: vendorCount } = await supabase
    .from('vendors')
    .select('id', { count: 'exact', head: true })
    .eq('property_id', propertyId)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .is('archived_at', null);

  const { count: tenantCount } = await supabase
    .from('tenants')
    .select('id', { count: 'exact', head: true })
    .eq('property_id', propertyId)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .is('archived_at', null);

  if ((vendorCount ?? 0) > 0 || (tenantCount ?? 0) > 0) {
    throw new Error(
      'Cannot delete a property with active vendors or tenants. Remove them first.'
    );
  }

  // Verify property belongs to this org before deleting (defense in depth beyond RLS)
  const { data: prop } = await supabase
    .from('properties')
    .select('name')
    .eq('id', propertyId)
    .eq('organization_id', orgId)
    .single();

  if (!prop) throw new Error('Property not found');

  // Delete entities first (safe — property ownership verified above), then the property
  await supabase.from('property_entities').delete().eq('property_id', propertyId);

  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', propertyId)
    .eq('organization_id', orgId);

  if (error) throw new Error(error.message);

  await supabase.from('activity_log').insert({
    organization_id: orgId,
    action: 'status_changed',
    description: `Property "${prop?.name ?? propertyId}" deleted`,
    performed_by: userId,
  });

  revalidatePath('/dashboard/properties');
  return { success: true };
}

// ---------------------------------------------------------------------------
// Vendor CRUD
// ---------------------------------------------------------------------------

export interface CreateVendorInput {
  property_id: string | null;
  company_name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  vendor_type?: string;
  template_id?: string;
}

export async function createVendor(input: CreateVendorInput) {
  const planCheck = await checkActivePlan('Subscribe to add vendors and tenants.');
  if ('error' in planCheck) return { error: planCheck.error };
  const { supabase, userId, orgId } = await getAuthContext();

  // Enforce plan limits
  const limitCheck = await checkVendorTenantLimit(orgId);
  if (!limitCheck.allowed) throw new Error(limitCheck.error);

  const { data, error } = await supabase
    .from('vendors')
    .insert({
      organization_id: orgId,
      property_id: input.property_id,
      company_name: input.company_name,
      contact_name: input.contact_name || null,
      contact_email: input.contact_email || null,
      contact_phone: input.contact_phone || null,
      vendor_type: input.vendor_type || null,
      template_id: input.template_id || null,
      compliance_status: 'pending',
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  await supabase.from('activity_log').insert({
    organization_id: orgId,
    property_id: input.property_id,
    vendor_id: data.id,
    action: 'vendor_created',
    description: `Vendor "${input.company_name}" added`,
    performed_by: userId,
  });

  revalidatePath(`/dashboard/properties/${input.property_id}`);
  return { id: data.id };
}

export async function softDeleteVendor(vendorId: string, propertyId: string) {
  return archiveVendor(vendorId, propertyId);
}

export async function permanentlyDeleteVendor(vendorId: string, propertyId: string) {
  const { supabase, userId, orgId } = await getAuthContext();

  const { data: vendor } = await supabase
    .from('vendors')
    .select('company_name')
    .eq('id', vendorId)
    .single();

  // Delete in both legacy and entities tables
  await supabase
    .from('vendors')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', vendorId)
    .eq('organization_id', orgId);
  await supabase
    .from('entities')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', vendorId)
    .eq('organization_id', orgId);

  // Get name for activity log (may come from either table)
  let name = vendor?.company_name;
  if (!name) {
    const { data: entity } = await supabase
      .from('entities')
      .select('name')
      .eq('id', vendorId)
      .single();
    name = entity?.name ?? vendorId;
  }

  await supabase.from('activity_log').insert({
    organization_id: orgId,
    property_id: propertyId,
    vendor_id: vendorId,
    entity_id: vendorId,
    action: 'status_changed',
    description: `Vendor "${name}" deleted`,
    performed_by: userId,
  });

  revalidatePath(`/dashboard/properties/${propertyId}`);
  revalidatePath(`/dashboard/vendors/${vendorId}`);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function archiveVendor(vendorId: string, propertyId: string) {
  const { supabase, userId, orgId } = await getAuthContext();

  const { data: vendor } = await supabase
    .from('vendors')
    .select('company_name')
    .eq('id', vendorId)
    .single();

  // Archive in both legacy and entities tables
  const now = new Date().toISOString();
  await supabase
    .from('vendors')
    .update({ archived_at: now })
    .eq('id', vendorId)
    .eq('organization_id', orgId);
  await supabase
    .from('entities')
    .update({ archived_at: now })
    .eq('id', vendorId)
    .eq('organization_id', orgId);

  let name = vendor?.company_name;
  if (!name) {
    const { data: entity } = await supabase
      .from('entities')
      .select('name')
      .eq('id', vendorId)
      .single();
    name = entity?.name ?? vendorId;
  }

  await supabase.from('activity_log').insert({
    organization_id: orgId,
    property_id: propertyId,
    vendor_id: vendorId,
    entity_id: vendorId,
    action: 'status_changed',
    description: `Vendor "${name}" archived`,
    performed_by: userId,
  });

  revalidatePath(`/dashboard/properties/${propertyId}`);
  revalidatePath(`/dashboard/vendors/${vendorId}`);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function restoreVendor(vendorId: string, propertyId: string) {
  const { supabase, userId, orgId } = await getAuthContext();

  const { data: vendor } = await supabase
    .from('vendors')
    .select('company_name')
    .eq('id', vendorId)
    .single();

  // Restore in both legacy and entities tables
  await supabase
    .from('vendors')
    .update({ archived_at: null })
    .eq('id', vendorId)
    .eq('organization_id', orgId);
  await supabase
    .from('entities')
    .update({ archived_at: null })
    .eq('id', vendorId)
    .eq('organization_id', orgId);

  let name = vendor?.company_name;
  if (!name) {
    const { data: entity } = await supabase
      .from('entities')
      .select('name')
      .eq('id', vendorId)
      .single();
    name = entity?.name ?? vendorId;
  }

  await supabase.from('activity_log').insert({
    organization_id: orgId,
    property_id: propertyId,
    vendor_id: vendorId,
    entity_id: vendorId,
    action: 'status_changed',
    description: `Vendor "${name}" restored`,
    performed_by: userId,
  });

  revalidatePath(`/dashboard/properties/${propertyId}`);
  revalidatePath(`/dashboard/vendors/${vendorId}`);
  revalidatePath('/dashboard');
  return { success: true };
}

// ---------------------------------------------------------------------------
// Tenant CRUD
// ---------------------------------------------------------------------------

export interface CreateTenantInput {
  property_id: string | null;
  company_name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  unit_suite?: string;
  tenant_type?: string;
  template_id?: string;
}

export async function createTenant(input: CreateTenantInput) {
  const planCheck = await checkActivePlan('Subscribe to add vendors and tenants.');
  if ('error' in planCheck) return { error: planCheck.error };
  const { supabase, userId, orgId } = await getAuthContext();

  // Enforce plan limits
  const limitCheck = await checkVendorTenantLimit(orgId);
  if (!limitCheck.allowed) throw new Error(limitCheck.error);

  const { data, error } = await supabase
    .from('tenants')
    .insert({
      organization_id: orgId,
      property_id: input.property_id,
      company_name: input.company_name,
      contact_name: input.contact_name || null,
      contact_email: input.contact_email || null,
      contact_phone: input.contact_phone || null,
      unit_suite: input.unit_suite || null,
      tenant_type: input.tenant_type || null,
      template_id: input.template_id || null,
      compliance_status: 'pending',
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  await supabase.from('activity_log').insert({
    organization_id: orgId,
    property_id: input.property_id,
    tenant_id: data.id,
    action: 'tenant_created',
    description: `Tenant "${input.company_name}" added`,
    performed_by: userId,
  });

  revalidatePath(`/dashboard/properties/${input.property_id}`);
  return { id: data.id };
}

export async function softDeleteTenant(tenantId: string, propertyId: string) {
  return archiveTenant(tenantId, propertyId);
}

export async function permanentlyDeleteTenant(tenantId: string, propertyId: string) {
  const { supabase, userId, orgId } = await getAuthContext();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('company_name')
    .eq('id', tenantId)
    .single();

  // Delete in both legacy and entities tables
  await supabase
    .from('tenants')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', tenantId)
    .eq('organization_id', orgId);
  await supabase
    .from('entities')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', tenantId)
    .eq('organization_id', orgId);

  let name = tenant?.company_name;
  if (!name) {
    const { data: entity } = await supabase
      .from('entities')
      .select('name')
      .eq('id', tenantId)
      .single();
    name = entity?.name ?? tenantId;
  }

  await supabase.from('activity_log').insert({
    organization_id: orgId,
    property_id: propertyId,
    tenant_id: tenantId,
    entity_id: tenantId,
    action: 'status_changed',
    description: `Tenant "${name}" deleted`,
    performed_by: userId,
  });

  revalidatePath(`/dashboard/properties/${propertyId}`);
  revalidatePath(`/dashboard/tenants/${tenantId}`);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function archiveTenant(tenantId: string, propertyId: string) {
  const { supabase, userId, orgId } = await getAuthContext();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('company_name')
    .eq('id', tenantId)
    .single();

  // Archive in both legacy and entities tables
  const now = new Date().toISOString();
  await supabase
    .from('tenants')
    .update({ archived_at: now })
    .eq('id', tenantId)
    .eq('organization_id', orgId);
  await supabase
    .from('entities')
    .update({ archived_at: now })
    .eq('id', tenantId)
    .eq('organization_id', orgId);

  let name = tenant?.company_name;
  if (!name) {
    const { data: entity } = await supabase
      .from('entities')
      .select('name')
      .eq('id', tenantId)
      .single();
    name = entity?.name ?? tenantId;
  }

  await supabase.from('activity_log').insert({
    organization_id: orgId,
    property_id: propertyId,
    tenant_id: tenantId,
    entity_id: tenantId,
    action: 'status_changed',
    description: `Tenant "${name}" archived`,
    performed_by: userId,
  });

  revalidatePath(`/dashboard/properties/${propertyId}`);
  revalidatePath(`/dashboard/tenants/${tenantId}`);
  revalidatePath('/dashboard');
  return { success: true };
}

export async function restoreTenant(tenantId: string, propertyId: string) {
  const { supabase, userId, orgId } = await getAuthContext();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('company_name')
    .eq('id', tenantId)
    .single();

  // Restore in both legacy and entities tables
  await supabase
    .from('tenants')
    .update({ archived_at: null })
    .eq('id', tenantId)
    .eq('organization_id', orgId);
  await supabase
    .from('entities')
    .update({ archived_at: null })
    .eq('id', tenantId)
    .eq('organization_id', orgId);

  let name = tenant?.company_name;
  if (!name) {
    const { data: entity } = await supabase
      .from('entities')
      .select('name')
      .eq('id', tenantId)
      .single();
    name = entity?.name ?? tenantId;
  }

  await supabase.from('activity_log').insert({
    organization_id: orgId,
    property_id: propertyId,
    tenant_id: tenantId,
    entity_id: tenantId,
    action: 'status_changed',
    description: `Tenant "${name}" restored`,
    performed_by: userId,
  });

  revalidatePath(`/dashboard/properties/${propertyId}`);
  revalidatePath(`/dashboard/tenants/${tenantId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Bulk vendor/tenant operations
// ---------------------------------------------------------------------------

export async function bulkArchiveVendors(vendorIds: string[], propertyId: string) {
  const { supabase, userId, orgId } = await getAuthContext();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('vendors')
    .update({ archived_at: now })
    .in('id', vendorIds)
    .eq('organization_id', orgId);

  if (error) throw new Error(error.message);

  await supabase.from('activity_log').insert({
    organization_id: orgId,
    property_id: propertyId,
    action: 'status_changed',
    description: `${vendorIds.length} vendor(s) archived`,
    performed_by: userId,
  });

  revalidatePath(`/dashboard/properties/${propertyId}`);
  return { success: true };
}

export async function bulkDeleteVendors(vendorIds: string[], propertyId: string) {
  const { supabase, userId, orgId } = await getAuthContext();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('vendors')
    .update({ deleted_at: now })
    .in('id', vendorIds)
    .eq('organization_id', orgId);

  if (error) throw new Error(error.message);

  await supabase.from('activity_log').insert({
    organization_id: orgId,
    property_id: propertyId,
    action: 'status_changed',
    description: `${vendorIds.length} vendor(s) deleted`,
    performed_by: userId,
  });

  revalidatePath(`/dashboard/properties/${propertyId}`);
  return { success: true };
}

export async function bulkArchiveTenants(tenantIds: string[], propertyId: string) {
  const { supabase, userId, orgId } = await getAuthContext();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('tenants')
    .update({ archived_at: now })
    .in('id', tenantIds)
    .eq('organization_id', orgId);

  if (error) throw new Error(error.message);

  await supabase.from('activity_log').insert({
    organization_id: orgId,
    property_id: propertyId,
    action: 'status_changed',
    description: `${tenantIds.length} tenant(s) archived`,
    performed_by: userId,
  });

  revalidatePath(`/dashboard/properties/${propertyId}`);
  return { success: true };
}

export async function bulkDeleteTenants(tenantIds: string[], propertyId: string) {
  const { supabase, userId, orgId } = await getAuthContext();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('tenants')
    .update({ deleted_at: now })
    .in('id', tenantIds)
    .eq('organization_id', orgId);

  if (error) throw new Error(error.message);

  await supabase.from('activity_log').insert({
    organization_id: orgId,
    property_id: propertyId,
    action: 'status_changed',
    description: `${tenantIds.length} tenant(s) deleted`,
    performed_by: userId,
  });

  revalidatePath(`/dashboard/properties/${propertyId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Vendor update (edit + notifications toggle)
// ---------------------------------------------------------------------------

export interface UpdateVendorInput {
  company_name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  vendor_type?: string;
  template_id?: string;
}

export async function updateVendor(vendorId: string, input: UpdateVendorInput) {
  const { supabase, userId, orgId } = await getAuthContext();

  const { error } = await supabase
    .from('vendors')
    .update({
      company_name: input.company_name,
      contact_name: input.contact_name || null,
      contact_email: input.contact_email || null,
      contact_phone: input.contact_phone || null,
      vendor_type: input.vendor_type || null,
      template_id: input.template_id || null,
    })
    .eq('id', vendorId)
    .eq('organization_id', orgId);

  if (error) throw new Error(error.message);

  await supabase.from('activity_log').insert({
    organization_id: orgId,
    vendor_id: vendorId,
    action: 'status_changed',
    description: `Vendor "${input.company_name}" updated`,
    performed_by: userId,
  });

  // Sync template_id to unified entities table
  if (input.template_id) {
    await supabase
      .from('entities')
      .update({ template_id: input.template_id })
      .eq('id', vendorId)
      .then(() => { /* best-effort sync */ });
  }

  // Recalculate compliance when template is changed
  if (input.template_id) {
    try {
      await runComplianceForEntity(vendorId, 'vendor');
    } catch (err) {
      console.error(`[updateVendor] Compliance recalculation failed:`, err);
    }
  }

  revalidatePath(`/dashboard/vendors/${vendorId}`);
  return { success: true };
}

export async function toggleVendorNotifications(vendorId: string, paused: boolean) {
  const { supabase, userId, orgId } = await getAuthContext();

  const { error } = await supabase
    .from('vendors')
    .update({ notifications_paused: paused })
    .eq('id', vendorId)
    .eq('organization_id', orgId);

  if (error) throw new Error(error.message);

  await supabase.from('activity_log').insert({
    organization_id: orgId,
    vendor_id: vendorId,
    action: 'status_changed',
    description: `Vendor notifications ${paused ? 'paused' : 'resumed'}`,
    performed_by: userId,
  });

  revalidatePath(`/dashboard/vendors/${vendorId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Tenant update (edit + notifications toggle)
// ---------------------------------------------------------------------------

export interface UpdateTenantInput {
  company_name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  unit_suite?: string;
  tenant_type?: string;
  template_id?: string;
}

export async function updateTenant(tenantId: string, input: UpdateTenantInput) {
  const { supabase, userId, orgId } = await getAuthContext();

  const { error } = await supabase
    .from('tenants')
    .update({
      company_name: input.company_name,
      contact_name: input.contact_name || null,
      contact_email: input.contact_email || null,
      contact_phone: input.contact_phone || null,
      unit_suite: input.unit_suite || null,
      tenant_type: input.tenant_type || null,
      template_id: input.template_id || null,
    })
    .eq('id', tenantId)
    .eq('organization_id', orgId);

  if (error) throw new Error(error.message);

  await supabase.from('activity_log').insert({
    organization_id: orgId,
    tenant_id: tenantId,
    action: 'status_changed',
    description: `Tenant "${input.company_name}" updated`,
    performed_by: userId,
  });

  // Sync template_id to unified entities table
  if (input.template_id) {
    await supabase
      .from('entities')
      .update({ template_id: input.template_id })
      .eq('id', tenantId)
      .then(() => { /* best-effort sync */ });
  }

  // Recalculate compliance when template is changed
  if (input.template_id) {
    try {
      await runComplianceForEntity(tenantId, 'tenant');
    } catch (err) {
      console.error(`[updateTenant] Compliance recalculation failed:`, err);
    }
  }

  revalidatePath(`/dashboard/tenants/${tenantId}`);
  return { success: true };
}

export async function toggleTenantNotifications(tenantId: string, paused: boolean) {
  const { supabase, userId, orgId } = await getAuthContext();

  const { error } = await supabase
    .from('tenants')
    .update({ notifications_paused: paused })
    .eq('id', tenantId)
    .eq('organization_id', orgId);

  if (error) throw new Error(error.message);

  await supabase.from('activity_log').insert({
    organization_id: orgId,
    tenant_id: tenantId,
    action: 'status_changed',
    description: `Tenant notifications ${paused ? 'paused' : 'resumed'}`,
    performed_by: userId,
  });

  revalidatePath(`/dashboard/tenants/${tenantId}`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Assign template to entity (lightweight — for nudge and wizard flows)
// ---------------------------------------------------------------------------

export async function assignTemplateToEntity(
  entityId: string,
  entityType: 'vendor' | 'tenant',
  templateId: string
) {
  const { supabase, userId, orgId } = await getAuthContext();

  const tableName = entityType === 'vendor' ? 'vendors' : 'tenants';
  const { error } = await supabase
    .from(tableName)
    .update({ template_id: templateId })
    .eq('id', entityId)
    .eq('organization_id', orgId);

  if (error) throw new Error(error.message);

  await supabase.from('activity_log').insert({
    organization_id: orgId,
    [entityType === 'vendor' ? 'vendor_id' : 'tenant_id']: entityId,
    action: 'status_changed',
    description: `Requirements template assigned`,
    performed_by: userId,
  });

  // Recalculate compliance with new template
  try {
    await runComplianceForEntity(entityId, entityType);
  } catch (err) {
    console.error(`[assignTemplateToEntity] Compliance recalculation failed:`, err);
  }

  revalidatePath(`/dashboard/${entityType}s/${entityId}`);
  revalidatePath(`/dashboard/certificates`);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Compliance calculation for entities (works with extracted certificates)
// ---------------------------------------------------------------------------

/**
 * Run compliance calculation for an entity against its most recent certificate.
 * Runs compliance for an entity using its most recent extracted certificate.
 * Compliance is calculated automatically — no manual review step needed.
 */
export async function runComplianceForEntity(
  entityId: string,
  entityType: string,
) {
  const { supabase, userId, orgId } = await getAuthContext();

  // Query the entities table (unified model) first, fall back to legacy tables
  const legacyTable = entityType === 'tenant' ? 'tenants' : 'vendors';
  let entity: { template_id: string | null; property_id: string | null } | null = null;

  const { data: unifiedEntity } = await supabase
    .from('entities')
    .select('template_id, property_id')
    .eq('id', entityId)
    .eq('organization_id', orgId)
    .single();

  if (unifiedEntity) {
    entity = unifiedEntity;
    // If unified entity has no template, check legacy table (template may have been
    // assigned via updateVendor/updateTenant which only writes to legacy tables)
    if (!entity.template_id) {
      const { data: legacyEntity } = await supabase
        .from(legacyTable)
        .select('template_id')
        .eq('id', entityId)
        .eq('organization_id', orgId)
        .single();
      if (legacyEntity?.template_id) {
        entity = { ...entity, template_id: legacyEntity.template_id };
        // Sync template_id to entities table so future lookups work directly
        await supabase
          .from('entities')
          .update({ template_id: legacyEntity.template_id })
          .eq('id', entityId);
      }
    }
  } else {
    // Fall back to legacy table for older entities not yet in unified model
    const { data: legacyEntity } = await supabase
      .from(legacyTable)
      .select('template_id, property_id')
      .eq('id', entityId)
      .eq('organization_id', orgId)
      .single();
    entity = legacyEntity;
  }

  if (!entity?.template_id) {
    // No template assigned — can't calculate compliance, set under_review if cert exists
    const { data: anyCert } = await supabase
      .from('certificates')
      .select('id')
      .or(`entity_id.eq.${entityId},vendor_id.eq.${entityId},tenant_id.eq.${entityId}`)
      .eq('organization_id', orgId)
      .in('processing_status', ['extracted', 'review_confirmed'])
      .limit(1)
      .maybeSingle();

    if (anyCert) {
      // Update both entities table and legacy table
      await supabase
        .from('entities')
        .update({ compliance_status: 'under_review' })
        .eq('id', entityId);
      await supabase
        .from(legacyTable)
        .update({ compliance_status: 'under_review' })
        .eq('id', entityId);
    }
    return;
  }

  // Find most recent certificate — check entity_id first, then legacy vendor_id/tenant_id
  let cert: { id: string } | null = null;

  const { data: confirmedCert } = await supabase
    .from('certificates')
    .select('id')
    .or(`entity_id.eq.${entityId},vendor_id.eq.${entityId},tenant_id.eq.${entityId}`)
    .eq('organization_id', orgId)
    .in('processing_status', ['extracted', 'review_confirmed'])
    .order('uploaded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (confirmedCert) {
    cert = confirmedCert;
  } else {
    // Fall back to extracted
    const { data: extractedCert } = await supabase
      .from('certificates')
      .select('id')
      .or(`entity_id.eq.${entityId},vendor_id.eq.${entityId},tenant_id.eq.${entityId}`)
      .eq('organization_id', orgId)
      .eq('processing_status', 'extracted')
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    cert = extractedCert;
  }

  if (!cert) {
    // No certificate at all — leave as pending
    return;
  }

  // Fetch extracted coverages + entities
  const [covRes, entRes] = await Promise.all([
    supabase.from('extracted_coverages').select('*').eq('certificate_id', cert.id),
    supabase.from('extracted_entities').select('*').eq('certificate_id', cert.id),
  ]);

  // Fetch template requirements
  const { data: reqs } = await supabase
    .from('template_coverage_requirements')
    .select('*')
    .eq('template_id', entity.template_id);

  const requirements = (reqs ?? []) as RequirementInput[];

  // Fetch property entities and property setting
  let propertyEntities: PropertyEntityInput[] = [];
  let acceptCertHolderInAI = true; // default
  if (entity.property_id) {
    const { data: pes } = await supabase
      .from('property_entities')
      .select('*')
      .eq('property_id', entity.property_id);
    propertyEntities = (pes ?? []) as PropertyEntityInput[];

    const { data: prop } = await supabase
      .from('properties')
      .select('accept_cert_holder_in_additional_insured')
      .eq('id', entity.property_id)
      .single();
    if (prop) {
      acceptCertHolderInAI = prop.accept_cert_holder_in_additional_insured ?? true;
    }
  }

  // Map to inputs
  const covInputs: CoverageInput[] = (covRes.data ?? []).map((c) => ({
    id: c.id,
    coverage_type: c.coverage_type,
    carrier_name: c.carrier_name,
    policy_number: c.policy_number,
    limit_amount: c.limit_amount,
    limit_type: c.limit_type,
    effective_date: c.effective_date,
    expiration_date: c.expiration_date,
    additional_insured_listed: c.additional_insured_listed,
    waiver_of_subrogation: c.waiver_of_subrogation,
  }));

  const entInputs: EntityInput[] = (entRes.data ?? []).map((e) => ({
    id: e.id,
    entity_name: e.entity_name,
    entity_address: e.entity_address,
    entity_type: e.entity_type,
  }));

  // Get expiration threshold
  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', orgId)
    .single();
  const thresholdDays = org?.settings?.expiration_warning_threshold_days ?? 30;

  // Run compliance
  const result = calculateCompliance(
    covInputs,
    entInputs,
    requirements,
    propertyEntities,
    {
      expirationThresholdDays: thresholdDays,
      acceptCertHolderInAdditionalInsured: acceptCertHolderInAI,
    },
  );

  // Clear old compliance results for this certificate
  await supabase.from('compliance_results').delete().eq('certificate_id', cert.id);
  await supabase.from('entity_compliance_results').delete().eq('certificate_id', cert.id);

  // Insert coverage compliance results
  if (result.coverageResults.length > 0) {
    const rows = result.coverageResults.map((r) => ({
      certificate_id: cert!.id,
      coverage_requirement_id: r.coverage_requirement_id,
      extracted_coverage_id: r.extracted_coverage_id,
      status: r.status,
      gap_description: r.gap_description,
    }));
    await supabase.from('compliance_results').insert(rows);
  }

  // Insert entity compliance results
  if (result.entityResults.length > 0) {
    const rows = result.entityResults.map((r) => ({
      certificate_id: cert!.id,
      property_entity_id: r.property_entity_id,
      extracted_entity_id: r.extracted_entity_id,
      status: r.status,
      match_details: r.match_details,
    }));
    await supabase.from('entity_compliance_results').insert(rows);
  }

  // Update entity compliance status in both entities table and legacy table
  await supabase
    .from('entities')
    .update({ compliance_status: result.overallStatus })
    .eq('id', entityId);
  await supabase
    .from(legacyTable)
    .update({ compliance_status: result.overallStatus })
    .eq('id', entityId)
    .then(() => { /* best-effort legacy sync */ });

  // Log
  await supabase.from('activity_log').insert({
    organization_id: orgId,
    certificate_id: cert.id,
    entity_id: entityId,
    [entityType === 'vendor' ? 'vendor_id' : 'tenant_id']: entityId,
    action: 'compliance_checked',
    description: `Compliance calculated: ${result.overallStatus}`,
    performed_by: userId,
  });
}

// ---------------------------------------------------------------------------
// Bulk certificate assignment
// ---------------------------------------------------------------------------

/**
 * Assign a certificate to a vendor or tenant. Updates the certificate record
 * and logs the activity. Called from bulk upload Step 4.
 */
export async function assignCertificateToEntity(input: {
  certificateId: string;
  entityId: string;
  entityType: 'vendor' | 'tenant';
  entityName: string;
  fileName: string;
  propertyId: string | null;
}) {
  const { supabase, userId, orgId } = await getAuthContext();

  const updateField =
    input.entityType === 'vendor'
      ? { vendor_id: input.entityId }
      : { tenant_id: input.entityId };

  // Use .select() to verify the update actually matched a row
  const { data: updated, error } = await supabase
    .from('certificates')
    .update(updateField)
    .eq('id', input.certificateId)
    .eq('organization_id', orgId)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!updated) {
    console.error(
      `[assignCertificateToEntity] Certificate not found or not updated: certId=${input.certificateId} orgId=${orgId}`
    );
    throw new Error(
      `Could not link certificate to ${input.entityType}. The certificate may belong to a different organization.`
    );
  }

  // Update entity status to under_review (has COI, not yet confirmed)
  const entityTable = input.entityType === 'vendor' ? 'vendors' : 'tenants';
  await supabase
    .from(entityTable)
    .update({ compliance_status: 'under_review' })
    .eq('id', input.entityId)
    .eq('organization_id', orgId);

  await supabase.from('activity_log').insert({
    organization_id: orgId,
    certificate_id: input.certificateId,
    property_id: input.propertyId,
    [input.entityType === 'vendor' ? 'vendor_id' : 'tenant_id']: input.entityId,
    action: 'coi_uploaded',
    description: `COI "${input.fileName}" assigned to ${input.entityType} "${input.entityName}" via bulk upload`,
    performed_by: userId,
  });

  // Run compliance if the entity has a template assigned
  try {
    await runComplianceForEntity(input.entityId, input.entityType);
  } catch (err) {
    // Non-critical — compliance can be recalculated later
    console.error(`[assignCertificateToEntity] Compliance calculation failed:`, err);
  }

  revalidatePath(`/dashboard/properties/${input.propertyId}`);
  revalidatePath(`/dashboard/${input.entityType}s/${input.entityId}`);
  return { success: true };
}

/**
 * Diagnose and repair orphaned bulk-upload data:
 * 1. Fix vendors/tenants whose company_name contains ".pdf" — replace with
 *    the insured_name from their linked certificate
 * 2. Link orphaned bulk-upload certificates (vendor_id/tenant_id null) to
 *    matching vendors by insured_name
 * 3. Revalidate all property pages
 */
export async function repairBulkUploadData() {
  const { supabase, userId, orgId } = await getAuthContext();

  let vendorNamesFixed = 0;
  let tenantNamesFixed = 0;
  let certsLinked = 0;

  // ---- Fix 1: Vendor/tenant names containing ".pdf" ----

  // Find vendors with .pdf in their name
  const { data: pdfVendors } = await supabase
    .from('vendors')
    .select('id, company_name')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .like('company_name', '%.pdf%');

  for (const v of pdfVendors ?? []) {
    // Find the most recent certificate for this vendor with an insured_name
    const { data: cert } = await supabase
      .from('certificates')
      .select('insured_name')
      .eq('vendor_id', v.id)
      .eq('organization_id', orgId)
      .not('insured_name', 'is', null)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const newName = cert?.insured_name || v.company_name.replace(/\.pdf$/i, '');
    if (newName !== v.company_name) {
      await supabase
        .from('vendors')
        .update({ company_name: newName })
        .eq('id', v.id);
      vendorNamesFixed++;
    }
  }

  // Find tenants with .pdf in their name
  const { data: pdfTenants } = await supabase
    .from('tenants')
    .select('id, company_name')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .like('company_name', '%.pdf%');

  for (const t of pdfTenants ?? []) {
    const { data: cert } = await supabase
      .from('certificates')
      .select('insured_name')
      .eq('tenant_id', t.id)
      .eq('organization_id', orgId)
      .not('insured_name', 'is', null)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const newName = cert?.insured_name || t.company_name.replace(/\.pdf$/i, '');
    if (newName !== t.company_name) {
      await supabase
        .from('tenants')
        .update({ company_name: newName })
        .eq('id', t.id);
      tenantNamesFixed++;
    }
  }

  // ---- Fix 2: Link orphaned bulk certificates to matching vendors ----

  const { data: orphanedCerts } = await supabase
    .from('certificates')
    .select('id, file_path, insured_name, processing_status')
    .eq('organization_id', orgId)
    .like('file_path', 'bulk/%')
    .is('vendor_id', null)
    .is('tenant_id', null)
    .eq('processing_status', 'extracted');

  if ((orphanedCerts ?? []).length > 0) {
    // Load all vendors to try matching by name
    const { data: allVendors } = await supabase
      .from('vendors')
      .select('id, company_name, property_id')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .is('archived_at', null);

    for (const cert of orphanedCerts ?? []) {
      if (!cert.insured_name) continue;

      // Try to find a vendor whose name matches the certificate's insured_name
      const certName = cert.insured_name.toLowerCase().trim();
      const matchedVendor = (allVendors ?? []).find((v) => {
        const vName = v.company_name.toLowerCase().trim();
        // Check: exact match, one contains the other, or stripped-pdf-name match
        return (
          vName === certName ||
          vName.includes(certName) ||
          certName.includes(vName) ||
          vName === certName.replace(/\.pdf$/i, '')
        );
      });

      if (matchedVendor) {
        const { error: updateErr } = await supabase
          .from('certificates')
          .update({ vendor_id: matchedVendor.id })
          .eq('id', cert.id);

        if (!updateErr) {
          certsLinked++;
          await supabase.from('activity_log').insert({
            organization_id: orgId,
            certificate_id: cert.id,
            vendor_id: matchedVendor.id,
            property_id: matchedVendor.property_id,
            action: 'coi_uploaded',
            description: `COI auto-linked to vendor "${matchedVendor.company_name}" via data repair`,
            performed_by: userId,
          });
        }
      }
    }
  }

  // ---- Fix 3: Revalidate all property pages ----

  const { data: properties } = await supabase
    .from('properties')
    .select('id')
    .eq('organization_id', orgId);

  for (const p of properties ?? []) {
    revalidatePath(`/dashboard/properties/${p.id}`);
  }
  revalidatePath('/dashboard/properties');
  revalidatePath('/dashboard');

  return {
    vendorNamesFixed,
    tenantNamesFixed,
    certsLinked,
    orphanedCertificates: (orphanedCerts ?? []).length - certsLinked,
    propertiesRevalidated: (properties ?? []).length,
  };
}
