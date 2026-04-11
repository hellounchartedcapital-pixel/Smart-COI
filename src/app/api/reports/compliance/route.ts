import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { formatCoverageType, findBestCoverageMatch } from '@/lib/coverage-utils';
import { VENDOR_TYPE_LABELS, type VendorType } from '@/lib/constants/vendor-requirements';
import type {
  ExtractedCoverage,
  TemplateCoverageRequirement,
  ComplianceStatus,
} from '@/types';

// ============================================================================
// GET /api/reports/compliance
//
// Generates an on-demand compliance report for the authenticated user's
// organization. Returns structured JSON consumed by the report page UI.
//
// IMPORTANT: This endpoint evaluates compliance INLINE by comparing each
// template requirement against the actual extracted coverages on file.
// It does NOT rely on the stale entities.compliance_status DB field or
// on compliance_results that may reference old template requirement IDs.
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
// Inline requirement evaluation
// ============================================================================

interface EvaluatedRequirement {
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

/**
 * Evaluate a single requirement against the extracted coverages on file.
 * Returns the status, gap description, and dollar gap.
 */
function evaluateRequirement(
  req: TemplateCoverageRequirement,
  coverages: ExtractedCoverage[],
): EvaluatedRequirement {
  const label = formatCoverageType(req.coverage_type);
  const base = {
    coverageType: req.coverage_type,
    coverageTypeLabel: label,
    minimumLimit: req.minimum_limit,
    limitType: req.limit_type,
    requiresAdditionalInsured: req.requires_additional_insured ?? false,
    requiresWaiverOfSubrogation: req.requires_waiver_of_subrogation ?? false,
  };

  if (!req.is_required) {
    return { ...base, status: 'not_required', gapDescription: null, dollarGap: null };
  }

  // Find matching coverage using fuzzy matching
  const coverageTypes = coverages.map((c) => c.coverage_type);
  const match = findBestCoverageMatch(req.coverage_type, coverageTypes);

  if (!match) {
    // No matching coverage on file at all
    const gap = req.minimum_limit;
    return {
      ...base,
      status: 'missing',
      gapDescription: gap != null
        ? `${label} — Missing (full $${gap.toLocaleString()} gap)`
        : `${label} — Missing`,
      dollarGap: gap,
    };
  }

  const cov = coverages[match.index];

  // Check limit
  if (req.minimum_limit != null && req.limit_type !== 'statutory') {
    const foundLimit = cov.limit_amount;
    if (foundLimit == null || foundLimit < req.minimum_limit) {
      const gap = req.minimum_limit - (foundLimit ?? 0);
      return {
        ...base,
        status: 'not_met',
        gapDescription: foundLimit != null
          ? `${label} — $${foundLimit.toLocaleString()} found, $${req.minimum_limit.toLocaleString()} required (gap: $${gap.toLocaleString()})`
          : `${label} — Limit not found, $${req.minimum_limit.toLocaleString()} required`,
        dollarGap: gap > 0 ? gap : 0,
      };
    }
  }

  // Check endorsements
  const endorsementIssues: string[] = [];
  if (req.requires_additional_insured && !cov.additional_insured_listed) {
    endorsementIssues.push('Additional Insured not listed');
  }
  if (req.requires_waiver_of_subrogation && !cov.waiver_of_subrogation) {
    endorsementIssues.push('Waiver of Subrogation not listed');
  }

  if (endorsementIssues.length > 0) {
    return {
      ...base,
      status: 'not_met',
      gapDescription: `${label} — ${endorsementIssues.join(', ')}`,
      dollarGap: null, // endorsement gaps are not dollar-quantifiable
    };
  }

  return { ...base, status: 'met', gapDescription: null, dollarGap: null };
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
    // Include 'processing' status: the batch pipeline bug left certs stuck
    // at 'processing' even though extraction completed. A 'processing' cert
    // with no data contributes empty arrays (harmless).
    const entityIds = (entities as EntityRow[]).map((e) => e.id);

    const [entityCertsRes, vendorCertsRes, tenantCertsRes] = await Promise.all([
      supabase
        .from('certificates')
        .select('id, entity_id, vendor_id, tenant_id, uploaded_at, insured_name, inferred_vendor_type, vendor_type_needs_review')
        .in('entity_id', entityIds)
        .in('processing_status', ['processing', 'extracted', 'review_confirmed'])
        .order('uploaded_at', { ascending: false }),
      supabase
        .from('certificates')
        .select('id, entity_id, vendor_id, tenant_id, uploaded_at, insured_name, inferred_vendor_type, vendor_type_needs_review')
        .in('vendor_id', entityIds)
        .in('processing_status', ['processing', 'extracted', 'review_confirmed'])
        .order('uploaded_at', { ascending: false }),
      supabase
        .from('certificates')
        .select('id, entity_id, vendor_id, tenant_id, uploaded_at, insured_name, inferred_vendor_type, vendor_type_needs_review')
        .in('tenant_id', entityIds)
        .in('processing_status', ['processing', 'extracted', 'review_confirmed'])
        .order('uploaded_at', { ascending: false }),
    ]);

    // Deduplicate and pick latest cert per entity
    const allCerts = [
      ...(entityCertsRes.data ?? []),
      ...(vendorCertsRes.data ?? []),
      ...(tenantCertsRes.data ?? []),
    ];

    const entityCertMap = new Map<string, (typeof allCerts)[number]>();
    for (const cert of allCerts) {
      const eid = cert.entity_id ?? cert.vendor_id ?? cert.tenant_id;
      if (eid && !entityCertMap.has(eid)) {
        entityCertMap.set(eid, cert);
      }
    }

    const certIds = [...new Set([...entityCertMap.values()].map((c) => c.id))];

    // ---- 4. Fetch extracted coverages and template requirements ----
    const templateIds = [
      ...new Set(
        (entities as EntityRow[])
          .map((e) => e.template_id)
          .filter((id): id is string => id != null)
      ),
    ];

    const [coveragesRes, requirementsRes] = await Promise.all([
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

    // ---- 5. Build vendor-by-vendor breakdown with INLINE evaluation ----
    // Instead of relying on compliance_results (which may reference old
    // template requirement IDs), we evaluate each requirement directly
    // against the extracted coverages using fuzzy coverage type matching.

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

    interface VendorGap {
      coverageType: string;
      coverageTypeLabel: string;
      gapType: string;
      requiredLimit: number | null;
      foundLimit: number | null;
      dollarGap: number | null;
      description: string;
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
      requirements: EvaluatedRequirement[];
      gaps: VendorGap[];
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    interface Issue {
      entityId: string;
      entityName: string;
      type: string;
      severity: 'critical' | 'warning';
      description: string;
    }

    const issues: Issue[] = [];

    // Coverage type aggregation
    const coverageTypeAgg = new Map<string, {
      coverageType: string;
      coverageTypeLabel: string;
      entityCount: number;
      totalExposure: number;
      missingCount: number;
      insufficientCount: number;
      endorsementGapCount: number;
    }>();

    let totalExposure = 0;
    let totalGaps = 0;
    let compliantCount = 0;
    let nonCompliantCount = 0;
    let expiredCount = 0;
    let needsSetupCount = 0;
    let expiringIn30Days = 0;
    let missingEndorsementCount = 0;

    const vendors: VendorBreakdown[] = (entities as EntityRow[]).map((entity) => {
      const cert = entityCertMap.get(entity.id);
      const certId = cert?.id;
      const coverages = certId ? (coveragesByCert.get(certId) ?? []) : [];
      const templateReqs = entity.template_id
        ? (requirementsByTemplate.get(entity.template_id) ?? [])
        : [];

      // Inferred vendor type
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

      // Check expiration status
      const expiredCoverageTypes: string[] = [];
      let activeCoverageCount = 0;
      for (const cov of coverages) {
        if (cov.expiration_date) {
          const expDate = new Date(cov.expiration_date + 'T00:00:00');
          if (expDate < now) {
            const label = formatCoverageType(cov.coverage_type);
            if (!expiredCoverageTypes.includes(label)) {
              expiredCoverageTypes.push(label);
            }
          } else {
            activeCoverageCount++;
          }
        }
      }

      const hasExpired = expiredCoverageTypes.length > 0;
      const isFullyExpired = hasExpired && activeCoverageCount === 0 && coverages.length > 0;
      const isPartiallyExpired = hasExpired && activeCoverageCount > 0;

      // Check if expiring within 30 days
      const threshold30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const isExpiringSoon = coverages.some((c) => {
        if (!c.expiration_date) return false;
        const exp = new Date(c.expiration_date + 'T00:00:00');
        return exp >= now && exp <= threshold30d;
      });

      // ---- Inline evaluate each requirement ----
      const evaluatedReqs = templateReqs.map((req) =>
        evaluateRequirement(req, coverages)
      );

      // Build gaps from evaluated requirements
      const gaps: VendorGap[] = [];
      let vendorExposure = 0;
      let vendorHasEndorsementGap = false;

      for (const req of evaluatedReqs) {
        if (req.status === 'met' || req.status === 'not_required') continue;

        const gapType = req.status === 'missing' ? 'missing'
          : (req.gapDescription?.includes('Additional Insured') ||
             req.gapDescription?.includes('Waiver of Subrogation'))
            ? 'endorsement'
            : 'insufficient';

        // Find matching coverage for gap detail
        const covTypes = coverages.map((c) => c.coverage_type);
        const match = findBestCoverageMatch(req.coverageType, covTypes);
        const foundLimit = match ? coverages[match.index].limit_amount : null;

        gaps.push({
          coverageType: req.coverageType,
          coverageTypeLabel: req.coverageTypeLabel,
          gapType,
          requiredLimit: req.minimumLimit,
          foundLimit,
          dollarGap: req.dollarGap,
          description: req.gapDescription ?? `${req.coverageTypeLabel} — Requirement not met`,
        });

        if (req.dollarGap != null && req.dollarGap > 0) {
          vendorExposure += req.dollarGap;
        }

        if (gapType === 'endorsement') {
          vendorHasEndorsementGap = true;
        }

        // Aggregate by coverage type
        const key = req.coverageType;
        if (!coverageTypeAgg.has(key)) {
          coverageTypeAgg.set(key, {
            coverageType: key,
            coverageTypeLabel: req.coverageTypeLabel,
            entityCount: 0,
            totalExposure: 0,
            missingCount: 0,
            insufficientCount: 0,
            endorsementGapCount: 0,
          });
        }
        const agg = coverageTypeAgg.get(key)!;
        agg.entityCount++;
        if (req.dollarGap != null) agg.totalExposure += req.dollarGap;
        if (gapType === 'missing') agg.missingCount++;
        if (gapType === 'insufficient') agg.insufficientCount++;
        if (gapType === 'endorsement') agg.endorsementGapCount++;
      }

      totalExposure += vendorExposure;
      totalGaps += gaps.length;

      // ---- Derive compliance status ----
      let complianceStatus: ComplianceStatus;

      if (templateReqs.length === 0) {
        // No template → needs setup
        complianceStatus = 'needs_setup';
        needsSetupCount++;
      } else if (isFullyExpired) {
        complianceStatus = 'expired';
        expiredCount++;
      } else if (gaps.length > 0 || isPartiallyExpired) {
        complianceStatus = 'non_compliant';
        nonCompliantCount++;
        if (isPartiallyExpired) expiredCount++;
      } else if (isExpiringSoon) {
        complianceStatus = 'expiring_soon';
        compliantCount++; // still compliant, just warning
        expiringIn30Days++;
      } else {
        complianceStatus = 'compliant';
        compliantCount++;
      }

      if (vendorHasEndorsementGap) missingEndorsementCount++;

      // ---- Build issues for this vendor ----
      if (isFullyExpired) {
        issues.push({
          entityId: entity.id,
          entityName: entity.name,
          type: 'expired_policy',
          severity: 'critical',
          description: 'All coverages on file are expired — request updated COI immediately',
        });
      } else if (isPartiallyExpired) {
        issues.push({
          entityId: entity.id,
          entityName: entity.name,
          type: 'expired_coverage',
          severity: 'critical',
          description: `Expired coverages: ${expiredCoverageTypes.join(', ')}`,
        });
      }

      for (const gap of gaps) {
        if (gap.gapType === 'missing') {
          issues.push({
            entityId: entity.id,
            entityName: entity.name,
            type: 'missing_coverage',
            severity: 'critical',
            description: gap.description,
          });
        } else if (gap.gapType === 'insufficient') {
          issues.push({
            entityId: entity.id,
            entityName: entity.name,
            type: 'insufficient_coverage',
            severity: 'warning',
            description: gap.description,
          });
        } else if (gap.gapType === 'endorsement') {
          issues.push({
            entityId: entity.id,
            entityName: entity.name,
            type: 'missing_endorsement',
            severity: 'warning',
            description: gap.description,
          });
        }
      }

      if (isExpiringSoon && !isFullyExpired && !isPartiallyExpired) {
        const earliest = coverages.reduce<string | null>((min, c) => {
          if (!c.expiration_date) return min;
          const exp = new Date(c.expiration_date + 'T00:00:00');
          if (exp < now) return min; // already expired
          if (!min) return c.expiration_date;
          return c.expiration_date < min ? c.expiration_date : min;
        }, null);

        if (earliest) {
          const expDate = new Date(earliest + 'T00:00:00');
          const daysUntil = Math.ceil(
            (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          issues.push({
            entityId: entity.id,
            entityName: entity.name,
            type: 'expiring_soon',
            severity: 'warning',
            description: `Certificate expires in ${daysUntil} day${daysUntil === 1 ? '' : 's'} (${earliest})`,
          });
        }
      }

      return {
        entityId: entity.id,
        entityName: entity.name,
        entityType: entity.entity_type,
        inferredVendorType: inferredType,
        inferredVendorTypeLabel: inferredType
          ? (VENDOR_TYPE_LABELS[inferredType] ?? inferredType)
          : null,
        vendorTypeNeedsReview: needsReview,
        complianceStatus,
        totalExposure: vendorExposure,
        coveragesOnFile,
        requirements: evaluatedReqs,
        gaps,
      };
    });

    // Sort issues: critical first, then warning; within same severity, by entity name
    issues.sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1;
      return a.entityName.localeCompare(b.entityName);
    });

    // ---- 6. Build recommended actions for ALL non-compliant/needs-setup vendors ----
    const recommendedActions = vendors
      .filter((v) => v.complianceStatus !== 'compliant' && v.complianceStatus !== 'expiring_soon')
      .sort((a, b) => {
        // Expired first
        const aExp = a.complianceStatus === 'expired' ? 2 : 0;
        const bExp = b.complianceStatus === 'expired' ? 2 : 0;
        if (aExp !== bExp) return bExp - aExp;
        // Then by exposure
        return b.totalExposure - a.totalExposure;
      })
      .map((v) => {
        let action: string;
        if (v.complianceStatus === 'expired') {
          action = 'Request updated certificate — current COI is expired';
        } else if (v.complianceStatus === 'needs_setup') {
          action = 'Assign a requirements template to evaluate compliance';
        } else {
          const missing = v.gaps.filter((g) => g.gapType === 'missing').map((g) => g.coverageTypeLabel);
          const insufficient = v.gaps.filter((g) => g.gapType === 'insufficient').map((g) => g.coverageTypeLabel);
          const endorsement = v.gaps.filter((g) => g.gapType === 'endorsement').map((g) => g.coverageTypeLabel);
          const parts: string[] = [];
          if (missing.length > 0) parts.push(`Obtain missing coverage: ${missing.join(', ')}`);
          if (insufficient.length > 0) parts.push(`Increase limits: ${insufficient.join(', ')}`);
          if (endorsement.length > 0) parts.push(`Add endorsements: ${endorsement.join(', ')}`);
          action = parts.join('. ') || 'Review compliance gaps';
        }

        return {
          entityId: v.entityId,
          entityName: v.entityName,
          entityType: v.entityType,
          propertyName: null as string | null,
          severity: v.complianceStatus === 'expired'
            ? ('critical' as const)
            : v.totalExposure > 0
              ? ('warning' as const)
              : ('info' as const),
          totalExposure: v.totalExposure,
          action,
          topGaps: v.gaps
            .sort((a, b) => (b.dollarGap ?? 0) - (a.dollarGap ?? 0))
            .slice(0, 3)
            .map((g) => g.description),
        };
      });

    // ---- 7. Build needs-review list ----
    const needsReview = vendors
      .filter((v) => v.vendorTypeNeedsReview)
      .map((v) => ({
        entityId: v.entityId,
        entityName: v.entityName,
        inferredVendorType: v.inferredVendorType,
        inferredVendorTypeLabel: v.inferredVendorTypeLabel,
      }));

    // ---- 8. Coverage breakdown sorted by exposure ----
    const coverageBreakdown = [...coverageTypeAgg.values()].sort(
      (a, b) => b.totalExposure - a.totalExposure
    );

    // ---- 9. Compute summary ----
    const totalEntities = vendors.length;
    const evaluableCount = totalEntities - needsSetupCount;
    const complianceScore = evaluableCount > 0
      ? Math.round((compliantCount / evaluableCount) * 10000) / 100
      : 100;

    // ---- 10. Log activity ----
    await supabase.from('activity_log').insert({
      organization_id: orgId,
      action: 'compliance_report_generated',
      description: `Compliance report generated — ${totalEntities} entities, ${complianceScore}% compliance rate`,
      performed_by: userId,
    });

    // ---- 11. Return JSON response ----
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      organizationName: orgName,
      summary: {
        totalEntities,
        compliantCount,
        nonCompliantCount,
        complianceScore,
        totalGaps,
        totalExposure,
        expiredCount,
        expiringIn30Days,
        needsSetupCount,
        underReviewCount: 0,
        missingEndorsementCount,
      },
      issues,
      vendors,
      coverageBreakdown,
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
