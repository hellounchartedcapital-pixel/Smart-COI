import type { Industry, LimitType } from '@/types';
import type { DefaultTemplateRequirement } from './industry-templates';

// ============================================================================
// Vendor Type Definitions
// ============================================================================

export const VENDOR_TYPES = [
  'plumber',
  'electrician',
  'hvac',
  'landscaper',
  'general_contractor',
  'roofing',
  'painting',
  'cleaning_janitorial',
  'fire_protection',
  'elevator',
  'security',
  'pest_control',
  'other',
] as const;

export type VendorType = (typeof VENDOR_TYPES)[number];

export const VENDOR_TYPE_LABELS: Record<VendorType, string> = {
  plumber: 'Plumber',
  electrician: 'Electrician',
  hvac: 'HVAC',
  landscaper: 'Landscaper',
  general_contractor: 'General Contractor',
  roofing: 'Roofing',
  painting: 'Painting',
  cleaning_janitorial: 'Cleaning / Janitorial',
  fire_protection: 'Fire Protection',
  elevator: 'Elevator',
  security: 'Security',
  pest_control: 'Pest Control',
  other: 'Other',
};

// ============================================================================
// Recommended Requirements Mapping
//
// Given an industry + vendor type, returns the recommended coverage types
// and minimum limits. Property management is fully built out; other
// industries fall back to general_contractor defaults for now.
// ============================================================================

function req(
  coverage_type: string,
  limit: number | null,
  limit_type: LimitType,
  opts?: { ai?: boolean; wos?: boolean },
): DefaultTemplateRequirement {
  return {
    coverage_type,
    is_required: true,
    minimum_limit: limit,
    limit_type,
    requires_additional_insured: opts?.ai ?? false,
    requires_waiver_of_subrogation: opts?.wos ?? false,
  };
}

// ---------------------------------------------------------------------------
// Base requirement sets (building blocks)
// ---------------------------------------------------------------------------

const BASE_GL_STANDARD: DefaultTemplateRequirement[] = [
  req('Commercial General Liability', 1_000_000, 'per_occurrence', { ai: true, wos: true }),
  req('Commercial General Liability', 2_000_000, 'aggregate'),
];

const BASE_GL_HIGH: DefaultTemplateRequirement[] = [
  req('Commercial General Liability', 2_000_000, 'per_occurrence', { ai: true, wos: true }),
  req('Commercial General Liability', 4_000_000, 'aggregate'),
];

const BASE_AUTO: DefaultTemplateRequirement[] = [
  req('Automobile Liability', 1_000_000, 'combined_single_limit', { ai: true }),
];

const BASE_WC: DefaultTemplateRequirement[] = [
  req("Workers' Compensation", null, 'statutory', { wos: true }),
];

const BASE_UMBRELLA_1M: DefaultTemplateRequirement[] = [
  req('Umbrella / Excess Liability', 1_000_000, 'per_occurrence'),
];

const BASE_UMBRELLA_5M: DefaultTemplateRequirement[] = [
  req('Umbrella / Excess Liability', 5_000_000, 'per_occurrence'),
];

// ---------------------------------------------------------------------------
// Property Management vendor requirements by vendor type
// ---------------------------------------------------------------------------

const PM_REQUIREMENTS: Record<VendorType, DefaultTemplateRequirement[]> = {
  plumber: [
    ...BASE_GL_STANDARD,
    ...BASE_AUTO,
    ...BASE_WC,
    ...BASE_UMBRELLA_1M,
  ],

  electrician: [
    ...BASE_GL_HIGH,
    ...BASE_AUTO,
    ...BASE_WC,
    ...BASE_UMBRELLA_5M,
  ],

  hvac: [
    ...BASE_GL_STANDARD,
    ...BASE_AUTO,
    ...BASE_WC,
    ...BASE_UMBRELLA_1M,
  ],

  landscaper: [
    ...BASE_GL_STANDARD,
    ...BASE_AUTO,
    ...BASE_WC,
  ],

  general_contractor: [
    ...BASE_GL_HIGH,
    ...BASE_AUTO,
    ...BASE_WC,
    ...BASE_UMBRELLA_5M,
    req('Professional Liability (E&O)', 1_000_000, 'per_occurrence'),
  ],

  roofing: [
    ...BASE_GL_HIGH,
    ...BASE_AUTO,
    ...BASE_WC,
    ...BASE_UMBRELLA_5M,
  ],

  painting: [
    ...BASE_GL_STANDARD,
    ...BASE_AUTO,
    ...BASE_WC,
    ...BASE_UMBRELLA_1M,
  ],

  cleaning_janitorial: [
    ...BASE_GL_STANDARD,
    ...BASE_AUTO,
    ...BASE_WC,
  ],

  fire_protection: [
    ...BASE_GL_HIGH,
    ...BASE_AUTO,
    ...BASE_WC,
    ...BASE_UMBRELLA_5M,
    req('Professional Liability (E&O)', 1_000_000, 'per_occurrence'),
  ],

  elevator: [
    ...BASE_GL_HIGH,
    ...BASE_AUTO,
    ...BASE_WC,
    ...BASE_UMBRELLA_5M,
    req('Professional Liability (E&O)', 1_000_000, 'per_occurrence'),
  ],

  security: [
    ...BASE_GL_STANDARD,
    ...BASE_AUTO,
    ...BASE_WC,
    ...BASE_UMBRELLA_1M,
    req('Professional Liability (E&O)', 1_000_000, 'per_occurrence'),
  ],

  pest_control: [
    ...BASE_GL_STANDARD,
    ...BASE_AUTO,
    ...BASE_WC,
    req('Pollution Liability', 1_000_000, 'per_occurrence'),
  ],

  other: [
    ...BASE_GL_STANDARD,
    ...BASE_AUTO,
    ...BASE_WC,
    ...BASE_UMBRELLA_1M,
  ],
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get recommended coverage requirements for a given industry and vendor type.
 *
 * Currently only property_management has vendor-type-specific requirements.
 * All other industries fall back to the general_contractor defaults.
 *
 * @param industry - Organization industry (stub: defaults to property_management)
 * @param vendorType - Inferred or user-provided vendor type
 */
export function getRecommendedRequirements(
  industry: Industry | null,
  vendorType: VendorType | string,
): DefaultTemplateRequirement[] {
  const vt = VENDOR_TYPES.includes(vendorType as VendorType)
    ? (vendorType as VendorType)
    : 'other';

  // For property_management, use the specific vendor type mapping
  if (industry === 'property_management') {
    return PM_REQUIREMENTS[vt];
  }

  // All other industries: use general_contractor defaults for now
  // (industry-specific mappings will be added in Phase 2)
  return PM_REQUIREMENTS[vt] ?? PM_REQUIREMENTS.general_contractor;
}

/**
 * Check if a vendor type string is a valid VendorType.
 */
export function isValidVendorType(value: string): value is VendorType {
  return VENDOR_TYPES.includes(value as VendorType);
}
