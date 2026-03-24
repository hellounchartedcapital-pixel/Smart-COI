// ============================================================================
// SmartCOI — Coverage Type Utilities
//
// Handles display normalization (legacy snake_case → Title Case),
// fuzzy coverage matching for the compliance engine, and common
// coverage type suggestions for the template editor combobox.
// ============================================================================

// ============================================================================
// Legacy enum → display label mapping (backward compatibility)
// ============================================================================

/**
 * Maps old snake_case enum values to their canonical display labels.
 * Used to normalize existing database values stored before the freetext migration.
 */
const LEGACY_COVERAGE_MAP: Record<string, string> = {
  general_liability: 'General Liability',
  automobile_liability: 'Automobile Liability',
  workers_compensation: "Workers' Compensation",
  employers_liability: "Employers' Liability",
  umbrella_excess_liability: 'Umbrella / Excess Liability',
  professional_liability_eo: 'Professional Liability (E&O)',
  property_inland_marine: 'Property / Inland Marine',
  pollution_liability: 'Pollution Liability',
  liquor_liability: 'Liquor Liability',
  cyber_liability: 'Cyber Liability',
  fire_legal_liability: 'Fire Legal Liability',
  business_income: 'Business Income / Extra Expense',
};

/**
 * Legacy short labels for compact display (e.g., template summaries).
 */
const LEGACY_SHORT_LABELS: Record<string, string> = {
  general_liability: 'GL',
  automobile_liability: 'Auto',
  workers_compensation: 'WC',
  employers_liability: 'EL',
  umbrella_excess_liability: 'Umbrella',
  professional_liability_eo: 'E&O',
  property_inland_marine: 'Property',
  pollution_liability: 'Pollution',
  liquor_liability: 'Liquor',
  cyber_liability: 'Cyber',
  fire_legal_liability: 'Fire Legal',
  business_income: 'Biz Income',
};

// ============================================================================
// Display normalization
// ============================================================================

/**
 * Returns a clean display label for any coverage_type value.
 * - Legacy snake_case values are mapped to their known labels.
 * - Freetext values pass through as-is.
 * - Unknown snake_case-looking values are converted to Title Case.
 */
export function formatCoverageType(coverageType: string): string {
  // Check legacy map first
  if (LEGACY_COVERAGE_MAP[coverageType]) {
    return LEGACY_COVERAGE_MAP[coverageType];
  }
  // If it looks like a snake_case token, convert to Title Case
  if (coverageType.includes('_')) {
    return coverageType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }
  // Otherwise return as-is (freetext value)
  return coverageType;
}

/**
 * Returns a short abbreviation for compact display.
 * Falls back to the full display label if no short label exists.
 */
export function formatCoverageTypeShort(coverageType: string): string {
  return LEGACY_SHORT_LABELS[coverageType] ?? formatCoverageType(coverageType);
}

// ============================================================================
// Common coverage type suggestions for the template editor combobox
// ============================================================================

/**
 * Well-known coverage types shown as suggestions in the combobox.
 * Users can also type any freetext value.
 */
export const COMMON_COVERAGE_TYPES: string[] = [
  'General Liability',
  'Automobile Liability',
  "Workers' Compensation",
  "Employers' Liability",
  'Umbrella / Excess Liability',
  'Professional Liability (E&O)',
  'Property / Inland Marine',
  'Pollution Liability',
  'Liquor Liability',
  'Cyber Liability',
  'Fire Legal Liability',
  'Business Income / Extra Expense',
  "Builder's Risk",
  "Tenant's Legal Liability",
  'Commercial Property',
  'Inland Marine',
  'Equipment Breakdown',
  'Crime / Fidelity',
  'Directors & Officers (D&O)',
  'Employment Practices Liability (EPLI)',
  'Medical Malpractice',
  'Product Liability',
  'Marine Liability',
  'Aircraft Liability',
  'Garage Liability',
];

// ============================================================================
// Coverage type fuzzy matching for the compliance engine
// ============================================================================

/**
 * Normalize a coverage type string for comparison:
 * lowercase, strip punctuation, expand common abbreviations.
 */
