'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { quantifyRisk } from '@/lib/compliance/risk-quantification';
import type { EntityComplianceData } from '@/lib/compliance/risk-quantification';
import { generateComplianceAuditReport } from '@/lib/reports/compliance-audit-report';
import { getIndustryLabel } from '@/lib/constants/industries';
import { getTerminology } from '@/lib/constants/terminology';
import type {
  Industry,
  ComplianceResult,
  ExtractedCoverage,
  TemplateCoverageRequirement,
  ComplianceStatus,
} from '@/types';

// ============================================================================
// Auth helper (same pattern as other action files)
// ============================================================================

async function requireAuth(): Promise<{ userId: string; orgId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const service = createServiceClient();
  const { data: profile } = await service
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();
  if (!profile?.organization_id) throw new Error('No organization found');

  return { userId: user.id, orgId: profile.organization_id };
}

// ============================================================================
// Main action
// ============================================================================

/**
 * Generate a compliance audit PDF for the authenticated user's organization.
 *
 * Fetches all active entities with their compliance data, runs risk
 * quantification, and returns the PDF as a base64-encoded string.
 *
 * Returns `{ pdf: string; filename: string }` on success or `{ error: string }`
 * on failure. The `pdf` field is a base64-encoded PDF buffer.
 */
export async function generateAuditReportPDF(): Promise<
  { pdf: string; filename: string } | { error: string }
