import type { CoverageType } from './types';

export const coverageTypes: CoverageType[] = [
  {
    slug: 'general-liability',
    name: 'General Liability',
    abbreviation: 'GL',
    description:
      'Covers third-party bodily injury and property damage claims arising from operations on the premises.',
    importance:
      'The foundational coverage every vendor and tenant must carry. Without GL, the property owner absorbs liability for slip-and-falls, property damage, and other on-site incidents.',
    typicalLimits: '$1M per occurrence / $2M aggregate',
  },
  {
    slug: 'workers-compensation',
    name: "Workers' Compensation",
    abbreviation: 'WC',
    description:
      'Covers medical expenses and lost wages for employees injured on the job. Required by law in most states.',
    importance:
      'If a vendor\'s employee is injured on your property without WC coverage, the property owner may face direct liability. Verifying active WC policies is a critical compliance step.',
    typicalLimits: 'Statutory limits (varies by state)',
  },
  {
    slug: 'commercial-auto',
    name: 'Commercial Auto',
    abbreviation: 'CA',
    description:
      'Covers vehicles used for business purposes, including liability for accidents involving company-owned or hired vehicles.',
    importance:
      'Vendors driving onto your property — delivery trucks, service vans, construction vehicles — need commercial auto coverage to protect against vehicle-related claims.',
    typicalLimits: '$1M combined single limit',
  },
  {
    slug: 'umbrella-excess-liability',
    name: 'Umbrella / Excess Liability',
    abbreviation: 'UMB',
    description:
      'Provides additional liability coverage above the limits of underlying GL, auto, and WC policies.',
    importance:
      'For high-risk operations or high-value properties, umbrella coverage ensures that a catastrophic claim doesn\'t exhaust the vendor\'s primary policy limits.',
    typicalLimits: '$1M–$5M (varies by risk)',
  },
  {
    slug: 'professional-liability',
    name: 'Professional Liability (E&O)',
    abbreviation: 'E&O',
    description:
      'Covers claims arising from professional errors, omissions, or negligent advice — also known as Errors & Omissions.',
    importance:
      'Critical for vendors providing professional services (architects, engineers, consultants, IT providers) where faulty advice or design can cause financial losses.',
    typicalLimits: '$1M per claim / $2M aggregate',
  },
  {
    slug: 'property-insurance',
    name: 'Property Insurance',
    abbreviation: 'PROP',
    description:
      'Covers damage to tenant-owned improvements, inventory, and business personal property within leased spaces.',
    importance:
      'Tenants need property coverage for their own buildouts and inventory. Without it, tenants may seek recovery from the landlord after a loss event.',
    typicalLimits: 'Replacement cost of tenant improvements',
  },
];
