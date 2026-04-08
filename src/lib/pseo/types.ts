export interface PropertyType {
  slug: string;
  name: string;
  plural: string;
  description: string;
  /** Typical vendor/tenant examples for this property type */
  vendorExamples: string[];
  tenantExamples: string[];
  /** Unique prose about compliance challenges for this property type */
  complianceChallenges?: string;
  /** Common coverage gaps specific to this property type */
  commonCoverageGaps?: string;
  /** How SmartCOI addresses challenges for this property type */
  howSmartCOIHelps?: string;
}

export interface CoverageType {
  slug: string;
  name: string;
  abbreviation: string;
  description: string;
  /** Why this coverage matters for property managers */
  importance: string;
  /** Typical minimum limits */
  typicalLimits: string;
}

export interface NichePage {
  propertyType: PropertyType;
  coverageType: CoverageType;
  /** URL slug: /insurance-requirements/{propertySlug}/{coverageSlug} */
  slug: string;
}
