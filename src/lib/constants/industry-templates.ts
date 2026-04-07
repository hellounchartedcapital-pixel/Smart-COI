import type { Industry, LimitType } from '@/types';

// ============================================================================
// Industry-specific default compliance templates
//
// These are shown during onboarding instead of the DB system defaults.
// When a user selects a template, it gets created as an org-specific record.
// ============================================================================

export interface DefaultTemplateRequirement {
  coverage_type: string;
  is_required: boolean;
  minimum_limit: number | null;
  limit_type: LimitType;
  requires_additional_insured: boolean;
  requires_waiver_of_subrogation: boolean;
}

export interface DefaultTemplate {
  name: string;
  description: string;
  category: 'vendor' | 'tenant';
  risk_level: string;
  requirements: DefaultTemplateRequirement[];
}

// Helper to build a requirement row
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

// ============================================================================
// Template sets by industry
// ============================================================================

const PROPERTY_MANAGEMENT: DefaultTemplate[] = [
  {
    name: 'Standard Vendor',
    description: 'Standard insurance requirements for general vendors and contractors',
    category: 'vendor',
    risk_level: 'standard',
    requirements: [
      req('Commercial General Liability', 1_000_000, 'per_occurrence', { ai: true, wos: true }),
      req('Commercial General Liability', 2_000_000, 'aggregate'),
      req('Automobile Liability', 1_000_000, 'combined_single_limit', { ai: true }),
      req("Workers' Compensation", null, 'statutory', { wos: true }),
      req("Umbrella / Excess Liability", 1_000_000, 'per_occurrence'),
    ],
  },
  {
    name: 'High-Risk Vendor',
    description: 'Elevated requirements for high-risk vendors (construction, hazardous materials)',
    category: 'vendor',
    risk_level: 'high_risk',
    requirements: [
      req('Commercial General Liability', 2_000_000, 'per_occurrence', { ai: true, wos: true }),
      req('Commercial General Liability', 4_000_000, 'aggregate'),
      req('Automobile Liability', 1_000_000, 'combined_single_limit', { ai: true }),
      req("Workers' Compensation", null, 'statutory', { wos: true }),
      req("Umbrella / Excess Liability", 5_000_000, 'per_occurrence'),
      req('Professional Liability (E&O)', 1_000_000, 'per_occurrence'),
    ],
  },
  {
    name: 'Standard Commercial Tenant',
    description: 'Standard insurance requirements for office and commercial tenants',
    category: 'tenant',
    risk_level: 'standard',
    requirements: [
      req('Commercial General Liability', 1_000_000, 'per_occurrence', { ai: true }),
      req('Commercial General Liability', 2_000_000, 'aggregate'),
      req('Property / Inland Marine', 100_000, 'per_occurrence'),
      req("Workers' Compensation", null, 'statutory'),
    ],
  },
  {
    name: 'Restaurant / Food Service Tenant',
    description: 'Insurance requirements for restaurant and food service tenants',
    category: 'tenant',
    risk_level: 'restaurant',
    requirements: [
      req('Commercial General Liability', 1_000_000, 'per_occurrence', { ai: true }),
      req('Commercial General Liability', 2_000_000, 'aggregate'),
      req('Liquor Liability', 1_000_000, 'per_occurrence'),
      req('Property / Inland Marine', 250_000, 'per_occurrence'),
      req("Workers' Compensation", null, 'statutory'),
    ],
  },
];