export function normalizeCoverageType(coverageType: string): string {
  // First, resolve legacy snake_case to canonical label
  let normalized = LEGACY_COVERAGE_MAP[coverageType] ?? coverageType;

  normalized = normalized
    .toLowerCase()
    .replace(/['']/g, '') // smart quotes
    .replace(/[.,;:!?()\/\-&]/g, ' ') // punctuation → spaces
    .replace(/\s+/g, ' ')
    .trim();

  return normalized;
}

/**
 * Expand common insurance abbreviations for matching.
 */
function expandAbbreviations(text: string): string {
  const expansions: [RegExp, string][] = [
    [/\bcgl\b/, 'commercial general liability'],
    [/\bgl\b/, 'general liability'],
    [/\bwc\b/, 'workers compensation'],
    [/\bel\b/, 'employers liability'],
    [/\be ?& ?o\b/, 'errors and omissions'],
    [/\bd ?& ?o\b/, 'directors and officers'],
    [/\bepli\b/, 'employment practices liability'],
    [/\bauto\b/, 'automobile'],
    [/\bbop\b/, 'business owners policy'],
    [/\bcsl\b/, 'combined single limit'],
  ];
  let result = text;
  for (const [pattern, replacement] of expansions) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Compute keyword overlap score between two normalized strings.
 * Returns a score from 0 to 1.
 */
function keywordOverlapScore(a: string, b: string): number {
  const aWords = new Set(a.split(' ').filter((w) => w.length > 1));
  const bWords = new Set(b.split(' ').filter((w) => w.length > 1));
  if (aWords.size === 0 || bWords.size === 0) return 0;

  let matches = 0;
  for (const w of aWords) {
    if (bWords.has(w)) matches++;
  }

  // Use the smaller set as denominator so "Business Income" matches
  // "Business Income / Extra Expense"
  const minSize = Math.min(aWords.size, bWords.size);
  return matches / minSize;
}

/**
 * Check if two coverage type strings refer to the same coverage.
 *
 * First pass: normalized string comparison (handles case, punctuation, legacy values).
 * Second pass: abbreviation expansion + keyword overlap for semantic similarity.
 *
 * Returns a match score: 1.0 = exact, 0.7-0.99 = fuzzy match, 0 = no match.
 * A threshold of 0.7 is recommended for compliance matching.
 */
export function coverageTypeMatchScore(
  requirement: string,
  extracted: string
): number {
  // Exact string match
  if (requirement === extracted) return 1.0;

  // Normalize both
  const reqNorm = normalizeCoverageType(requirement);
  const extNorm = normalizeCoverageType(extracted);

  // Normalized exact match
  if (reqNorm === extNorm) return 1.0;

  // Substring containment (e.g., "general liability" in "commercial general liability")
  if (reqNorm.includes(extNorm) || extNorm.includes(reqNorm)) return 0.95;

  // Expand abbreviations and compare
  const reqExpanded = expandAbbreviations(reqNorm);
  const extExpanded = expandAbbreviations(extNorm);

  if (reqExpanded === extExpanded) return 0.95;
  if (reqExpanded.includes(extExpanded) || extExpanded.includes(reqExpanded)) return 0.9;

  // Keyword overlap
  const overlap = keywordOverlapScore(reqExpanded, extExpanded);
  if (overlap >= 0.8) return 0.85;
  if (overlap >= 0.6) return 0.75;

  return 0;
}

/**
 * Find the best matching extracted coverage for a given requirement coverage type.
 * Returns the index of the best match and the match score, or null if no match found.
 */
export function findBestCoverageMatch(
  requirementType: string,
  extractedTypes: string[],
  threshold = 0.7
): { index: number; score: number } | null {
  let bestIndex = -1;
  let bestScore = 0;

  for (let i = 0; i < extractedTypes.length; i++) {
    const score = coverageTypeMatchScore(requirementType, extractedTypes[i]);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  if (bestIndex >= 0 && bestScore >= threshold) {
    return { index: bestIndex, score: bestScore };
  }

  return null;
}
