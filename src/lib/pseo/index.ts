export { propertyTypes } from './property-types';
export { coverageTypes } from './coverage-types';
export type { PropertyType, CoverageType, NichePage } from './types';

import { propertyTypes } from './property-types';
import { coverageTypes } from './coverage-types';
import type { PropertyType, CoverageType, NichePage } from './types';

/**
 * Generate all niche page combinations (property type × coverage type).
 * Used by generateStaticParams and sitemap.
 */
export function getAllNichePages(): NichePage[] {
  const pages: NichePage[] = [];
  for (const pt of propertyTypes) {
    for (const ct of coverageTypes) {
      pages.push({
        propertyType: pt,
        coverageType: ct,
        slug: `${pt.slug}/${ct.slug}`,
      });
    }
  }
  return pages;
}

export function getPropertyType(slug: string): PropertyType | undefined {
  return propertyTypes.find((pt) => pt.slug === slug);
}

export function getCoverageType(slug: string): CoverageType | undefined {
  return coverageTypes.find((ct) => ct.slug === slug);
}

/** Total number of pSEO pages: 8 property types × 6 coverage types = 48 */
export const TOTAL_PSEO_PAGES = propertyTypes.length * coverageTypes.length;