const CONSTRUCTION: DefaultTemplate[] = [
  {
    name: 'Standard Subcontractor',
    description: 'Standard requirements for general subcontractors',
    category: 'vendor',
    risk_level: 'standard',
    requirements: [
      req('Commercial General Liability', 1_000_000, 'per_occurrence', { ai: true, wos: true }),
      req('Commercial General Liability', 2_000_000, 'aggregate'),
      req('Automobile Liability', 1_000_000, 'combined_single_limit', { ai: true }),
      req("Workers' Compensation", null, 'statutory', { wos: true }),
      req("Umbrella / Excess Liability", 2_000_000, 'per_occurrence'),
      req("Employers' Liability", 500_000, 'per_accident'),
    ],
  },
  {
    name: 'High-Risk Subcontractor',
    description: 'Elevated requirements for roofing, demolition, electrical, and similar trades',
    category: 'vendor',
    risk_level: 'high_risk',
    requirements: [
      req('Commercial General Liability', 2_000_000, 'per_occurrence', { ai: true, wos: true }),
      req('Commercial General Liability', 4_000_000, 'aggregate'),
      req('Automobile Liability', 1_000_000, 'combined_single_limit', { ai: true }),
      req("Workers' Compensation", null, 'statutory', { wos: true }),
      req("Umbrella / Excess Liability", 5_000_000, 'per_occurrence'),
      req("Employers' Liability", 1_000_000, 'per_accident'),
    ],
  },
  {
    name: 'Professional Services',
    description: 'Requirements for architects, engineers, and design professionals',
    category: 'vendor',
    risk_level: 'professional_services',
    requirements: [
      req('Commercial General Liability', 1_000_000, 'per_occurrence', { ai: true }),
      req('Commercial General Liability', 2_000_000, 'aggregate'),
      req('Professional Liability (E&O)', 2_000_000, 'per_occurrence'),
      req('Automobile Liability', 1_000_000, 'combined_single_limit'),
      req("Workers' Compensation", null, 'statutory'),
    ],
  },
  {
    name: 'Material Supplier',
    description: 'Requirements for material and equipment suppliers',
    category: 'vendor',
    risk_level: 'standard',
    requirements: [
      req('Commercial General Liability', 1_000_000, 'per_occurrence', { ai: true }),
      req('Commercial General Liability', 2_000_000, 'aggregate'),
      req('Automobile Liability', 1_000_000, 'combined_single_limit'),
      req('Product Liability', 1_000_000, 'per_occurrence'),
    ],
  },
];

const LOGISTICS: DefaultTemplate[] = [
  {
    name: 'Standard Carrier',
    description: 'Standard requirements for freight carriers and transportation providers',
    category: 'vendor',
    risk_level: 'standard',
    requirements: [
      req('Commercial General Liability', 1_000_000, 'per_occurrence', { ai: true }),
      req('Commercial General Liability', 2_000_000, 'aggregate'),
      req('Automobile Liability', 1_000_000, 'combined_single_limit', { ai: true }),
      req('Motor Truck Cargo', 100_000, 'per_occurrence'),
      req("Workers' Compensation", null, 'statutory'),
    ],
  },
  {
    name: 'High-Value Carrier',
    description: 'Elevated requirements for carriers transporting high-value goods',
    category: 'vendor',
    risk_level: 'high_risk',
    requirements: [
      req('Commercial General Liability', 1_000_000, 'per_occurrence', { ai: true }),
      req('Commercial General Liability', 2_000_000, 'aggregate'),
      req('Automobile Liability', 1_000_000, 'combined_single_limit', { ai: true }),
      req('Motor Truck Cargo', 500_000, 'per_occurrence'),
      req("Workers' Compensation", null, 'statutory'),
      req("Umbrella / Excess Liability", 5_000_000, 'per_occurrence'),
    ],
  },
  {
    name: 'Warehouse / Facility Vendor',
    description: 'Requirements for warehouse operators and facility service providers',
    category: 'vendor',
    risk_level: 'standard',
    requirements: [
      req('Commercial General Liability', 1_000_000, 'per_occurrence', { ai: true }),
      req('Commercial General Liability', 2_000_000, 'aggregate'),
      req('Automobile Liability', 1_000_000, 'combined_single_limit'),
      req("Workers' Compensation", null, 'statutory'),
      req('Property / Inland Marine', 500_000, 'per_occurrence'),
    ],
  },
];