> {
  const { userId, orgId } = await requireAuth();
  const supabase = await createClient();

  // ---- 1. Fetch org metadata ----
  const { data: org } = await supabase
    .from('organizations')
    .select('name, industry')
    .eq('id', orgId)
    .single();

  const orgName = org?.name ?? 'Organization';
  const industry = (org?.industry as Industry) ?? null;
  const terms = getTerminology(industry);

  // ---- 2. Fetch all active entities with property info ----
  const { data: entities } = await supabase
    .from('entities')
    .select('id, name, entity_type, compliance_status, property_id, template_id, properties(name)')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .is('archived_at', null);

  if (!entities || entities.length === 0) {
    return { error: 'No entities found. Add vendors or tenants before generating an audit report.' };
  }

  // ---- 3. Find latest certificate per entity ----
  // Certificates link to entities via entity_id (new) or vendor_id/tenant_id (legacy).
  // Query both paths and take the most recent per entity.
  const entityIds = entities.map((e) => e.id);

  // Batch query: certificates linked via entity_id, vendor_id, or tenant_id
  const [entityCertsRes, vendorCertsRes, tenantCertsRes] = await Promise.all([
    supabase
      .from('certificates')
      .select('id, entity_id, vendor_id, tenant_id, uploaded_at')
      .in('entity_id', entityIds)
      .in('processing_status', ['extracted', 'review_confirmed'])
      .order('uploaded_at', { ascending: false }),
    supabase
      .from('certificates')
      .select('id, entity_id, vendor_id, tenant_id, uploaded_at')
      .in('vendor_id', entityIds)
      .in('processing_status', ['extracted', 'review_confirmed'])
      .order('uploaded_at', { ascending: false }),
    supabase
      .from('certificates')
      .select('id, entity_id, vendor_id, tenant_id, uploaded_at')
      .in('tenant_id', entityIds)
      .in('processing_status', ['extracted', 'review_confirmed'])
      .order('uploaded_at', { ascending: false }),
  ]);

  // Deduplicate and pick latest cert per entity
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allCerts = [
    ...(entityCertsRes.data ?? []),
    ...(vendorCertsRes.data ?? []),
    ...(tenantCertsRes.data ?? []),
  ];

  const entityCertMap = new Map<string, string>();
  for (const cert of allCerts) {
    const eid = cert.entity_id ?? cert.vendor_id ?? cert.tenant_id;
    if (eid && !entityCertMap.has(eid)) {
      entityCertMap.set(eid, cert.id);
    }
  }

  const certIds = [...new Set(entityCertMap.values())];

  // ---- 4. Fetch compliance results, extracted coverages, and template requirements ----
  // Collect all template IDs to fetch requirements in one batch
  const templateIds = [
    ...new Set(
      entities
        .map((e) => e.template_id)
        .filter((id): id is string => id != null)
    ),
  ];

  // Parallel fetch of all compliance-related data
  const [complianceRes, coveragesRes, requirementsRes] = await Promise.all([
    certIds.length > 0
      ? supabase
          .from('compliance_results')
          .select('id, certificate_id, coverage_requirement_id, extracted_coverage_id, status, gap_description, created_at')
          .in('certificate_id', certIds)
      : Promise.resolve({ data: [] as ComplianceResult[] }),
    certIds.length > 0
      ? supabase
          .from('extracted_coverages')
          .select('id, certificate_id, coverage_type, carrier_name, policy_number, limit_amount, limit_type, effective_date, expiration_date, additional_insured_listed, additional_insured_entities, waiver_of_subrogation, confidence_flag, raw_extracted_text, created_at')
          .in('certificate_id', certIds)
      : Promise.resolve({ data: [] as ExtractedCoverage[] }),
    templateIds.length > 0
      ? supabase
          .from('template_coverage_requirements')
          .select('*')
          .in('template_id', templateIds)
      : Promise.resolve({ data: [] as TemplateCoverageRequirement[] }),
  ]);

  // Group compliance results by certificate_id
  const complianceByCert = new Map<string, ComplianceResult[]>();
  for (const cr of (complianceRes.data ?? []) as ComplianceResult[]) {
    const list = complianceByCert.get(cr.certificate_id) ?? [];
    list.push(cr);
    complianceByCert.set(cr.certificate_id, list);
  }

  // Group extracted coverages by certificate_id
  const coveragesByCert = new Map<string, ExtractedCoverage[]>();
  for (const ec of (coveragesRes.data ?? []) as ExtractedCoverage[]) {
    const list = coveragesByCert.get(ec.certificate_id) ?? [];
    list.push(ec);
    coveragesByCert.set(ec.certificate_id, list);
  }

  // Group template requirements by template_id
  const requirementsByTemplate = new Map<string, TemplateCoverageRequirement[]>();
  for (const req of (requirementsRes.data ?? []) as TemplateCoverageRequirement[]) {
    const list = requirementsByTemplate.get(req.template_id) ?? [];
    list.push(req);
    requirementsByTemplate.set(req.template_id, list);
  }

  // ---- 5. Transform into EntityComplianceData[] ----
  const entityComplianceData: EntityComplianceData[] = entities.map((entity) => {
    const certId = entityCertMap.get(entity.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const propertyName = (entity as any).properties?.name ?? null;

    return {
      entityId: entity.id,
      entityName: entity.name,
      entityType: entity.entity_type,
      complianceStatus: entity.compliance_status as ComplianceStatus,
      propertyId: entity.property_id,
      propertyName,
      complianceResults: certId ? (complianceByCert.get(certId) ?? []) : [],
      extractedCoverages: certId ? (coveragesByCert.get(certId) ?? []) : [],
      requirements: entity.template_id
        ? (requirementsByTemplate.get(entity.template_id) ?? [])
        : [],
    };
  });

  // ---- 6. Run risk quantification ----
  const riskResult = quantifyRisk(entityComplianceData);

  // ---- 7. Generate PDF ----
  const today = new Date().toISOString().split('T')[0];
  const pdfBuffer = generateComplianceAuditReport(riskResult, {
    orgName,
    auditDate: today,
    industryLabel: industry ? getIndustryLabel(industry) : undefined,
    entityLabel: terms.entityPlural,
  });

  // ---- 8. Log activity ----
  await supabase.from('activity_log').insert({
    organization_id: orgId,
    action: 'audit_report_generated',
    description: `Compliance audit report generated — ${riskResult.entityCount} entities, ${riskResult.complianceRate}% compliance rate`,
    performed_by: userId,
  });

  // Return PDF as base64 (Next.js server actions can't return raw buffers)
  const sanitizedOrgName = orgName.replace(/[^a-zA-Z0-9-_ ]/g, '').trim();
  const filename = `SmartCOI-Compliance-Audit-${sanitizedOrgName}-${today}.pdf`;

  return {
    pdf: pdfBuffer.toString('base64'),
    filename,
  };
}
