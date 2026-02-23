/**
 * Entity name fuzzy matching utilities for bulk COI uploads.
 *
 * Used to match insured names from extracted COI data against existing
 * vendors/tenants and to deduplicate entries within a batch.
 */

// ============================================================================
// Name normalization
// ============================================================================

/**
 * Normalize an entity name for comparison by lowercasing, stripping
 * punctuation, and removing common legal suffixes.
 */
export function normalizeEntityName(name: string): string {
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
    .replace(/\bltd\.?\b/g, '')
    .replace(/\bco\b/g, '')
    .replace(/\bcompany\b/g, '')
    .replace(/\bl\.?p\.?\b/g, '')
    .replace(/\bd\.?b\.?a\.?\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// Matching
// ============================================================================

export interface MatchResult {
  matched: boolean;
  exact: boolean;
  score: number; // 0-1, higher = better match
}

/**
 * Compare two entity names with multi-level fuzzy matching:
 * 1. Exact case-insensitive → score 1.0
 * 2. Normalized exact match → score 0.95
 * 3. Substring containment  → score 0.8
 * 4. Word-based containment → score 0.7
 */
export function compareNames(a: string, b: string): MatchResult {
  // 1. Exact case-insensitive
  if (a.toLowerCase().trim() === b.toLowerCase().trim()) {
    return { matched: true, exact: true, score: 1.0 };
  }

  const aNorm = normalizeEntityName(a);
  const bNorm = normalizeEntityName(b);

  // 2. Normalized exact match
  if (aNorm === bNorm) {
    return { matched: true, exact: false, score: 0.95 };
  }

  // 3. Substring containment in both directions
  if (aNorm.includes(bNorm) || bNorm.includes(aNorm)) {
    return { matched: true, exact: false, score: 0.8 };
  }

  // 4. Word-based containment: all significant words (len > 1) from the
  //    shorter name appear in the longer name
  const aWords = aNorm.split(' ').filter((w) => w.length > 1);
  const bWords = bNorm.split(' ').filter((w) => w.length > 1);

  if (aWords.length >= 2 && bWords.length >= 2) {
    const [shorter, longer] =
      aWords.length <= bWords.length ? [aWords, bNorm] : [bWords, aNorm];
    const allFound = shorter.every((w) => longer.includes(w));
    if (allFound) {
      return { matched: true, exact: false, score: 0.7 };
    }
  }

  return { matched: false, exact: false, score: 0 };
}

// ============================================================================
// Find best match
// ============================================================================

export interface ExistingEntity {
  id: string;
  company_name: string;
  type: 'vendor' | 'tenant';
  property_id: string | null;
}

export interface BestMatchResult {
  entity: ExistingEntity;
  score: number;
  exact: boolean;
}

/**
 * Find the best match for an insured name among existing entities.
 * Optionally filter by property. Returns null if no match found.
 */
export function findBestMatch(
  insuredName: string,
  existingEntities: ExistingEntity[],
  propertyId?: string | null
): BestMatchResult | null {
  let best: BestMatchResult | null = null;

  for (const entity of existingEntities) {
    // If propertyId specified, prefer same-property matches
    if (propertyId && entity.property_id && entity.property_id !== propertyId) {
      continue;
    }

    const result = compareNames(insuredName, entity.company_name);
    if (!result.matched) continue;

    if (!best || result.score > best.score) {
      best = { entity, score: result.score, exact: result.exact };
      if (result.score === 1.0) break; // perfect match, no need to continue
    }
  }

  // If property filter produced no results, try without it
  if (!best && propertyId) {
    return findBestMatch(insuredName, existingEntities);
  }

  return best;
}

// ============================================================================
// Batch deduplication
// ============================================================================

export interface BatchEntry {
  index: number;
  insuredName: string;
  fileName: string;
}

export interface DeduplicatedGroup {
  /** Canonical name for the group (first entry's insured name) */
  canonicalName: string;
  /** All entries in this group */
  entries: BatchEntry[];
}

/**
 * Group batch entries by insured name similarity. Entries with matching
 * names (fuzzy) are grouped together. Within each group, the first entry
 * is the "canonical" one.
 */
export function deduplicateExtractions(entries: BatchEntry[]): DeduplicatedGroup[] {
  const groups: DeduplicatedGroup[] = [];

  for (const entry of entries) {
    if (!entry.insuredName) {
      // Entries without insured name go into their own group
      // Use filename without extension as fallback name
      groups.push({
        canonicalName: entry.fileName.replace(/\.pdf$/i, ''),
        entries: [entry],
      });
      continue;
    }

    // Try to find an existing group that matches
    let matched = false;
    for (const group of groups) {
      const result = compareNames(entry.insuredName, group.canonicalName);
      if (result.matched && result.score >= 0.7) {
        group.entries.push(entry);
        matched = true;
        break;
      }
    }

    if (!matched) {
      groups.push({
        canonicalName: entry.insuredName,
        entries: [entry],
      });
    }
  }

  return groups;
}