const HEALTHCARE: DefaultTemplate[] = [
  {
    name: 'Standard Vendor',
    description: 'Standard requirements for facility vendors and service providers',
    category: 'vendor',
    risk_level: 'standard',
    requirements: [
      req('Commercial General Liability', 1_000_000, 'per_occurrence', { ai: true }),
      req('Commercial General Liability', 2_000_000, 'aggregate'),
      req('Automobile Liability', 1_000_000, 'combined_single_limit'),
      req("Workers' Compensation", null, 'statutory'),
      req('Professional Liability (E&O)', 1_000_000, 'per_occurrence'),
    ],
  },
  {
    name: 'Clinical Services',
    description: 'Requirements for clinical and patient-facing service providers',
    category: 'vendor',
    risk_level: 'high_risk',
    requirements: [
      req('Commercial General Liability', 1_000_000, 'per_occurrence', { ai: true }),
      req('Commercial General Liability', 2_000_000, 'aggregate'),
      req('Professional Liability (E&O)', 3_000_000, 'per_occurrence'),
      req('Medical Malpractice', 1_000_000, 'per_occurrence'),
      req("Workers' Compensation", null, 'statutory'),
      req('Cyber Liability', 1_000_000, 'per_occurrence'),
    ],
  },
  {
    name: 'Facility Services',
    description: 'Requirements for cleaning, maintenance, and facility support vendors',
    category: 'vendor',
    risk_level: 'standard',
    requirements: [
      req('Commercial General Liability', 1_000_000, 'per_occurrence', { ai: true }),
      req('Commercial General Liability', 2_000_000, 'aggregate'),
      req('Automobile Liability', 1_000_000, 'combined_single_limit'),
      req("Workers' Compensation", null, 'statutory'),
    ],
  },
];

const MANUFACTURING: DefaultTemplate[] = [
  {
    name: 'Standard Supplier',
    description: 'Standard requirements for material suppliers and contractors',
    category: 'vendor',
    risk_level: 'standard',
    requirements: [
      req('Commercial General Liability', 1_000_000, 'per_occurrence', { ai: true }),
      req('Commercial General Liability', 2_000_000, 'aggregate'),
      req('Automobile Liability', 1_000_000, 'combined_single_limit'),
      req("Workers' Compensation", null, 'statutory'),
      req('Product Liability', 1_000_000, 'per_occurrence'),
    ],
  },
  {
    name: 'High-Risk Supplier',
    description: 'Elevated requirements for chemicals, heavy equipment, and hazardous materials suppliers',
    category: 'vendor',
    risk_level: 'high_risk',
    requirements: [
      req('Commercial General Liability', 2_000_000, 'per_occurrence', { ai: true, wos: true }),
      req('Commercial General Liability', 4_000_000, 'aggregate'),
      req('Automobile Liability', 1_000_000, 'combined_single_limit'),
      req("Workers' Compensation", null, 'statutory', { wos: true }),
      req('Product Liability', 2_000_000, 'per_occurrence'),
      req('Pollution Liability', 1_000_000, 'per_occurrence'),
      req("Umbrella / Excess Liability", 5_000_000, 'per_occurrence'),
    ],
  },
  {
    name: 'Contract Services',
    description: 'Requirements for contract maintenance and professional service providers',
    category: 'vendor',
    risk_level: 'standard',
    requirements: [
      req('Commercial General Liability', 1_000_000, 'per_occurrence', { ai: true }),
      req('Commercial General Liability', 2_000_000, 'aggregate'),
      req('Automobile Liability', 1_000_000, 'combined_single_limit'),
      req("Workers' Compensation", null, 'statutory'),
      req('Professional Liability (E&O)', 1_000_000, 'per_occurrence'),
    ],
  },
];

const HOSPITALITY: DefaultTemplate[] = [
  {
    name: 'Standard Vendor',
    description: 'Standard requirements for property service vendors',
    category: 'vendor',
    risk_level: 'standard',
    requirements: [
      req('Commercial General Liability', 1_000_000, 'per_occurrence', { ai: true }),
      req('Commercial General Liability', 2_000_000, 'aggregate'),
      req('Automobile Liability', 1_000_000, 'combined_single_limit'),
      req("Workers' Compensation", null, 'statutory'),
      req("Umbrella / Excess Liability", 1_000_000, 'per_occurrence'),
    ],
  },
  {
    name: 'Food & Beverage',
    description: 'Requirements for food service, catering, and beverage vendors',
    category: 'vendor',
    risk_level: 'restaurant',
    requirements: [
      req('Commercial General Liability', 1_000_000, 'per_occurrence', { ai: true }),
      req('Commercial General Liability', 2_000_000, 'aggregate'),
      req('Product Liability', 1_000_000, 'per_occurrence'),
      req('Liquor Liability', 1_000_000, 'per_occurrence'),
      req("Workers' Compensation", null, 'statutory'),
    ],
  },
  {
    name: 'Event Services',
    description: 'Requirements for event, entertainment, and conference service vendors',
    category: 'vendor',
    risk_level: 'high_risk',
    requirements: [
      req('Commercial General Liability', 2_000_000, 'per_occurrence', { ai: true }),
      req('Commercial General Liability', 4_000_000, 'aggregate'),
      req('Automobile Liability', 1_000_000, 'combined_single_limit'),
      req("Workers' Compensation", null, 'statutory'),
      req("Umbrella / Excess Liability", 2_000_000, 'per_occurrence'),
    ],
  },
];

