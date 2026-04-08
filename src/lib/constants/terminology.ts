import type { Industry } from '@/types';

// ============================================================================
// Terminology — industry-specific labels for UI text
// ============================================================================

export interface Terminology {
  /** Singular label for the top-level grouping concept (Property, Project, etc.) */
  location: string;
  locationPlural: string;

  /** Singular label for the primary COI provider (Vendor, Subcontractor, etc.) */
  entity: string;
  entityPlural: string;

  /** Secondary entity type — only exists for property management */
  tenant: string | null;
  tenantPlural: string | null;
  hasTenants: boolean;

  /** Short descriptions for onboarding/help text */
  locationDescription: string;
  entityDescription: string;
  tenantDescription: string | null;
  uploadPrompt: string;

  /** Label shown to external parties (portal, emails) for who requested the COI */
  requesterLabel: string;
}

const TERMINOLOGY_MAP: Record<Industry, Terminology> = {
  property_management: {
    location: 'Property',
    locationPlural: 'Properties',
    entity: 'Vendor',
    entityPlural: 'Vendors',
    tenant: 'Tenant',
    tenantPlural: 'Tenants',
    hasTenants: true,
    locationDescription: 'The building or property you manage',
    entityDescription: 'Contractors and service providers for your property',
    tenantDescription: 'Commercial or residential tenants in your property',
    uploadPrompt: 'Upload COIs from your vendors and tenants',
    requesterLabel: 'property manager',
  },
  construction: {
    location: 'Project',
    locationPlural: 'Projects',
    entity: 'Subcontractor',
    entityPlural: 'Subcontractors',
    tenant: null,
    tenantPlural: null,
    hasTenants: false,
    locationDescription: 'The job site or project',
    entityDescription: 'Subcontractors working on your project',
    tenantDescription: null,
    uploadPrompt: 'Upload COIs from your subcontractors',
    requesterLabel: 'project manager',
  },
  logistics: {
    location: 'Location',
    locationPlural: 'Locations',
    entity: 'Carrier',
    entityPlural: 'Carriers',
    tenant: null,
    tenantPlural: null,
    hasTenants: false,
    locationDescription: 'The warehouse, office, or hub',
    entityDescription: 'Carriers and transportation providers',
    tenantDescription: null,
    uploadPrompt: 'Upload COIs from your carriers and vendors',
    requesterLabel: 'operations team',
  },
  healthcare: {
    location: 'Facility',
    locationPlural: 'Facilities',
    entity: 'Vendor',
    entityPlural: 'Vendors',
    tenant: null,
    tenantPlural: null,
    hasTenants: false,
    locationDescription: 'The hospital, clinic, or facility',
    entityDescription: 'Third-party service providers',
    tenantDescription: null,
    uploadPrompt: 'Upload COIs from your vendors',
    requesterLabel: 'compliance department',
  },
  manufacturing: {
    location: 'Plant',
    locationPlural: 'Plants',
    entity: 'Supplier',
    entityPlural: 'Suppliers',
    tenant: null,
    tenantPlural: null,
    hasTenants: false,
    locationDescription: 'The plant or factory',
    entityDescription: 'Suppliers and contractors',
    tenantDescription: null,
    uploadPrompt: 'Upload COIs from your suppliers',
    requesterLabel: 'safety coordinator',
  },
  hospitality: {
    location: 'Property',
    locationPlural: 'Properties',
    entity: 'Vendor',
    entityPlural: 'Vendors',
    tenant: null,
    tenantPlural: null,
    hasTenants: false,
    locationDescription: 'The hotel or resort',
    entityDescription: 'Contractors and service providers',
    tenantDescription: null,
    uploadPrompt: 'Upload COIs from your vendors',
    requesterLabel: 'operations manager',
  },
  retail: {
    location: 'Location',
    locationPlural: 'Locations',
    entity: 'Vendor',
    entityPlural: 'Vendors',
    tenant: null,
    tenantPlural: null,
    hasTenants: false,
    locationDescription: 'The store or location',
    entityDescription: 'Vendors and suppliers',
    tenantDescription: null,
    uploadPrompt: 'Upload COIs from your vendors',
    requesterLabel: 'compliance team',
  },
  other: {
    location: 'Location',
    locationPlural: 'Locations',
    entity: 'Vendor',
    entityPlural: 'Vendors',
    tenant: null,
    tenantPlural: null,
    hasTenants: false,
    locationDescription: 'Your business location',
    entityDescription: 'Your third-party vendors',
    tenantDescription: null,
    uploadPrompt: 'Upload COIs from your vendors',
    requesterLabel: 'compliance team',
  },
};

/** Default terminology used when industry is null or unknown */
const DEFAULT_TERMINOLOGY: Terminology = TERMINOLOGY_MAP.other;

/**
 * Returns industry-specific terminology for UI labels and descriptions.
 * Falls back to generic defaults when industry is null.
 */
export function getTerminology(industry: Industry | null): Terminology {
  if (!industry) return DEFAULT_TERMINOLOGY;
  return TERMINOLOGY_MAP[industry] ?? DEFAULT_TERMINOLOGY;
}

/**
 * Replaces `{location}`, `{locationPlural}`, `{entity}`, `{entityPlural}`,
 * `{tenant}`, `{tenantPlural}` placeholders in a template string with the
 * correct industry-specific terms.
 *
 * Example: formatTerm("Add a {entity} to your {location}", terms)
 *       → "Add a Subcontractor to your Project"
 */
export function formatTerm(template: string, terms: Terminology): string {
  return template
    .replace(/\{location\}/g, terms.location)
    .replace(/\{locationPlural\}/g, terms.locationPlural)
    .replace(/\{entity\}/g, terms.entity)
    .replace(/\{entityPlural\}/g, terms.entityPlural)
    .replace(/\{tenant\}/g, terms.tenant ?? '')
    .replace(/\{tenantPlural\}/g, terms.tenantPlural ?? '');
}
