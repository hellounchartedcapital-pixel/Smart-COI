import type { Industry } from '@/types';

export interface IndustryOption {
  value: Industry;
  label: string;
  /** Lucide icon name — used by the onboarding industry selector */
  icon: string;
}

export const INDUSTRY_OPTIONS: IndustryOption[] = [
  { value: 'property_management', label: 'Property Management', icon: 'Building2' },
  { value: 'general_contractor', label: 'General Contractor', icon: 'HardHat' },
  { value: 'construction', label: 'Construction', icon: 'HardHat' },
  { value: 'logistics', label: 'Logistics & Transportation', icon: 'Truck' },
  { value: 'healthcare', label: 'Healthcare', icon: 'Hospital' },
  { value: 'professional_services', label: 'Professional Services', icon: 'Briefcase' },
  { value: 'manufacturing', label: 'Manufacturing', icon: 'Factory' },
  { value: 'hospitality', label: 'Hospitality', icon: 'Hotel' },
  { value: 'retail', label: 'Retail', icon: 'Store' },
  { value: 'other', label: 'Other', icon: 'Briefcase' },
];

export function getIndustryLabel(industry: Industry | null): string {
  if (!industry) return 'Not set';
  return INDUSTRY_OPTIONS.find((o) => o.value === industry)?.label ?? industry;
}