const RETAIL: DefaultTemplate[] = [
  {
    name: 'Standard Vendor',
    description: 'Standard requirements for store vendors and service providers',
    category: 'vendor',
    risk_level: 'standard',
    requirements: [
      req('Commercial General Liability', 1_000_000, 'per_occurrence', { ai: true }),
      req('Commercial General Liability', 2_000_000, 'aggregate'),
      req('Automobile Liability', 1_000_000, 'combined_single_limit'),
      req("Workers' Compensation", null, 'statutory'),
    ],
  },
  {
    name: 'Delivery / Logistics',
    description: 'Requirements for delivery services and logistics providers',
    category: 'vendor',
    risk_level: 'standard',
    requirements: [
      req('Commercial General Liability', 1_000_000, 'per_occurrence', { ai: true }),
      req('Commercial General Liability', 2_000_000, 'aggregate'),
      req('Automobile Liability', 1_000_000, 'combined_single_limit', { ai: true }),
      req("Workers' Compensation", null, 'statutory'),
      req('Motor Truck Cargo', 100_000, 'per_occurrence'),
    ],
  },
  {
    name: 'Construction / Renovation',
    description: 'Requirements for construction and renovation contractors',
    category: 'vendor',
    risk_level: 'high_risk',
    requirements: [
      req('Commercial General Liability', 2_000_000, 'per_occurrence', { ai: true, wos: true }),
      req('Commercial General Liability', 4_000_000, 'aggregate'),
      req('Automobile Liability', 1_000_000, 'combined_single_limit'),
      req("Workers' Compensation", null, 'statutory', { wos: true }),
      req("Umbrella / Excess Liability", 2_000_000, 'per_occurrence'),
    ],
  },
];

const GENERIC: DefaultTemplate[] = [
  {
    name: 'Standard Vendor',
    description: 'Standard insurance requirements for general vendors',
    category: 'vendor',
    risk_level: 'standard',
    requirements: [
      req('Commercial General Liability', 1_000_000, 'per_occurrence', { ai: true }),
      req('Commercial General Liability', 2_000_000, 'aggregate'),
      req('Automobile Liability', 1_000_000, 'combined_single_limit'),
      req("Workers' Compensation", null, 'statutory'),
    ],
  },
  {
    name: 'High-Risk Vendor',
    description: 'Elevated requirements for high-risk vendors',
    category: 'vendor',
    risk_level: 'high_risk',
    requirements: [
      req('Commercial General Liability', 2_000_000, 'per_occurrence', { ai: true, wos: true }),
      req('Commercial General Liability', 4_000_000, 'aggregate'),
      req('Automobile Liability', 1_000_000, 'combined_single_limit'),
      req("Workers' Compensation", null, 'statutory', { wos: true }),
      req("Umbrella / Excess Liability", 5_000_000, 'per_occurrence'),
      req('Professional Liability (E&O)', 1_000_000, 'per_occurrence'),
    ],
  },
];

// ============================================================================
// Lookup
// ============================================================================

const TEMPLATES_BY_INDUSTRY: Record<Industry, DefaultTemplate[]> = {
  property_management: PROPERTY_MANAGEMENT,
  construction: CONSTRUCTION,
  logistics: LOGISTICS,
  healthcare: HEALTHCARE,
  manufacturing: MANUFACTURING,
  hospitality: HOSPITALITY,
  retail: RETAIL,
  other: GENERIC,
};

/**
 * Returns the default compliance templates appropriate for the given industry.
 * Falls back to generic templates when industry is null.
 */
export function getDefaultTemplates(industry: Industry | null): DefaultTemplate[] {
  return TEMPLATES_BY_INDUSTRY[industry ?? 'other'] ?? GENERIC;
}

/**
 * Coverage recommendations disclaimer text.
 */
export const COVERAGE_DISCLAIMER =
  'Coverage recommendations are based on common industry benchmarks and should not be considered insurance advice. Consult with your broker or risk management professional for your specific requirements.';
