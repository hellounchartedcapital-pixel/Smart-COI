import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { quantifyRisk } from '@/lib/compliance/risk-quantification';
import type { EntityComplianceData } from '@/lib/compliance/risk-quantification';
import { formatCoverageType } from '@/lib/coverage-utils';
import { VENDOR_TYPE_LABELS, type VendorType } from '@/lib/constants/vendor-requirements';
import type {
  ComplianceResult,
  ExtractedCoverage,
  TemplateCoverageRequirement,
  ComplianceStatus,
} from '@/types';

// ============================================================================
// GET /api/reports/compliance
//
// Generates an on-demand compliance report for the authenticated user's
// organization. Returns structured JSON consumed by the dashboard report UI.
// ============================================================================

// ============================================================================
// Auth helper
// ============================================================================

async function getAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const service = createServiceClient();
  const { data: profile } = await service
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id) return null;

  return { userId: user.id, orgId: profile.organization_id, supabase };
}

// ============================================================================
// Route handler
// ============================================================================

export async function GET() {
  try {
    const auth = await getAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { userId, orgId, supabase } = auth;

    // ---- 1. Fetch org metadata ----
    const { data: org } = await supabase
      .from('organizations')
      .select('name, industry')
      .eq('id', orgId)
      .single();

    const orgName = org?.name ?? 'Organization';

    // ---- 2. Fetch all active entities with property & template info ----
    type EntityRow = {
      id: string;
      name: string;
      entity_type: string;
      entity_category: string | null;
      vendor_type_needs_review: boolean | null;
      compliance_status: string;
      property_id: string | null;
      template_id: string | null;
      contact_name: string | null;
      contact_email: string | null;
      properties: { name: string }[] | { name: string } | null;
    };

    const { data: entities } = await supabase
      .from('entities')
      .select(
        'id, name, entity_type, entity_category, vendor_type_needs_review, compliance_status, property_id, template_id, contact_name, contact_email, properties(name)'
      )
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .is('archived_at', null);

    if (!entities || entities.length === 0) {
      return NextResponse.json({
        generatedAt: new Date().toISOString(),
        organizationName: orgName,
        summary: {
          totalEntities: 0,
          compliantCount: 0,
          nonCompliantCount: 0,
          complianceScore: 100,
          totalGaps: 0,
          totalExposure: 0,
          expiredCount: 0,
          expiringIn30Days: 0,
          needsSetupCount: 0,
          underReviewCount: 0,
          missingEndorsementCount: 0,
        },
        issues: [],
        vendors: [],
        coverageBreakdown: [],
        recommendedActions: [],
        needsReview: [],
      });
    }

    // ---- 3. Find latest certificate per entity ----
    const entityIds = entities.map((e: { id: string }) => e.id);

    const [entityCertsRes, vendorCertsRes, tenantCertsRes] = await Promise.all([
      supabase
        .from('certificates')
        .select('id, entity_id, vendor_id, tenant_id, uploaded_at, insured_name, inferred_vendor_type, vendor_type_needs_review')
        .in('entity_id', entityIds)
        .in('processing_status', ['extracted', 'review_confirmed'])
        .order('uploaded_at', { ascending: false }),
      supabase
        .from('certificates')
        .select('id, entity_id, vendor_id, tenant_id, uploaded_at, insured_name, inferred_vendor_type, vendor_type_needs_review')
        .in('vendor_id', entityIds)
        .in('processing_status', ['extracted', 'review_confirmed'])
        .order('uploaded_at', { ascending: false }),
      supabase
        .from('certificates')
        .select('id, entity_id, vendor_id, tenant_id, uploaded_at, insured_name, inferred_vendor_type, vendor_type_needs_review')
        .in('tenant_id', entityIds)
        .in('processing_status', ['extracted', 'review_confirmed'])
        .order('uploaded_at', { ascending: false }),
    ]);

    // Deduplicate and pick latest cert per entity
    const allCerts = [
      ...(entityCertsRes.data ?? []),
      ...(vendorCertsRes.data ?? []),
      ...(tenantCertsRes.data ?? []),
    ];

    // Map entity ID → latest certificate row
    const entityCertMap = new Map<string, (typeof allCerts)[number]>();
    for (const cert of allCerts) {
      const eid = cert.entity_id ?? cert.vendor_id ?? cert.tenant_id;
      if (eid && !entityCertMap.has(eid)) {
        entityCertMap.set(eid, cert);
      }
    }

    const certIds = [...new Set([...entityCertMap.values()].map((c) => c.id))];

    // ---- 4. Fetch compliance results, extracted coverages, and template requirements ----
    const templateIds = [
      ...new Set(
        entities
          .map((e: { template_id: string | null }) => e.template_id)
          .filter((id: string | null): id is string => id != null)
      ),
    ];

    const [complianceRes, coveragesRes, requirementsRes] = await Promise.all([
      certIds.length > 0
        ? supabase
            .from('compliance_results')
            .select(
              'id, certificate_id, coverage_requirement_id, extracted_coverage_id, status, gap_description, created_at'
            )
            .in('certificate_id', certIds)
        : Promise.resolve({ data: [] as ComplianceResult[] }),
      certIds.length > 0
        ? supabase
            .from('extracted_coverages')
            .select(
              'id, certificate_id, coverage_type, carrier_name, policy_number, limit_amount, limit_type, effective_date, expiration_date, additional_insured_listed, additional_insured_entities, waiver_of_subrogation, confidence_flag, raw_extracted_text, created_at'
            )
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

    // ---- 5. Transform into EntityComplianceData[] for risk quantification ----
    const entityComplianceData: EntityComplianceData[] = (entities as EntityRow[]).map((entity) => {
      const cert = entityCertMap.get(entity.id);
      const certId = cert?.id;
      const props = entity.properties;
      const propertyName = Array.isArray(props)
        ? (props[0]?.name ?? null)
        : (props?.name ?? null);

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
    const risk = quantifyRisk(entityComplianceData);

    // ---- 7. Build issues list (critical + warning) ----
    interface Issue {
      entityId: string;
      entityName: string;
      type: string;
      severity: 'critical' | 'warning';
      description: string;
    }

    const issues: Issue[] = [];

    for (const breakdown of risk.perEntityBreakdown) {
      // Critical: expired policies
      if (breakdown.isExpired) {
        issues.push({
          entityId: breakdown.entityId,
          entityName: breakdown.entityName,
          type: 'expired_policy',
          severity: 'critical',
          description: 'All coverages on file are expired — request updated COI immediately',
        });
      } else if (breakdown.isPartiallyExpired) {
        issues.push({
          entityId: breakdown.entityId,
          entityName: breakdown.entityName,
          type: 'expired_coverage',
          severity: 'critical',
          description: `Expired coverages: ${breakdown.expiredCoverageTypes.join(', ')}`,
        });
      }

      // Critical: missing required coverage types
      const missingGaps = breakdown.coverageGaps.filter(
        (g) => g.gapType === 'missing' || g.gapType === 'missing_unquantifiable'
      );
      for (const gap of missingGaps) {
        issues.push({
          entityId: breakdown.entityId,
          entityName: breakdown.entityName,
          type: 'missing_coverage',
          severity: 'critical',
          description: gap.gapDescription,
        });
      }

      // Warning: expiring within 30 days (not already expired)
      if (
        !breakdown.isExpired &&
        !breakdown.isPartiallyExpired &&
        breakdown.earliestExpiration
      ) {
        const expDate = new Date(breakdown.earliestExpiration + 'T00:00:00');
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const daysUntil = Math.ceil(
          (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntil >= 0 && daysUntil <= 30) {
          issues.push({
            entityId: breakdown.entityId,
            entityName: breakdown.entityName,
            type: 'expiring_soon',
            severity: 'warning',
            description: `Certificate expires in ${daysUntil} day${daysUntil === 1 ? '' : 's'} (${breakdown.earliestExpiration})`,
          });
        }
      }

      // Warning: insufficient limits
      const insufficientGaps = breakdown.coverageGaps.filter(
        (g) => g.gapType === 'insufficient'
      );
      for (const gap of insufficientGaps) {
        issues.push({
          entityId: breakdown.entityId,
          entityName: breakdown.entityName,
          type: 'insufficient_coverage',
          severity: 'warning',
          description: gap.gapDescription,
        });
      }

      // Warning: missing endorsements
      const endorsementGaps = breakdown.coverageGaps.filter(
        (g) => g.gapType === 'endorsement'
      );
      for (const gap of endorsementGaps) {
        issues.push({
          entityId: breakdown.entityId,
          entityName: breakdown.entityName,
          type: 'missing_endorsement',
          severity: 'warning',
          description: gap.gapDescription,
        });
      }
    }

    // Sort: critical first, then warning; within same severity, by entity name
    issues.sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1;
      return a.entityName.localeCompare(b.entityName);
    });

    // ---- 8. Build vendor-by-vendor breakdown ----
    interface VendorCoverage {
      coverageType: string;
      coverageTypeLabel: string;
      carrierName: string | null;
      policyNumber: string | null;
      limitAmount: number | null;
      limitType: string | null;
      effectiveDate: string | null;
      expirationDate: string | null;
      isExpired: boolean;
    }

    interface VendorRequirement {
      coverageType: string;
      coverageTypeLabel: string;
      minimumLimit: number | null;
      limitType: string | null;
      requiresAdditionalInsured: boolean;
      requiresWaiverOfSubrogation: boolean;
      status: 'met' | 'not_met' | 'missing' | 'not_required';
      gapDescription: string | null;
      dollarGap: number | null;
    }

    interface VendorBreakdown {
      entityId: string;
      entityName: string;
      entityType: string;
      inferredVendorType: string | null;
      inferredVendorTypeLabel: string | null;
      vendorTypeNeedsReview: boolean;
      complianceStatus: ComplianceStatus;
      totalExposure: number;
      coveragesOnFile: VendorCoverage[];
      requirements: VendorRequirement[];
      gaps: Array<{
        coverageType: string;
        coverageTypeLabel: string;
        gapType: string;
        requiredLimit: number | null;
        foundLimit: number | null;
        dollarGap: number | null;
        description: string;
      }>;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const vendors: VendorBreakdown[] = (entities as EntityRow[]).map((entity) => {
      const cert = entityCertMap.get(entity.id);
      const certId = cert?.id;
      const coverages = certId ? (coveragesByCert.get(certId) ?? []) : [];
      const compResults = certId ? (complianceByCert.get(certId) ?? []) : [];
      const templateReqs = entity.template_id
        ? (requirementsByTemplate.get(entity.template_id) ?? [])
        : [];

      // Inferred vendor type: prefer entity-level, fall back to certificate-level
      const inferredType =
        (entity.entity_category as VendorType | null) ??
        (cert?.inferred_vendor_type as VendorType | null) ??
        null;
      const needsReview =
        entity.vendor_type_needs_review ??
        cert?.vendor_type_needs_review ??
        false;

      // Build coverages on file
      const coveragesOnFile: VendorCoverage[] = coverages.map((cov) => {
        const expDate = cov.expiration_date
          ? new Date(cov.expiration_date + 'T00:00:00')
          : null;
        return {
          coverageType: cov.coverage_type,
          coverageTypeLabel: formatCoverageType(cov.coverage_type),
          carrierName: cov.carrier_name,
          policyNumber: cov.policy_number,
          limitAmount: cov.limit_amount,
          limitType: cov.limit_type,
          effectiveDate: cov.effective_date,
          expirationDate: cov.expiration_date,
          isExpired: expDate ? expDate < now : false,
        };
      });

      // Build requirement → compliance result mapping
      const resultByReqId = new Map<string, ComplianceResult>();
      for (const cr of compResults) {
        if (cr.coverage_requirement_id) {
          resultByReqId.set(cr.coverage_requirement_id, cr);
        }
      }

      // Get the risk breakdown for gap data
      const riskBreakdown = risk.perEntityBreakdown.find(
        (b) => b.entityId === entity.id
      );

      // Build requirements with status
      const requirements: VendorRequirement[] = templateReqs.map((req) => {
        const result = resultByReqId.get(req.id);
        const matchingGap = riskBreakdown?.coverageGaps.find(
          (g) =>
            g.coverageType === req.coverage_type &&
            (g.limitType === req.limit_type || g.limitType === null)
        );

        return {
          coverageType: req.coverage_type,
          coverageTypeLabel: formatCoverageType(req.coverage_type),
          minimumLimit: req.minimum_limit,
          limitType: req.limit_type,
          requiresAdditionalInsured: req.requires_additional_insured ?? false,
          requiresWaiverOfSubrogation: req.requires_waiver_of_subrogation ?? false,
          status: (result?.status as VendorRequirement['status']) ?? 'missing',
          gapDescription: result?.gap_description ?? null,
          dollarGap: matchingGap?.dollarGap ?? null,
        };
      });

      // Build gaps list from risk breakdown
      const gaps = (riskBreakdown?.coverageGaps ?? []).map((g) => ({
        coverageType: g.coverageType,
        coverageTypeLabel: g.coverageTypeLabel,
        gapType: g.gapType,
        requiredLimit: g.requiredLimit,
        foundLimit: g.foundLimit,
        dollarGap: g.dollarGap,
        description: g.gapDescription,
      }));

      return {
        entityId: entity.id,
        entityName: entity.name,
        entityType: entity.entity_type,
        inferredVendorType: inferredType,
        inferredVendorTypeLabel: inferredType
          ? (VENDOR_TYPE_LABELS[inferredType] ?? inferredType)
          : null,
        vendorTypeNeedsReview: needsReview,
        complianceStatus: entity.compliance_status as ComplianceStatus,
        totalExposure: riskBreakdown?.totalExposure ?? 0,
        coveragesOnFile,
        requirements,
        gaps,
      };
    });

    // ---- 9. Build needs-review list ----
    const needsReview = vendors
      .filter((v) => v.vendorTypeNeedsReview)
      .map((v) => ({
        entityId: v.entityId,
        entityName: v.entityName,
        inferredVendorType: v.inferredVendorType,
        inferredVendorTypeLabel: v.inferredVendorTypeLabel,
      }));

    // ---- 10. Build recommended actions from risk quantification ----
    const recommendedActions = risk.topPriorityActions.map((action) => ({
      entityId: action.entityId,
      entityName: action.entityName,
      entityType: action.entityType,
      propertyName: action.propertyName,
      severity: action.isExpired
        ? ('critical' as const)
        : action.totalExposure > 0
          ? ('warning' as const)
          : ('info' as const),
      totalExposure: action.totalExposure,
      action: action.action,
      topGaps: action.topGaps,
    }));

    // ---- 11. Total gaps count ----
    const totalGaps = risk.perEntityBreakdown.reduce(
      (sum, e) => sum + e.coverageGaps.length,
      0
    );

    // ---- 12. Log activity ----
    await supabase.from('activity_log').insert({
      organization_id: orgId,
      action: 'compliance_report_generated',
      description: `Compliance report generated — ${risk.entityCount} entities, ${risk.complianceRate}% compliance rate`,
      performed_by: userId,
    });

    // ---- 13. Return JSON response ----
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      organizationName: orgName,
      summary: {
        totalEntities: risk.entityCount,
        compliantCount: risk.entityCount - risk.nonCompliantCount - risk.needsSetupCount - risk.underReviewCount,
        nonCompliantCount: risk.nonCompliantCount,
        complianceScore: risk.complianceRate,
        totalGaps,
        totalExposure: risk.totalExposureGap,
        expiredCount: risk.expiredCount,
        expiringIn30Days: risk.expiringIn30Days,
        needsSetupCount: risk.needsSetupCount,
        underReviewCount: risk.underReviewCount,
        missingEndorsementCount: risk.missingEndorsementCount,
      },
      issues,
      vendors,
      coverageBreakdown: risk.perCoverageTypeBreakdown,
      recommendedActions,
      needsReview,
    });
  } catch (err) {
    console.error('[compliance-report] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
