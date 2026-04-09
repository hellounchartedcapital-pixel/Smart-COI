'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { checkActivePlan } from '@/lib/require-active-plan';
import {
  calculateCompliance,
  type CoverageInput,
  type EntityInput,
  type RequirementInput,
  type PropertyEntityInput,
} from '@/lib/compliance/calculate';
import type { LimitType, EntityType } from '@/types';
import { cleanExtractedEntityName } from '@/lib/utils';

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
// Save edited extraction data
// ============================================================================

export interface SavedCoverage {
  id?: string; // existing row id (omit for new rows)
  coverage_type: string; // freetext coverage name
  carrier_name: string | null;
  policy_number: string | null;
  limit_amount: number | null;
  limit_type: LimitType | null;
  effective_date: string | null;
  expiration_date: string | null;
  additional_insured_listed: boolean;
  waiver_of_subrogation: boolean;
  confidence_flag: boolean;
  raw_extracted_text: string | null;
  additional_insured_entities: string[];
}

export interface SavedEntity {
  id?: string;
  entity_name: string;
  entity_address: string | null;
  entity_type: EntityType;
  confidence_flag: boolean;
}

export async function saveExtractionEdits(
  certificateId: string,
  coverages: SavedCoverage[],
  entities: SavedEntity[]
) {
  const planCheck = await checkActivePlan('Subscribe to upload certificates.');
  if ('error' in planCheck) return { error: planCheck.error };
  const { supabase, orgId } = await getAuthContext();

  // Verify certificate belongs to this org
  const { data: cert, error: certErr } = await supabase
    .from('certificates')
    .select('id, organization_id')
    .eq('id', certificateId)
    .single();
  if (certErr || !cert || cert.organization_id !== orgId) {
    throw new Error('Certificate not found');
  }

  // Delete existing extracted data and re-insert (simpler than diffing)
  await supabase.from('extracted_coverages').delete().eq('certificate_id', certificateId);
  await supabase.from('extracted_entities').delete().eq('certificate_id', certificateId);

  // Insert coverages
  if (coverages.length > 0) {
    const rows = coverages.map((c) => ({
      certificate_id: certificateId,
      coverage_type: c.coverage_type,
      carrier_name: c.carrier_name,
      policy_number: c.policy_number,
      limit_amount: c.limit_amount,
      limit_type: c.limit_type,
      effective_date: c.effective_date,
      expiration_date: c.expiration_date,
      additional_insured_listed: c.additional_insured_listed,
      waiver_of_subrogation: c.waiver_of_subrogation,
      confidence_flag: c.confidence_flag,
      raw_extracted_text: c.raw_extracted_text,
      additional_insured_entities: c.additional_insured_entities,
    }));
    const { error } = await supabase.from('extracted_coverages').insert(rows);
    if (error) throw new Error(`Failed to save coverages: ${error.message}`);
  }

  // Insert entities
  if (entities.length > 0) {
    const rows = entities.map((e) => ({
      certificate_id: certificateId,
      entity_name: e.entity_name,
      entity_address: e.entity_address,
      entity_type: e.entity_type,
      confidence_flag: e.confidence_flag,
    }));
    const { error } = await supabase.from('extracted_entities').insert(rows);
    if (error) throw new Error(`Failed to save entities: ${error.message}`);
  }
}

// ============================================================================
// Save edits and re-run compliance (used by the extraction editor UI)
// ============================================================================

export async function saveAndRerunCompliance(
  certificateId: string,
  coverages: SavedCoverage[],
  entities: SavedEntity[]
): Promise<{ entityType: string; entityId: string } | { error: string }> {
  // Save the edits first
  const saveResult = await saveExtractionEdits(certificateId, coverages, entities);
  if (saveResult && 'error' in saveResult) return saveResult;

  const { supabase, orgId } = await getAuthContext();

  // Get entity info for redirect — check entity_id first, then legacy columns
  const { data: cert } = await supabase
    .from('certificates')
    .select('entity_id, vendor_id, tenant_id')
    .eq('id', certificateId)
    .single();

  const entityId = cert?.entity_id ?? cert?.vendor_id ?? cert?.tenant_id;
  if (!entityId) throw new Error('Certificate not assigned to a vendor or tenant');

  // Determine entity type — check entities table first, then infer from legacy columns
  let entityType: string = 'vendor';
  if (cert?.entity_id) {
    const { data: entityData } = await supabase.from('entities').select('entity_type').eq('id', entityId).single();
    entityType = entityData?.entity_type === 'tenant' ? 'tenant' : 'vendor';
  } else {
    entityType = cert?.vendor_id ? 'vendor' : 'tenant';
  }

  // Run compliance
  await runAutoCompliance(certificateId, orgId);

  revalidatePath(`/dashboard/${entityType}s/${entityId}`);
  return { entityType, entityId };
}

