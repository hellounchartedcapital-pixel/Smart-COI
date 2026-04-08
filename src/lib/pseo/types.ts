export interface PropertyType {
  slug: string;
  name: string;
  plural: string;
  description: string;
  /** Typical vendor/tenant examples for this property type */
  vendorExamples: string[];
  tenantExamples: string[];
  /** Unique compliance challenges for this property type (3-5 paragraphs) */
  complianceChallenges?: string;
  /** Common insurance gaps specific to this property type */
  commonGaps?: string;
  /** How SmartCOI helps this property type specifically */
  smartcoiHelps?: string;
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
