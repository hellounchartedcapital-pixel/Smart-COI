// ============================================================================
// SmartCOI — Inline Compliance Evaluation
//
// Shared utility for evaluating compliance requirements against extracted
// coverages. Used by both the report API and the dashboard to ensure
// consistent compliance status derivation.
//
// This evaluates compliance INLINE instead of relying on stale DB fields
// or compliance_results that may reference old template requirement IDs.
// ============================================================================

import { formatCoverageType, findBestCoverageMatch } from '@/lib/coverage-utils';
import type {
  ExtractedCoverage,
  TemplateCoverageRequirement,
  ComplianceStatus,
} from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface EvaluatedRequirement {
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

export interface EntityComplianceEvaluation {
  complianceStatus: ComplianceStatus;
  evaluatedRequirements: EvaluatedRequirement[];
  totalExposure: number;
  gapCount: number;
  gapDescriptions: string[];
  isExpired: boolean;
  isPartiallyExpired: boolean;
  isExpiringSoon: boolean;
  expiredCoverageTypes: string[];
}

// ============================================================================
// Evaluate a single requirement against extracted coverages
// ============================================================================

export function evaluateRequirement(
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
      dollarGap: null,
    };
  }

  return { ...base, status: 'met', gapDescription: null, dollarGap: null };
}

// ============================================================================
// Evaluate full compliance status for an entity
// ============================================================================

/**
 * Evaluates an entity's compliance status by comparing its template
 * requirements against extracted coverages. Returns the derived status,
 * evaluated requirements, exposure, and gap details.
 *
 * Use this instead of reading the stale `entities.compliance_status` DB field.
 */
export function evaluateEntityCompliance(
  templateRequirements: TemplateCoverageRequirement[],
  extractedCoverages: ExtractedCoverage[],
): EntityComplianceEvaluation {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Check expiration status
  const expiredCoverageTypes: string[] = [];
  let activeCoverageCount = 0;
  for (const cov of extractedCoverages) {
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
  const isExpired = hasExpired && activeCoverageCount === 0 && extractedCoverages.length > 0;
  const isPartiallyExpired = hasExpired && activeCoverageCount > 0;

  // Check if expiring within 30 days
  const threshold30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const isExpiringSoon = extractedCoverages.some((c) => {
    if (!c.expiration_date) return false;
    const exp = new Date(c.expiration_date + 'T00:00:00');
    return exp >= now && exp <= threshold30d;
  });

  // Evaluate each requirement
  const evaluatedRequirements = templateRequirements.map((req) =>
    evaluateRequirement(req, extractedCoverages)
  );

  // Compute gaps
  let totalExposure = 0;
  let gapCount = 0;
  const gapDescriptions: string[] = [];

  for (const req of evaluatedRequirements) {
    if (req.status === 'met' || req.status === 'not_required') continue;
    gapCount++;
    if (req.gapDescription) gapDescriptions.push(req.gapDescription);
    if (req.dollarGap != null && req.dollarGap > 0) totalExposure += req.dollarGap;
  }

  // Derive compliance status
  let complianceStatus: ComplianceStatus;

  if (templateRequirements.length === 0) {
    complianceStatus = 'needs_setup';
  } else if (isExpired) {
    complianceStatus = 'expired';
  } else if (gapCount > 0 || isPartiallyExpired) {
    complianceStatus = 'non_compliant';
  } else if (isExpiringSoon) {
    complianceStatus = 'expiring_soon';
  } else {
    complianceStatus = 'compliant';
  }

  return {
    complianceStatus,
    evaluatedRequirements,
    totalExposure,
    gapCount,
    gapDescriptions,
    isExpired,
    isPartiallyExpired,
    isExpiringSoon,
    expiredCoverageTypes,
  };
}