// ============================================================================
// Auto-compliance — runs automatically after extraction completes.
// Uses a service-role client so it can be called from API routes.
// ============================================================================

export async function runAutoCompliance(
  certificateId: string,
  orgId: string,
) {
  const { createServiceClient } = await import('@/lib/supabase/service');
  const supabase = createServiceClient();

  // Fetch certificate
  const { data: cert, error: certErr } = await supabase
    .from('certificates')
    .select('*')
    .eq('id', certificateId)
    .single();
  if (certErr || !cert) {
    console.error(`[runAutoCompliance] Certificate not found: ${certificateId}`);
    return;
  }

  // Fetch extracted data
  const { data: savedCoverages } = await supabase
    .from('extracted_coverages')
    .select('*')
    .eq('certificate_id', certificateId);

  const { data: savedEntities } = await supabase
    .from('extracted_entities')
    .select('*')
    .eq('certificate_id', certificateId);

  // Determine entity — prefer entity_id, fall back to legacy vendor_id/tenant_id
  const entityId = cert.entity_id ?? cert.vendor_id ?? cert.tenant_id;
  if (!entityId) return; // Certificate not assigned to an entity yet

  // Query entities table first, fall back to legacy vendors/tenants if not found
  let entity: { template_id: string | null; property_id: string | null; entity_type: string } | null = null;
  const { data: unifiedEntity } = await supabase
    .from('entities')
    .select('template_id, property_id, entity_type')
    .eq('id', entityId)
    .single();

  if (unifiedEntity) {
    entity = unifiedEntity;
    // If unified entity has no template, check legacy table
    if (!entity.template_id) {
      const legacyTable = entity.entity_type === 'tenant' ? 'tenants' : 'vendors';
      const { data: legacyEntity } = await supabase
        .from(legacyTable)
        .select('template_id')
        .eq('id', entityId)
        .single();
      if (legacyEntity?.template_id) {
        entity = { ...entity, template_id: legacyEntity.template_id };
        // Sync template_id to entities table for future lookups
        await supabase.from('entities').update({ template_id: legacyEntity.template_id }).eq('id', entityId);
      }
    }
  } else {
    // Fall back to legacy tables for entities not yet in unified model
    const { data: legacyVendor } = await supabase
      .from('vendors')
      .select('template_id, property_id')
      .eq('id', entityId)
      .single();
    if (legacyVendor) {
      entity = { ...legacyVendor, entity_type: 'vendor' };
    } else {
      const { data: legacyTenant } = await supabase
        .from('tenants')
        .select('template_id, property_id')
        .eq('id', entityId)
        .single();
      if (legacyTenant) {
        entity = { ...legacyTenant, entity_type: 'tenant' };
      }
    }
  }

  let requirements: RequirementInput[] = [];
  if (entity?.template_id) {
    const { data: reqs } = await supabase
      .from('template_coverage_requirements')
      .select('*')
      .eq('template_id', entity.template_id);
    requirements = (reqs ?? []) as RequirementInput[];
  }

  // If no template is assigned, compliance cannot be evaluated — leave entity
  // at 'under_review' status so the dashboard shows it needs attention rather
  // than silently marking it compliant with zero requirements.
  if (!entity?.template_id || requirements.length === 0) {
    await supabase
      .from('entities')
      .update({ compliance_status: 'under_review' })
      .eq('id', entityId);
    await supabase
      .from(entity?.entity_type === 'tenant' ? 'tenants' : 'vendors')
      .update({ compliance_status: 'under_review' })
      .eq('id', entityId)
      .then(() => { /* best-effort legacy sync */ });
    console.log(`[runAutoCompliance] cert=${certificateId} entity=${entityId} — skipped: no template or requirements assigned`);
    return { overallStatus: 'under_review' as const, entityType: entity?.entity_type === 'tenant' ? 'tenant' : 'vendor', entityId };
  }

  let propEntities: PropertyEntityInput[] = [];
  let acceptCertHolderInAI = true; // default
  if (entity?.property_id) {
    const { data: pes } = await supabase
      .from('property_entities')
      .select('*')
      .eq('property_id', entity.property_id);
    propEntities = (pes ?? []) as PropertyEntityInput[];

    const { data: prop } = await supabase
      .from('properties')
      .select('accept_cert_holder_in_additional_insured')
      .eq('id', entity.property_id)
      .single();
    if (prop) {
      acceptCertHolderInAI = prop.accept_cert_holder_in_additional_insured ?? true;
    }
  } else {
    // No property — fall back to organization default entities for entity matching
    const { data: orgDefaults } = await supabase
      .from('organization_default_entities')
      .select('id, entity_name, entity_address, entity_type')
      .eq('organization_id', orgId);
    propEntities = (orgDefaults ?? []) as PropertyEntityInput[];
  }

  // Map to calculation inputs
  const covInputs: CoverageInput[] = (savedCoverages ?? []).map((c) => ({
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

  const entInputs: EntityInput[] = (savedEntities ?? []).map((e) => ({
    id: e.id,
    entity_name: e.entity_name,
    entity_address: e.entity_address,
    entity_type: e.entity_type,
  }));

  // Run compliance
  const result = calculateCompliance(covInputs, entInputs, requirements, propEntities, {
    acceptCertHolderInAdditionalInsured: acceptCertHolderInAI,
    endorsementData: cert.endorsement_data,
  });

  // Save compliance results
  await supabase.from('compliance_results').delete().eq('certificate_id', certificateId);
  if (result.coverageResults.length > 0) {
    await supabase.from('compliance_results').insert(
      result.coverageResults.map((r) => ({
        certificate_id: certificateId,
        coverage_requirement_id: r.coverage_requirement_id,
        extracted_coverage_id: r.extracted_coverage_id,
        status: r.status,
        gap_description: r.gap_description,
      }))
    );
  }

  await supabase.from('entity_compliance_results').delete().eq('certificate_id', certificateId);
  if (result.entityResults.length > 0) {
    await supabase.from('entity_compliance_results').insert(
      result.entityResults.map((r) => ({
        certificate_id: certificateId,
        property_entity_id: r.property_entity_id,
        status: r.status,
        extracted_entity_id: r.extracted_entity_id,
        match_details: r.match_details,
      }))
    );
  }

  // Update entity compliance_status (in entities table + legacy table for backward compat)
  await supabase
    .from('entities')
    .update({ compliance_status: result.overallStatus })
    .eq('id', entityId);

  // Also update legacy table
  const legacyEntityType = entity?.entity_type === 'tenant' ? 'tenant' : 'vendor';
  const legacyTable = legacyEntityType === 'tenant' ? 'tenants' : 'vendors';
  await supabase
    .from(legacyTable)
    .update({ compliance_status: result.overallStatus })
    .eq('id', entityId)
    .then(() => { /* best-effort legacy sync */ });

  // Log activity
  await supabase.from('activity_log').insert({
    organization_id: orgId,
    certificate_id: certificateId,
    entity_id: entityId,
    [legacyEntityType === 'vendor' ? 'vendor_id' : 'tenant_id']: entityId,
    action: 'compliance_checked',
    description: `Compliance auto-calculated: ${result.overallStatus}`,
  });

  console.log(`[runAutoCompliance] cert=${certificateId} entity=${entityId} status=${result.overallStatus}`);
  return { overallStatus: result.overallStatus, entityType: legacyEntityType, entityId };
}

// ============================================================================
// Auto-assign certificate to entity (used by onboarding bulk upload)
// Finds or creates entity, links certificate, triggers compliance.
// ============================================================================

export async function autoAssignCertificateToEntity(input: {
  certificateId: string;
  orgId: string;
  propertyId: string | null;
  insuredName: string;
  entityType: string; // CoveredEntityType
}) {
  const { createServiceClient } = await import('@/lib/supabase/service');
  const supabase = createServiceClient();

  const { certificateId, orgId, propertyId, entityType } = input;
  // Clean address-like suffixes from AI-extracted insured names
  const insuredName = cleanExtractedEntityName(input.insuredName);
  const legacyType = entityType === 'tenant' ? 'tenant' : 'vendor';

  // 1. Look for existing entity match
  let query = supabase
    .from('entities')
    .select('id')
    .eq('organization_id', orgId)
    .eq('entity_type', entityType)
    .ilike('name', insuredName)
    .is('deleted_at', null);
  if (propertyId) {
    query = query.eq('property_id', propertyId);
  } else {
    query = query.is('property_id', null);
  }
  const { data: existing } = await query.maybeSingle();

  let entityId = existing?.id;

  // 2. Create entity if not found — dual-write to entities + legacy table
  if (!entityId) {
    const { data: newEntity, error: entityErr } = await supabase
      .from('entities')
      .insert({
        organization_id: orgId,
        property_id: propertyId,
        name: insuredName,
        entity_type: entityType,
        compliance_status: 'under_review',
      })
      .select('id')
      .single();

    if (entityErr || !newEntity) {
      console.error('[autoAssignCertificateToEntity] Entity creation failed:', entityErr);
      return { error: 'Failed to create entity' };
    }
    entityId = newEntity.id;

    // Dual-write to legacy table with SAME ID
    if (legacyType === 'vendor') {
      await supabase.from('vendors').insert({
        id: entityId,
        organization_id: orgId,
        property_id: propertyId,
        company_name: insuredName,
        compliance_status: 'under_review',
      }).then(() => { /* best-effort */ });
    } else {
      await supabase.from('tenants').insert({
        id: entityId,
        organization_id: orgId,
        property_id: propertyId,
        company_name: insuredName,
        compliance_status: 'under_review',
      }).then(() => { /* best-effort */ });
    }
  }

  // 3. Link certificate to entity — set ALL 3 ID columns
  const updateFields: Record<string, unknown> = {
    entity_id: entityId,
  };
  if (legacyType === 'vendor') {
    updateFields.vendor_id = entityId;
  } else {
    updateFields.tenant_id = entityId;
  }

  const { error: updateErr } = await supabase
    .from('certificates')
    .update(updateFields)
    .eq('id', certificateId);

  if (updateErr) {
    console.error('[autoAssignCertificateToEntity] Certificate update failed:', updateErr);
    return { error: 'Failed to link certificate' };
  }

  // 4. Update entity compliance status
  await supabase.from('entities').update({ compliance_status: 'under_review' }).eq('id', entityId);
  await supabase.from(legacyType === 'vendor' ? 'vendors' : 'tenants')
    .update({ compliance_status: 'under_review' }).eq('id', entityId)
    .then(() => { /* best-effort */ });

  // 5. Trigger compliance calculation
  try {
    await runAutoCompliance(certificateId, orgId);
  } catch (err) {
    console.error('[autoAssignCertificateToEntity] Compliance failed:', err);
    // Non-fatal — compliance can be recalculated later
  }

  console.log(`[autoAssignCertificateToEntity] cert=${certificateId} entity=${entityId} type=${entityType}`);
  return { entityId };
}

// ============================================================================
// COI Document Signed URL
// ============================================================================

export async function getCOISignedUrl(
  certificateId: string
): Promise<{ url: string }> {
  const { supabase, orgId } = await getAuthContext();

  const { data: cert } = await supabase
    .from('certificates')
    .select('file_path')
    .eq('id', certificateId)
    .eq('organization_id', orgId)
    .single();

  if (!cert?.file_path) throw new Error('Certificate or file not found');

  // Normalize: strip public URL prefix if file_path was stored as a full URL
  // (portal uploads previously stored the public URL instead of the relative path)
  let storagePath = cert.file_path;
  const publicUrlPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/coi-documents/`;
  if (storagePath.startsWith(publicUrlPrefix)) {
    storagePath = storagePath.slice(publicUrlPrefix.length);
  } else if (storagePath.startsWith('http')) {
    const idx = storagePath.indexOf('/coi-documents/');
    if (idx !== -1) {
      storagePath = storagePath.slice(idx + '/coi-documents/'.length);
    }
  }

  console.log(`[getCOISignedUrl] cert=${certificateId} storagePath="${storagePath}" originalPath="${cert.file_path}"`);

  // Use service role client — service role can sign URLs for all files
  // regardless of upload source (PM or portal)
  const { createServiceClient } = await import('@/lib/supabase/service');
  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient.storage
    .from('coi-documents')
    .createSignedUrl(storagePath, 3600); // 1 hour

  if (error || !data?.signedUrl) {
    console.error(`[getCOISignedUrl] Supabase Storage error for path "${storagePath}":`, error);
    throw new Error('Failed to generate signed URL');
  }

  return { url: data.signedUrl };
}

// ============================================================================
// Recheck Compliance — re-runs compliance check using existing extraction data
// against current template requirements. No AI call, no credit usage.
// ============================================================================

export async function recheckCompliance(
  entityType: 'vendor' | 'tenant',
  entityId: string,
): Promise<{ success: true; status: string } | { error: string }> {
  const { supabase, orgId } = await getAuthContext();

  const tableName = entityType === 'vendor' ? 'vendors' : 'tenants';
  const { data: entity } = await supabase
    .from(tableName)
    .select('id, property_id')
    .eq('id', entityId)
    .single();
  if (!entity) return { error: `${entityType === 'vendor' ? 'Vendor' : 'Tenant'} not found` };

  // Find the latest certificate for this entity
  const certQuery = supabase
    .from('certificates')
    .select('id')
    .eq('organization_id', orgId)
    .order('uploaded_at', { ascending: false })
    .limit(1);

  if (entityType === 'vendor') {
    certQuery.eq('vendor_id', entityId);
  } else {
    certQuery.eq('tenant_id', entityId);
  }

  const { data: certs } = await certQuery;
  if (!certs || certs.length === 0) return { error: 'No certificate found to check compliance against' };

  const result = await runAutoCompliance(certs[0].id, orgId);
  revalidatePath(`/dashboard/${entityType}s/${entityId}`);
  return { success: true, status: result?.overallStatus ?? 'unknown' };
}

// ============================================================================
// Re-extract Certificate — re-runs AI extraction on the latest certificate PDF
// then re-runs compliance. Uses 1 AI extraction credit.
// ============================================================================

export async function reExtractCertificate(
  entityType: 'vendor' | 'tenant',
  entityId: string,
): Promise<{ success: true } | { error: string }> {
  const planCheck = await checkActivePlan('Subscribe to extract certificates.');
  if ('error' in planCheck) return { error: planCheck.error };

  const { supabase, orgId } = await getAuthContext();

  const tableName = entityType === 'vendor' ? 'vendors' : 'tenants';
  const { data: entity } = await supabase
    .from(tableName)
    .select('id')
    .eq('id', entityId)
    .single();
  if (!entity) return { error: `${entityType === 'vendor' ? 'Vendor' : 'Tenant'} not found` };

  // Find the latest certificate with a file
  const certQuery = supabase
    .from('certificates')
    .select('id, file_path')
    .eq('organization_id', orgId)
    .not('file_path', 'is', null)
    .order('uploaded_at', { ascending: false })
    .limit(1);

  if (entityType === 'vendor') {
    certQuery.eq('vendor_id', entityId);
  } else {
    certQuery.eq('tenant_id', entityId);
  }

  const { data: certs } = await certQuery;
  if (!certs || certs.length === 0) return { error: 'No certificate with a PDF found' };

  const certificateId = certs[0].id;

  // Check extraction limit
  const { checkExtractionLimit } = await import('@/lib/plan-limits');
  const limitCheck = await checkExtractionLimit(orgId);
  if (!limitCheck.allowed) return { error: limitCheck.error };

  // Download PDF from storage
  const { createServiceClient } = await import('@/lib/supabase/service');
  const serviceClient = createServiceClient();

  const { data: fileData, error: downloadError } = await serviceClient.storage
    .from('coi-documents')
    .download(certs[0].file_path!);

  if (downloadError || !fileData) {
    return { error: 'Failed to download PDF from storage' };
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const pdfBase64 = buffer.toString('base64');

  // Run AI extraction
  const { extractCOIFromPDF } = await import('@/lib/ai/extraction');
  const result = await extractCOIFromPDF(pdfBase64);

  if (!result.success) {
    return { error: result.userMessage ?? result.error ?? 'Extraction failed' };
  }

  // Clear old extraction data and insert new
  await serviceClient.from('extracted_coverages').delete().eq('certificate_id', certificateId);
  await serviceClient.from('extracted_entities').delete().eq('certificate_id', certificateId);

  if (result.coverages.length > 0) {
    await serviceClient.from('extracted_coverages').insert(
      result.coverages.map((c) => ({
        certificate_id: certificateId,
        coverage_type: c.coverage_type,
        carrier_name: c.carrier_name,
        policy_number: c.policy_number,
        limit_amount: c.limit_amount,
        limit_type: c.limit_type,
        effective_date: c.effective_date,
        expiration_date: c.expiration_date,
        additional_insured_listed: c.additional_insured_listed,
        additional_insured_entities: c.additional_insured_entities,
        waiver_of_subrogation: c.waiver_of_subrogation,
        confidence_flag: c.confidence_flag,
        raw_extracted_text: c.raw_extracted_text,
      })),
    );
  }

  if (result.entities.length > 0) {
    await serviceClient.from('extracted_entities').insert(
      result.entities.map((e) => ({
        certificate_id: certificateId,
        entity_name: e.entity_name,
        entity_address: e.entity_address,
        entity_type: e.entity_type,
        confidence_flag: e.confidence_flag,
      })),
    );
  }

  // Update certificate status and endorsement data
  await serviceClient
    .from('certificates')
    .update({
      processing_status: 'extracted',
      ...(result.insuredName ? { insured_name: result.insuredName } : {}),
      endorsement_data: result.endorsements.length > 0 ? result.endorsements : null,
    })
    .eq('id', certificateId);

  // Re-run compliance
  await runAutoCompliance(certificateId, orgId);

  revalidatePath(`/dashboard/${entityType}s/${entityId}`);
  return { success: true };
}
