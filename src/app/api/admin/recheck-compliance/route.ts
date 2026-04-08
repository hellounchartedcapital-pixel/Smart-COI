import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import {
  calculateCompliance,
  type CoverageInput,
  type EntityInput,
  type RequirementInput,
  type PropertyEntityInput,
} from '@/lib/compliance/calculate';

/**
 * POST /api/admin/recheck-compliance
 *
 * One-time admin endpoint to recalculate compliance for all entities stuck in
 * "under_review" or null compliance status. Authenticated via CRON_SECRET.
 *
 * Usage:
 *   curl -X POST https://smartcoi.io/api/admin/recheck-compliance \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */
export async function POST(request: Request) {
  // Auth — same pattern as cron routes
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Find all entities with compliance_status = 'under_review' or null
  const { data: stuckEntities, error: fetchErr } = await supabase
    .from('entities')
    .select('id, organization_id, entity_type, template_id, property_id, compliance_status, name')
    .or('compliance_status.eq.under_review,compliance_status.is.null');

  if (fetchErr) {
    return NextResponse.json({ error: 'Failed to fetch entities', details: fetchErr.message }, { status: 500 });
  }

  if (!stuckEntities || stuckEntities.length === 0) {
    return NextResponse.json({ message: 'No stuck entities found', recalculated: 0, results: {} });
  }

  const results: Record<string, number> = {};
  const details: Array<{ id: string; name: string; org: string; before: string | null; after: string; reason?: string }> = [];
  let recalculated = 0;
  let skippedNoTemplate = 0;
  let skippedNoCert = 0;

  for (const ent of stuckEntities) {
    const entityId = ent.id;
    const orgId = ent.organization_id;
    const entityType = ent.entity_type ?? 'vendor';
    const legacyTable = entityType === 'tenant' ? 'tenants' : 'vendors';

    // Check for template — entities table first, then legacy table
    let templateId = ent.template_id;
    if (!templateId) {
      // Template may have been assigned via updateVendor/updateTenant (legacy tables only)
      const { data: legacyEntity } = await supabase
        .from(legacyTable)
        .select('template_id')
        .eq('id', entityId)
        .maybeSingle();
      if (legacyEntity?.template_id) {
        templateId = legacyEntity.template_id;
        // Sync template_id to entities table for future lookups
        await supabase
          .from('entities')
          .update({ template_id: templateId })
          .eq('id', entityId);
      }
    }

    // Skip if no template found in either table
    if (!templateId) {
      skippedNoTemplate++;
      details.push({
        id: entityId,
        name: ent.name ?? '(unnamed)',
        org: orgId,
        before: ent.compliance_status,
        after: 'skipped',
        reason: 'no template assigned',
      });
      continue;
    }

    // Find most recent certificate
    const { data: cert } = await supabase
      .from('certificates')
      .select('id')
      .or(`entity_id.eq.${entityId},vendor_id.eq.${entityId},tenant_id.eq.${entityId}`)
      .eq('organization_id', orgId)
      .in('processing_status', ['extracted', 'review_confirmed'])
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!cert) {
      skippedNoCert++;
      details.push({
        id: entityId,
        name: ent.name ?? '(unnamed)',
        org: orgId,
        before: ent.compliance_status,
        after: 'skipped',
        reason: 'no extracted certificate',
      });
      continue;
    }

    // Fetch extracted data
    const [covRes, entRes] = await Promise.all([
      supabase.from('extracted_coverages').select('*').eq('certificate_id', cert.id),
      supabase.from('extracted_entities').select('*').eq('certificate_id', cert.id),
    ]);

    // Fetch template requirements
    const { data: reqs } = await supabase
      .from('template_coverage_requirements')
      .select('*')
      .eq('template_id', templateId);

    const requirements = (reqs ?? []) as RequirementInput[];

    // Fetch property entities and property setting
    let propertyEntities: PropertyEntityInput[] = [];
    let acceptCertHolderInAI = true;
    if (ent.property_id) {
      const { data: pes } = await supabase
        .from('property_entities')
        .select('*')
        .eq('property_id', ent.property_id);
      propertyEntities = (pes ?? []) as PropertyEntityInput[];

      const { data: prop } = await supabase
        .from('properties')
        .select('accept_cert_holder_in_additional_insured')
        .eq('id', ent.property_id)
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

    // Get org expiration threshold
    const { data: org } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', orgId)
      .single();
    const thresholdDays = org?.settings?.expiration_warning_threshold_days ?? 30;

    // Run compliance calculation
    const result = calculateCompliance(covInputs, entInputs, requirements, propertyEntities, {
      expirationThresholdDays: thresholdDays,
      acceptCertHolderInAdditionalInsured: acceptCertHolderInAI,
    });

    // Clear old compliance results and insert new ones
    await supabase.from('compliance_results').delete().eq('certificate_id', cert.id);
    await supabase.from('entity_compliance_results').delete().eq('certificate_id', cert.id);

    if (result.coverageResults.length > 0) {
      await supabase.from('compliance_results').insert(
        result.coverageResults.map((r) => ({
          certificate_id: cert.id,
          coverage_requirement_id: r.coverage_requirement_id,
          extracted_coverage_id: r.extracted_coverage_id,
          status: r.status,
          gap_description: r.gap_description,
        }))
      );
    }

    if (result.entityResults.length > 0) {
      await supabase.from('entity_compliance_results').insert(
        result.entityResults.map((r) => ({
          certificate_id: cert.id,
          property_entity_id: r.property_entity_id,
          extracted_entity_id: r.extracted_entity_id,
          status: r.status,
          match_details: r.match_details,
        }))
      );
    }

    // Update compliance status — both entities table and legacy table
    await supabase
      .from('entities')
      .update({ compliance_status: result.overallStatus })
      .eq('id', entityId);
    await supabase
      .from(legacyTable)
      .update({ compliance_status: result.overallStatus })
      .eq('id', entityId)
      .then(() => { /* best-effort */ });

    // Log activity
    await supabase.from('activity_log').insert({
      organization_id: orgId,
      certificate_id: cert.id,
      entity_id: entityId,
      [entityType === 'vendor' ? 'vendor_id' : 'tenant_id']: entityId,
      action: 'compliance_checked',
      description: `Admin recheck: ${ent.compliance_status ?? 'null'} → ${result.overallStatus}`,
    });

    recalculated++;
    results[result.overallStatus] = (results[result.overallStatus] ?? 0) + 1;
    details.push({
      id: entityId,
      name: ent.name ?? '(unnamed)',
      org: orgId,
      before: ent.compliance_status,
      after: result.overallStatus,
    });
  }

  const summary = {
    totalStuck: stuckEntities.length,
    recalculated,
    skippedNoTemplate,
    skippedNoCert,
    resultBreakdown: results,
    details,
  };

  console.log('[admin/recheck-compliance]', JSON.stringify(summary, null, 2));

  return NextResponse.json(summary);
}
