// ============================================================================
// SmartCOI — Risk Quantification Engine
//
// Calculates dollar-value exposure gaps across an organization's entities.
// Takes compliance results, extracted coverages, and template requirements,
// then produces per-entity and per-coverage-type breakdowns with prioritized
// action items.
// ============================================================================

import { formatCoverageType } from '@/lib/coverage-utils';
import type {
  ComplianceResult,
  ComplianceStatus,
  ExtractedCoverage,
  TemplateCoverageRequirement,
  LimitType,
} from '@/types';

// ============================================================================
// Input types
// ============================================================================

/** One entity with its associated compliance data */
export interface EntityComplianceData {
  entityId: string;
  entityName: string;
  entityType: string; // 'vendor' | 'tenant' | 'subcontractor' | etc.
  complianceStatus: ComplianceStatus;
  propertyId: string | null;
  propertyName: string | null;
  /** The compliance results for this entity's most recent certificate */
  complianceResults: ComplianceResult[];
  /** Extracted coverages from the entity's most recent certificate */
  extractedCoverages: ExtractedCoverage[];
  /** The template requirements assigned to this entity */
  requirements: TemplateCoverageRequirement[];
}

// ============================================================================
// Output types
// ============================================================================

export interface CoverageGap {
  coverageType: string;
  coverageTypeLabel: string;
  limitType: LimitType | null;
  requiredLimit: number | null;
  foundLimit: number | null;
  /** Dollar gap. null when the gap is unquantifiable (e.g., statutory). */
  dollarGap: number | null;
  gapType: 'insufficient' | 'missing' | 'missing_unquantifiable' | 'endorsement';
  gapDescription: string;
}

export interface EntityRiskBreakdown {
  entityId: string;
  entityName: string;
  entityType: string;
  complianceStatus: ComplianceStatus;
  propertyId: string | null;
  propertyName: string | null;
  coverageGaps: CoverageGap[];
  /** Sum of quantifiable dollar gaps for this entity */
  totalExposure: number;
  /** Whether any gap is unquantifiable (statutory missing, etc.) */
  hasUnquantifiableRisk: boolean;
  /** Whether the entity's certificate is expired */
  isExpired: boolean;
  /** Earliest expiration date across coverages, or null */
  earliestExpiration: string | null;
}

export interface CoverageTypeBreakdown {
  coverageType: string;
  coverageTypeLabel: string;
  /** Number of entities with a gap in this coverage type */
  entityCount: number;
  /** Total dollar exposure across all entities for this coverage type */
  totalExposure: number;
  /** Number of entities where this coverage is completely missing */
  missingCount: number;
  /** Number of entities where this coverage has insufficient limits */
  insufficientCount: number;
  /** Number of entities missing an endorsement for this coverage type */
  endorsementGapCount: number;
}

export interface PriorityAction {
  entityId: string;
  entityName: string;
  entityType: string;
  propertyName: string | null;
  totalExposure: number;
  hasUnquantifiableRisk: boolean;
  isExpired: boolean;
  /** Concise action description */
  action: string;
  /** Top coverage gaps driving this action */
  topGaps: string[];
}

