import type { PropertyType } from './types';

export const propertyTypes: PropertyType[] = [
  {
    slug: 'office-buildings',
    name: 'Office Building',
    plural: 'Office Buildings',
    description:
      'Class A, B, and C office properties including high-rises, suburban office parks, and mixed-use office spaces.',
    vendorExamples: ['janitorial services', 'HVAC contractors', 'elevator maintenance', 'security companies'],
    tenantExamples: ['law firms', 'tech companies', 'accounting firms', 'consulting agencies'],
  },
  {
    slug: 'retail-centers',
    name: 'Retail Center',
    plural: 'Retail Centers',
    description:
      'Shopping centers, strip malls, power centers, and lifestyle centers with multiple retail tenants.',
    vendorExamples: ['parking lot maintenance', 'landscaping crews', 'snow removal', 'signage installers'],
    tenantExamples: ['restaurants', 'clothing retailers', 'fitness studios', 'salons'],
  },
  {
    slug: 'industrial-warehouses',
    name: 'Industrial Warehouse',
    plural: 'Industrial Warehouses',
    description:
      'Warehouses, distribution centers, flex spaces, and light manufacturing facilities.',
    vendorExamples: ['dock equipment repair', 'forklift maintenance', 'fire suppression contractors', 'roofing companies'],
    tenantExamples: ['logistics companies', 'e-commerce fulfillment', 'manufacturers', 'cold storage operators'],
  },
  {
    slug: 'multifamily-apartments',
    name: 'Multifamily Apartment',
    plural: 'Multifamily Apartments',
    description:
      'Apartment complexes, garden-style communities, mid-rise and high-rise residential buildings.',
    vendorExamples: ['plumbing contractors', 'pest control', 'pool maintenance', 'painting companies'],
    tenantExamples: ['individual residents', 'corporate housing tenants', 'student housing residents'],
  },
  {
    slug: 'mixed-use-properties',
    name: 'Mixed-Use Property',
    plural: 'Mixed-Use Properties',
    description:
      'Properties combining retail, office, and residential uses — often with ground-floor commercial and upper-floor residential.',
    vendorExamples: ['general contractors', 'fire safety inspectors', 'waste management', 'window cleaning'],
    tenantExamples: ['ground-floor restaurants', 'professional offices', 'residential tenants', 'co-working spaces'],
  },
  {
    slug: 'medical-office-buildings',
    name: 'Medical Office Building',
    plural: 'Medical Office Buildings',
    description:
      'Medical offices, outpatient clinics, dental practices, and ambulatory surgery centers.',
    vendorExamples: ['biomedical waste disposal', 'medical equipment service', 'specialized cleaning', 'IT network contractors'],
    tenantExamples: ['physician practices', 'dental offices', 'physical therapy clinics', 'imaging centers'],
  },
  {
    slug: 'hospitality-hotels',
    name: 'Hospitality Property',
    plural: 'Hotels & Hospitality Properties',
    description:
      'Hotels, motels, resorts, and extended-stay properties with complex vendor relationships.',
    vendorExamples: ['linen services', 'food suppliers', 'valet parking', 'AV equipment providers'],
    tenantExamples: ['restaurant operators', 'spa operators', 'gift shop tenants', 'event planners'],
  },
  {
    slug: 'self-storage-facilities',
    name: 'Self-Storage Facility',
    plural: 'Self-Storage Facilities',
    description:
      'Climate-controlled and standard self-storage facilities, including boat and RV storage.',
    vendorExamples: ['gate and access control repair', 'pest control', 'paving contractors', 'security system vendors'],
    tenantExamples: ['individual renters', 'small businesses', 'moving companies'],
  },
];
