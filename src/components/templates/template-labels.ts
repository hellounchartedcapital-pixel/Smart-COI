import type { LimitType, RiskLevel } from '@/types';
import {
  formatCoverageType,
  formatCoverageTypeShort,
  COMMON_COVERAGE_TYPES,
} from '@/lib/coverage-utils';

// Re-export coverage display utilities so existing imports keep working
export { formatCoverageType, formatCoverageTypeShort, COMMON_COVERAGE_TYPES };

/**
 * Dynamic coverage label lookup.
 * Accepts any coverage_type string and returns a display label.
 * Backward-compatible: legacy snake_case values are mapped to their known labels.
 *
 * This replaces the old `COVERAGE_LABELS: Record<CoverageType, string>` map.
 * Usage: `getCoverageLabel(req.coverage_type)` instead of `COVERAGE_LABELS[req.coverage_type]`
 */
export function getCoverageLabel(coverageType: string): string {
  return formatCoverageType(coverageType);
}

/**
 * Short label for compact views (e.g., "GL", "WC", "Auto").
 */
export function getCoverageShortLabel(coverageType: string): string {
  return formatCoverageTypeShort(coverageType);
}

/**
 * @deprecated Use getCoverageLabel() for new code. Kept as a Proxy for backward
 * compatibility — any string key returns a display label via formatCoverageType.
 */
export const COVERAGE_LABELS: Record<string, string> = new Proxy(
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

/**
 * @deprecated Use getCoverageShortLabel() for new code.
 */
export const COVERAGE_SHORT_LABELS: Record<string, string> = new Proxy(
  {} as Record<string, string>,
  {
    get(_target, prop: string) {
      return formatCoverageTypeShort(prop);
    },
    has() {
      return true;
    },
  }
);

export const LIMIT_TYPE_LABELS: Record<LimitType, string> = {
  per_occurrence: 'Per Occurrence',
  aggregate: 'Aggregate',
  combined_single_limit: 'Combined Single Limit',
  statutory: 'Statutory',
  per_person: 'Per Person',
  per_accident: 'Per Accident',
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  standard: 'Standard',
  high_risk: 'High Risk',
  professional_services: 'Professional Services',
  restaurant: 'Restaurant',
  industrial: 'Industrial',
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  standard: 'bg-emerald-100 text-emerald-800',
  high_risk: 'bg-red-100 text-red-800',
  professional_services: 'bg-blue-100 text-blue-800',
  restaurant: 'bg-amber-100 text-amber-800',
  industrial: 'bg-orange-100 text-orange-800',
};

/**
 * @deprecated Use COMMON_COVERAGE_TYPES from coverage-utils.ts instead.
 * Kept for backward compatibility — returns the common suggestion list.
 */
export const ALL_COVERAGE_TYPES: string[] = COMMON_COVERAGE_TYPES;

export const ALL_LIMIT_TYPES: LimitType[] = [
  'per_occurrence',
  'aggregate',
  'combined_single_limit',
  'statutory',
  'per_person',
  'per_accident',
];

export const ALL_RISK_LEVELS: RiskLevel[] = [
  'standard',
  'high_risk',
  'professional_services',
  'restaurant',
  'industrial',
];

export function formatLimit(amount: number | null, limitType: LimitType | null): string {
  if (limitType === 'statutory') return 'Statutory';
  if (amount == null) return '—';
  if (amount >= 1_000_000) return `$${amount / 1_000_000}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}
