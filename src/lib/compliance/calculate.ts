// ============================================================================
// SmartCOI — Compliance Calculation Engine
//
// Takes extracted coverages/entities + template requirements + property entities
// and produces compliance_results, entity_compliance_results, and an overall
// compliance status. Used both for real-time preview and for final persistence.
// ============================================================================

import { formatCurrency } from '@/lib/utils';
import { formatCoverageType, coverageTypeMatchScore } from '@/lib/coverage-utils';
import type {
  LimitType,
  ComplianceStatus,
  ComplianceResultStatus,
  EntityComplianceStatus,
  EndorsementRecord,
} from '@/types';

// ============================================================================
// Input / output types
// ============================================================================

export interface CoverageInput {
  id?: string; // existing extracted_coverage id (if saved)
  coverage_type: string; // freetext coverage name
  carrier_name: string | null;
  policy_number: string | null;
  limit_amount: number | null;
  limit_type: LimitType | null;
  effective_date: string | null;
  expiration_date: string | null;
  additional_insured_listed: boolean;
  waiver_of_subrogation: boolean;
}

export interface EntityInput {
  id?: string;
  entity_name: string;
  entity_address: string | null;
  entity_type: 'certificate_holder' | 'additional_insured';
}

export interface RequirementInput {
  id: string; // template_coverage_requirements.id
  coverage_type: string; // freetext coverage name
  is_required: boolean;
  minimum_limit: number | null;
  limit_type: LimitType | null;
  requires_additional_insured: boolean;
  requires_waiver_of_subrogation: boolean;
  requires_primary_noncontributory?: boolean;
}

export interface PropertyEntityInput {
  id: string; // property_entities.id
  entity_name: string;
  entity_address: string | null;
  entity_type: 'certificate_holder' | 'additional_insured';
}

export interface CoverageResultRow {
  coverage_requirement_id: string;
  extracted_coverage_id: string | null;
  status: ComplianceResultStatus;
  gap_description: string | null;
}

export interface EntityResultRow {
  property_entity_id: string;
  extracted_entity_id: string | null;
  status: EntityComplianceStatus;
  match_details: string | null;
}

export interface ComplianceCalculationResult {
  coverageResults: CoverageResultRow[];
  entityResults: EntityResultRow[];
  overallStatus: ComplianceStatus;
}

// ============================================================================
// Display helpers
// ============================================================================

/**
 * Dynamic coverage label lookup — works with any coverage_type string.
 * Backward-compatible: legacy snake_case values are normalized to Title Case.
 */
const COVERAGE_LABELS: Record<string, string> = new Proxy(
  {} as Record<string, string>,
  {
    get(_target, prop: string) {
      return formatCoverageType(prop);
    },
    has() {
      return true;
    },
  }
);

const LIMIT_TYPE_LABELS: Record<LimitType, string> = {
  per_occurrence: 'Per Occurrence',
  aggregate: 'Aggregate',
  combined_single_limit: 'Combined Single Limit',
  statutory: 'Statutory',
  per_person: 'Per Person',
  per_accident: 'Per Accident',
};

export { COVERAGE_LABELS, LIMIT_TYPE_LABELS };

// ---- Expiration summary consolidation ----
// Produces a compact 1-3 line summary of expired coverages, deduplicating
// coverage types and grouping by expiration date.

export interface ExpiredCoverageSummary {
  /** True when every coverage on the cert shares the same expiration date */
  allSameDate: boolean;
  /** Single-date message when allSameDate is true */
  singleLine: string | null;
  /** Grouped lines: "GL, Auto — expired Feb 1, 2026" */
  groupedLines: { types: string; date: string }[];
  /** Total number of expired coverages (pre-dedup) */
  expiredCount: number;
  /** Total number of coverages on the certificate */
  totalCount: number;
}