export interface RiskQuantificationResult {
  /** Sum of all quantifiable dollar gaps across all entities */
  totalExposureGap: number;
  /** Total entities audited */
  entityCount: number;
  /** Entities with any compliance gap */
  nonCompliantCount: number;
  /** Entities with expired certificates */
  expiredCount: number;
  /** Entities with certificates expiring within 30 days */
  expiringIn30Days: number;
  /** Entities with certificates expiring within 60 days */
  expiringIn60Days: number;
  /** Entities with certificates expiring within 90 days */
  expiringIn90Days: number;
  /** Entities missing additional insured verification */
  missingEndorsementCount: number;
  /** Percentage of entities that are compliant (0-100) */
  complianceRate: number;
  /** Per-entity risk breakdown */
  perEntityBreakdown: EntityRiskBreakdown[];
  /** Aggregated by coverage type — which types have the most gaps */
  perCoverageTypeBreakdown: CoverageTypeBreakdown[];
  /** Top 5 highest-exposure entities with specific action items */
  topPriorityActions: PriorityAction[];
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Calculate the dollar gap for a single coverage requirement vs extracted coverage.
 */
function calculateCoverageGap(
  requirement: TemplateCoverageRequirement,
  complianceResult: ComplianceResult,
  extractedCoverages: ExtractedCoverage[]
): CoverageGap | null {
  const status = complianceResult.status;

  // No gap — requirement is met or not required
  if (status === 'met' || status === 'not_required') return null;

  const coverageTypeLabel = formatCoverageType(requirement.coverage_type);
  const matchedCoverage = complianceResult.extracted_coverage_id
    ? extractedCoverages.find((c) => c.id === complianceResult.extracted_coverage_id)
    : null;

  // Missing coverage entirely
  if (status === 'missing') {
    if (requirement.limit_type === 'statutory') {
      return {
        coverageType: requirement.coverage_type,
        coverageTypeLabel,
        limitType: requirement.limit_type,
        requiredLimit: null,
        foundLimit: null,
        dollarGap: null,
        gapType: 'missing_unquantifiable',
        gapDescription: `${coverageTypeLabel} — Missing (unquantifiable risk, statutory requirement)`,
      };
    }
    return {
      coverageType: requirement.coverage_type,
      coverageTypeLabel,
      limitType: requirement.limit_type,
      requiredLimit: requirement.minimum_limit,
      foundLimit: null,
      dollarGap: requirement.minimum_limit,
      gapType: 'missing',
      gapDescription: requirement.minimum_limit != null
        ? `${coverageTypeLabel} — Missing (full $${(requirement.minimum_limit).toLocaleString()} gap)`
        : `${coverageTypeLabel} — Missing (no limit specified)`,
    };
  }

  // not_met — coverage exists but doesn't satisfy the requirement
  if (status === 'not_met') {
    // Check if this is an endorsement gap (coverage/limits are fine but endorsement missing)
    const gapDesc = complianceResult.gap_description ?? '';
    const isEndorsementGap =
      gapDesc.includes('Additional Insured') ||
      gapDesc.includes('Waiver of Subrogation') ||
      gapDesc.includes('Primary');

    if (isEndorsementGap) {
      return {
        coverageType: requirement.coverage_type,
        coverageTypeLabel,
        limitType: requirement.limit_type,
        requiredLimit: requirement.minimum_limit,
        foundLimit: matchedCoverage?.limit_amount ?? null,
        dollarGap: null,
        gapType: 'endorsement',
        gapDescription: gapDesc || `${coverageTypeLabel} — Missing required endorsement`,
      };
    }

    // Limit shortfall
    const foundLimit = matchedCoverage?.limit_amount ?? null;
    const requiredLimit = requirement.minimum_limit;

    if (requirement.limit_type === 'statutory') {
      return {
        coverageType: requirement.coverage_type,
        coverageTypeLabel,
        limitType: requirement.limit_type,
        requiredLimit: null,
        foundLimit,
        dollarGap: null,
        gapType: 'missing_unquantifiable',
        gapDescription: `${coverageTypeLabel} — Statutory requirement not met`,
      };
    }

    if (requiredLimit != null && foundLimit != null) {
      const gap = requiredLimit - foundLimit;
      return {
        coverageType: requirement.coverage_type,
        coverageTypeLabel,
        limitType: requirement.limit_type,
        requiredLimit,
        foundLimit,
        dollarGap: gap > 0 ? gap : 0,
        gapType: 'insufficient',
        gapDescription: `${coverageTypeLabel} — $${foundLimit.toLocaleString()} found, $${requiredLimit.toLocaleString()} required (gap: $${gap.toLocaleString()})`,
      };
    }

    // Limit could not be determined
    return {
      coverageType: requirement.coverage_type,
      coverageTypeLabel,
      limitType: requirement.limit_type,
      requiredLimit,
      foundLimit,
      dollarGap: requiredLimit, // Treat unknown as full gap
      gapType: 'insufficient',
      gapDescription: gapDesc || `${coverageTypeLabel} — Limit could not be determined`,
    };
  }

  return null;
}

/**
 * Determine the earliest expiration date from extracted coverages.
 */
function getEarliestExpiration(coverages: ExtractedCoverage[]): string | null {
  let earliest: string | null = null;
  for (const c of coverages) {
    if (c.expiration_date) {
      if (!earliest || c.expiration_date < earliest) {
        earliest = c.expiration_date;
      }
    }
  }
  return earliest;
}

/**
 * Check how many entities have certificates expiring within a given number of days.
 */
function countExpiringWithinDays(
  entities: EntityRiskBreakdown[],
  days: number,
  now: Date
): number {
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return entities.filter((e) => {
    if (!e.earliestExpiration) return false;
    const expDate = new Date(e.earliestExpiration + 'T00:00:00');
    return expDate >= now && expDate <= threshold;
  }).length;
}

/**
 * Build a concise action string for a priority action item.
 */
function buildActionString(breakdown: EntityRiskBreakdown): string {
  if (breakdown.isExpired) {
    return 'Request updated certificate — current COI is expired';
  }

  const missingCoverages = breakdown.coverageGaps
    .filter((g) => g.gapType === 'missing' || g.gapType === 'missing_unquantifiable')
    .map((g) => g.coverageTypeLabel);

  const insufficientCoverages = breakdown.coverageGaps
    .filter((g) => g.gapType === 'insufficient')
    .map((g) => g.coverageTypeLabel);

  const endorsementGaps = breakdown.coverageGaps
    .filter((g) => g.gapType === 'endorsement')
    .map((g) => g.coverageTypeLabel);

  const parts: string[] = [];
  if (missingCoverages.length > 0) {
    parts.push(`Obtain missing coverage: ${missingCoverages.join(', ')}`);
  }
  if (insufficientCoverages.length > 0) {
    parts.push(`Increase limits: ${insufficientCoverages.join(', ')}`);
  }
  if (endorsementGaps.length > 0) {
    parts.push(`Add endorsements: ${endorsementGaps.join(', ')}`);
  }

  return parts.join('. ') || 'Review compliance gaps';
}

// ============================================================================
// Main calculation
// ============================================================================

/**
 * Calculate risk quantification across all entities in an organization.
 *
 * Takes an array of entity compliance data (each entity with its compliance
 * results, extracted coverages, and template requirements) and produces a
 * comprehensive risk summary with dollar-value exposure gaps.
 */
export function quantifyRisk(
  entities: EntityComplianceData[]
): RiskQuantificationResult {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const perEntityBreakdown: EntityRiskBreakdown[] = [];
  const coverageTypeMap = new Map<string, CoverageTypeBreakdown>();
  let missingEndorsementCount = 0;

  // ---- Process each entity ----
  for (const entity of entities) {
    const coverageGaps: CoverageGap[] = [];
    let entityExposure = 0;
    let hasUnquantifiableRisk = false;

    // Build a lookup: requirement_id → requirement
    const requirementMap = new Map<string, TemplateCoverageRequirement>();
    for (const req of entity.requirements) {
      requirementMap.set(req.id, req);
    }

    // Evaluate each compliance result against its requirement
    for (const result of entity.complianceResults) {
      if (!result.coverage_requirement_id) continue;
      const requirement = requirementMap.get(result.coverage_requirement_id);
      if (!requirement) continue;

      const gap = calculateCoverageGap(requirement, result, entity.extractedCoverages);
      if (!gap) continue;

      coverageGaps.push(gap);

      if (gap.dollarGap != null) {
        entityExposure += gap.dollarGap;
      }
      if (gap.gapType === 'missing_unquantifiable') {
        hasUnquantifiableRisk = true;
      }

      // Aggregate into coverage type breakdown
      const key = gap.coverageType;
      if (!coverageTypeMap.has(key)) {
        coverageTypeMap.set(key, {
          coverageType: gap.coverageType,
          coverageTypeLabel: gap.coverageTypeLabel,
          entityCount: 0,
          totalExposure: 0,
          missingCount: 0,
          insufficientCount: 0,
          endorsementGapCount: 0,
        });
      }
      const ctBreakdown = coverageTypeMap.get(key)!;
      ctBreakdown.entityCount++;
      if (gap.dollarGap != null) ctBreakdown.totalExposure += gap.dollarGap;
      if (gap.gapType === 'missing' || gap.gapType === 'missing_unquantifiable') {
        ctBreakdown.missingCount++;
      }
      if (gap.gapType === 'insufficient') ctBreakdown.insufficientCount++;
      if (gap.gapType === 'endorsement') ctBreakdown.endorsementGapCount++;
    }

    // Track entities with endorsement gaps
    const hasEndorsementGap = coverageGaps.some((g) => g.gapType === 'endorsement');
    if (hasEndorsementGap) missingEndorsementCount++;

    const isExpired = entity.complianceStatus === 'expired';
    const earliestExpiration = getEarliestExpiration(entity.extractedCoverages);

    perEntityBreakdown.push({
      entityId: entity.entityId,
      entityName: entity.entityName,
      entityType: entity.entityType,
      complianceStatus: entity.complianceStatus,
      propertyId: entity.propertyId,
      propertyName: entity.propertyName,
      coverageGaps,
      totalExposure: entityExposure,
      hasUnquantifiableRisk,
      isExpired,
      earliestExpiration,
    });
  }

  // ---- Compute aggregates ----
  const entityCount = entities.length;
  const nonCompliantCount = perEntityBreakdown.filter(
    (e) => e.complianceStatus !== 'compliant'
  ).length;
  const expiredCount = perEntityBreakdown.filter((e) => e.isExpired).length;
  const compliantCount = entityCount - nonCompliantCount;
  const complianceRate = entityCount > 0
    ? Math.round((compliantCount / entityCount) * 10000) / 100
    : 100;

  const totalExposureGap = perEntityBreakdown.reduce(
    (sum, e) => sum + e.totalExposure,
    0
  );

  // ---- Expiration windows ----
  const expiringIn30Days = countExpiringWithinDays(perEntityBreakdown, 30, now);
  const expiringIn60Days = countExpiringWithinDays(perEntityBreakdown, 60, now);
  const expiringIn90Days = countExpiringWithinDays(perEntityBreakdown, 90, now);

  // ---- Coverage type breakdown sorted by total exposure (descending) ----
  const perCoverageTypeBreakdown = [...coverageTypeMap.values()].sort(
    (a, b) => b.totalExposure - a.totalExposure
  );

  // ---- Top 5 priority actions (highest exposure first, expired entities prioritized) ----
  const sortedEntities = [...perEntityBreakdown]
    .filter((e) => e.coverageGaps.length > 0 || e.isExpired)
    .sort((a, b) => {
      // Expired entities always come first
      if (a.isExpired && !b.isExpired) return -1;
      if (!a.isExpired && b.isExpired) return 1;
      // Then by total exposure descending
      if (b.totalExposure !== a.totalExposure) return b.totalExposure - a.totalExposure;
      // Then by unquantifiable risk
      if (a.hasUnquantifiableRisk && !b.hasUnquantifiableRisk) return -1;
      if (!a.hasUnquantifiableRisk && b.hasUnquantifiableRisk) return 1;
      return 0;
    });

  const topPriorityActions: PriorityAction[] = sortedEntities
    .slice(0, 5)
    .map((e) => ({
      entityId: e.entityId,
      entityName: e.entityName,
      entityType: e.entityType,
      propertyName: e.propertyName,
      totalExposure: e.totalExposure,
      hasUnquantifiableRisk: e.hasUnquantifiableRisk,
      isExpired: e.isExpired,
      action: buildActionString(e),
      topGaps: e.coverageGaps
        .sort((a, b) => (b.dollarGap ?? 0) - (a.dollarGap ?? 0))
        .slice(0, 3)
        .map((g) => g.gapDescription),
    }));

  return {
    totalExposureGap,
    entityCount,
    nonCompliantCount,
    expiredCount,
    expiringIn30Days,
    expiringIn60Days,
    expiringIn90Days,
    missingEndorsementCount,
    complianceRate,
    perEntityBreakdown,
    perCoverageTypeBreakdown,
    topPriorityActions,
  };
}