export function summarizeExpiredCoverages(
  coverages: { coverage_type: string; expiration_date?: string | null }[],
  formatDateFn: (d: string) => string = (d) => d
): ExpiredCoverageSummary {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const expired = coverages.filter(
    (c) => c.expiration_date && new Date(c.expiration_date + 'T00:00:00') < now
  );

  if (expired.length === 0) {
    return { allSameDate: false, singleLine: null, groupedLines: [], expiredCount: 0, totalCount: coverages.length };
  }

  // Group by date, dedup coverage types within each group
  const byDate = new Map<string, Set<string>>();
  for (const c of expired) {
    const date = c.expiration_date!;
    if (!byDate.has(date)) byDate.set(date, new Set());
    const label = formatCoverageType(c.coverage_type);
    byDate.get(date)!.add(label);
  }

  const allSameDate = byDate.size === 1 && expired.length === coverages.length;

  if (allSameDate) {
    const [date] = [...byDate.keys()];
    return {
      allSameDate: true,
      singleLine: `All coverages on this certificate expired on ${formatDateFn(date)}`,
      groupedLines: [],
      expiredCount: expired.length,
      totalCount: coverages.length,
    };
  }

  const groupedLines = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, types]) => ({
      types: [...types].join(', '),
      date: formatDateFn(date),
    }));

  return { allSameDate: false, singleLine: null, groupedLines, expiredCount: expired.length, totalCount: coverages.length };
}

function fmtCov(type: string, limitType: LimitType | null): string {
  const base = formatCoverageType(type);
  if (limitType && limitType !== 'statutory') {
    return `${base} (${LIMIT_TYPE_LABELS[limitType] ?? limitType})`;
  }
  return base;
}

function fmtLimit(amount: number | null): string {
  if (amount == null) return 'N/A';
  return formatCurrency(amount);
}

// ============================================================================
// Entity name fuzzy matching
// ============================================================================

function normalizeEntityName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.,;:'"!?()]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\bl\.?l\.?c\.?\b/g, '')
    .replace(/\blimited liability company\b/g, '')
    .replace(/\binc\.?\b/g, '')
    .replace(/\bincorporated\b/g, '')
    .replace(/\bcorp\.?\b/g, '')
    .replace(/\bcorporation\b/g, '')
    .replace(/\blimited\b/g, '')
    .replace(/\bco\b/g, '')
    .replace(/\bcompany\b/g, '')
    .replace(/\bl\.?p\.?\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Improved entity matching: handles cases where a COI lists multiple entities
 * together in one certificate holder block (e.g., "ABC Management, Alturas
 * Stanford LLC, 123 Main St, Boise ID"). Checks substring containment in
 * both directions after normalization, with a word-boundary fallback using
 * the significant words from the required entity name, plus 80%+ word overlap.
 */
function entityNameMatches(
  required: string,
  actual: string
): { matched: boolean; exact: boolean; fuzzy: boolean } {
  // 1. Exact case-insensitive match
  if (required.toLowerCase().trim() === actual.toLowerCase().trim()) {
    return { matched: true, exact: true, fuzzy: false };
  }

  const rNorm = normalizeEntityName(required);
  const aNorm = normalizeEntityName(actual);

  // 2. Normalized exact match (only business suffix differences)
  if (rNorm === aNorm) {
    return { matched: true, exact: false, fuzzy: true };
  }

  // 3. Substring containment in both directions
  if (aNorm.includes(rNorm) || rNorm.includes(aNorm)) {
    return { matched: true, exact: false, fuzzy: true };
  }

  // 4. Word-based containment: check if all significant words from the
  //    required entity appear in the actual text (handles multi-entity blocks)
  const rWords = rNorm.split(' ').filter((w) => w.length > 1);
  const aWords = aNorm.split(' ').filter((w) => w.length > 1);
  if (rWords.length >= 2) {
    const allWordsFound = rWords.every((w) => aNorm.includes(w));
    if (allWordsFound) {
      return { matched: true, exact: false, fuzzy: true };
    }
  }

  // 5. 80%+ word overlap — check both directions
  if (rWords.length >= 2 && aWords.length >= 2) {
    const rInA = rWords.filter((w) => aWords.includes(w)).length;
    const aInR = aWords.filter((w) => rWords.includes(w)).length;
    const overlapR = rInA / rWords.length;
    const overlapA = aInR / aWords.length;
    if (overlapR >= 0.8 || overlapA >= 0.8) {
      return { matched: true, exact: false, fuzzy: true };
    }
  }

  return { matched: false, exact: false, fuzzy: false };
}

// ============================================================================
// Main calculation
// ============================================================================

export interface ComplianceOptions {
  expirationThresholdDays?: number;
  acceptCertHolderInAdditionalInsured?: boolean;
  /** Certificate-level endorsement data from Pass 2 (certificates.endorsement_data). */
  endorsementData?: EndorsementRecord[] | null;
}

export function calculateCompliance(
  coverages: CoverageInput[],
  entities: EntityInput[],
  requirements: RequirementInput[],
  propertyEntities: PropertyEntityInput[],
  expirationThresholdDaysOrOptions: number | ComplianceOptions = 30
): ComplianceCalculationResult {
  const options: ComplianceOptions = typeof expirationThresholdDaysOrOptions === 'number'
    ? { expirationThresholdDays: expirationThresholdDaysOrOptions }
    : expirationThresholdDaysOrOptions;
  const expirationThresholdDays = options.expirationThresholdDays ?? 30;
  const acceptCertHolderInAI = options.acceptCertHolderInAdditionalInsured ?? false;
  const endorsements = options.endorsementData ?? [];
  const coverageResults: CoverageResultRow[] = [];
  const entityResults: EntityResultRow[] = [];

  const now = new Date();
  const thresholdDate = new Date(
    now.getTime() + expirationThresholdDays * 24 * 60 * 60 * 1000
  );

  let hasExpired = false;
  let hasExpiringSoon = false;
  let hasGap = false;

  // ---- Check ALL coverages for expiration (not just requirement-matched ones) ----
  for (const cov of coverages) {
    if (cov.expiration_date) {
      const expDate = new Date(cov.expiration_date + 'T00:00:00');
      if (expDate < now) {
        hasExpired = true;
      } else if (expDate < thresholdDate) {
        hasExpiringSoon = true;
      }
    }
  }

  // ---- Coverage requirements ----
  for (const req of requirements) {
    // Find matching extracted coverage using fuzzy coverage type matching + limit_type
    const match = coverages.find((c) => {
      const typeScore = coverageTypeMatchScore(req.coverage_type, c.coverage_type);
      if (typeScore < 0.7) return false;
      return req.limit_type == null || c.limit_type === req.limit_type;
    });

    if (!match) {
      if (req.is_required) {
        coverageResults.push({
          coverage_requirement_id: req.id,
          extracted_coverage_id: null,
          status: 'missing',
          gap_description: `${fmtCov(req.coverage_type, req.limit_type)} is required but not found on certificate`,
        });
        hasGap = true;
      } else {
        coverageResults.push({
          coverage_requirement_id: req.id,
          extracted_coverage_id: null,
          status: 'not_required',
          gap_description: null,
        });
      }
      continue;
    }

    // Check limit
    let limitMet = true;
    let gapDesc: string | null = null;

    if (req.limit_type === 'statutory') {
      // Statutory — just needs to exist
      limitMet = true;
    } else if (req.minimum_limit != null && match.limit_amount != null) {
      if (match.limit_amount < req.minimum_limit) {
        limitMet = false;
        gapDesc = `${fmtCov(req.coverage_type, req.limit_type)} limit is ${fmtLimit(match.limit_amount)} but requirement is ${fmtLimit(req.minimum_limit)}`;
      }
    } else if (req.minimum_limit != null && match.limit_amount == null) {
      limitMet = false;
      gapDesc = `${fmtCov(req.coverage_type, req.limit_type)} limit could not be determined`;
    }

    // Check endorsements — use coverage-level flags (Pass 1) first, then fall
    // back to certificate-level endorsement_data (Pass 2) for verification.
    if (limitMet && req.requires_additional_insured && !match.additional_insured_listed) {
      // Pass 1 didn't detect AI — check Pass 2 endorsement pages for CG 20 10 / CG 20 37
      const hasAIEndorsement = endorsements.some(
        (e) => e.found && ['cg 20 10', 'cg 20 37', 'cg 20 26', 'additional insured'].some(
          (t) => e.type.toLowerCase().includes(t)
        )
      );
      if (!hasAIEndorsement) {
        limitMet = false;
        gapDesc = `${fmtCov(req.coverage_type, req.limit_type)} requires Additional Insured endorsement but it is not listed`;
      }
    }
    if (limitMet && req.requires_waiver_of_subrogation && !match.waiver_of_subrogation) {
      // Pass 1 didn't detect WoS — check Pass 2 endorsement pages
      const hasWoSEndorsement = endorsements.some(
        (e) => e.found && e.type.toLowerCase().includes('waiver of subrogation')
      );
      if (!hasWoSEndorsement) {
        limitMet = false;
        gapDesc = `${fmtCov(req.coverage_type, req.limit_type)} requires Waiver of Subrogation but it is not listed`;
      }
    }
    if (limitMet && req.requires_primary_noncontributory) {
      // Check Pass 2 endorsement pages for Primary & Non-Contributory
      const hasPNCEndorsement = endorsements.some(
        (e) => e.found && e.type.toLowerCase().includes('primary')
      );
      if (!hasPNCEndorsement) {
        limitMet = false;
        gapDesc = `${fmtCov(req.coverage_type, req.limit_type)} requires Primary & Non-Contributory endorsement but it is not listed`;
      }
    }

    if (limitMet) {
      coverageResults.push({
        coverage_requirement_id: req.id,
        extracted_coverage_id: match.id ?? null,
        status: 'met',
        gap_description: null,
      });
    } else {
      coverageResults.push({
        coverage_requirement_id: req.id,
        extracted_coverage_id: match.id ?? null,
        status: 'not_met',
        gap_description: gapDesc,
      });
      if (req.is_required) hasGap = true;
    }
  }

  // ---- Entity requirements ----
  // Search across extracted entities for each required property entity.
  // When acceptCertHolderInAI is true, certificate_holder requirements
  // also match against additional_insured entities (cross-type).
  for (const pe of propertyEntities) {
    let bestMatch: { entity: EntityInput; exact: boolean; fuzzy: boolean; sameType: boolean } | null = null;

    for (const candidate of entities) {
      const sameType = candidate.entity_type === pe.entity_type;

      // Determine if this candidate should be considered for this requirement
      const allowCrossType =
        sameType ||
        // Always search across all types (entities may appear in any field)
        // But for certificate_holder reqs, also allow additional_insured matches when toggle is on
        (acceptCertHolderInAI && pe.entity_type === 'certificate_holder' && candidate.entity_type === 'additional_insured') ||
        // Always allow cross-type search (same behavior as before)
        true;

      if (!allowCrossType) continue;

      const result = entityNameMatches(pe.entity_name, candidate.entity_name);
      if (!result.matched) continue;

      const isBetter =
        !bestMatch ||
        // Prefer same-type over cross-type
        (sameType && !bestMatch.sameType) ||
        // Within same preference tier, prefer exact over fuzzy
        (sameType === bestMatch.sameType && result.exact && !bestMatch.exact);

      if (isBetter) {
        bestMatch = { entity: candidate, exact: result.exact, fuzzy: result.fuzzy, sameType };
        if (result.exact && sameType) break; // best possible — stop early
      }
    }

    if (!bestMatch) {
      entityResults.push({
        property_entity_id: pe.id,
        extracted_entity_id: null,
        status: 'missing',
        match_details: null,
      });
      hasGap = true;
    } else {
      // Build a descriptive match_details string
      const locationLabel =
        bestMatch.entity.entity_type === 'certificate_holder'
          ? 'Certificate Holder'
          : 'Additional Insured';
      const crossType = !bestMatch.sameType;
      const fuzzy = bestMatch.fuzzy;

      let details: string | null = null;
      if (crossType && fuzzy) {
        details = `Found as ${locationLabel} (name variation: "${bestMatch.entity.entity_name}")`;
      } else if (crossType) {
        details = `Found as ${locationLabel}`;
      } else if (fuzzy) {
        details = `Matched "${bestMatch.entity.entity_name}" (name variation)`;
      }
      // If exact match + same type → details stays null (perfect match)

      entityResults.push({
        property_entity_id: pe.id,
        extracted_entity_id: bestMatch.entity.id ?? null,
        status: 'found',
        match_details: details,
      });
    }
  }

  // ---- Derive overall status ----
  // Expiration is the #1 priority — an expired certificate is the most critical
  // compliance issue and takes precedence over all other checks.
  let overallStatus: ComplianceStatus;
  if (hasExpired) {
    overallStatus = 'expired';
  } else if (hasGap) {
    overallStatus = 'non_compliant';
  } else if (hasExpiringSoon) {
    overallStatus = 'expiring_soon';
  } else {
    overallStatus = 'compliant';
  }

  return { coverageResults, entityResults, overallStatus };
}
