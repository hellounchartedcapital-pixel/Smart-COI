'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getTerminology } from '@/lib/constants/terminology';
import type { Industry, PropertyType } from '@/types';
import type { OrgSetupData } from './step-org-setup';

interface PropertyEntityEntry {
  id: string;
  entity_name: string;
  entity_address: string;
  entity_type: 'certificate_holder' | 'additional_insured';
}

export interface PropertyData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  property_type: PropertyType;
  entities: PropertyEntityEntry[];
}

const PROPERTY_TYPES_BY_INDUSTRY: Partial<Record<Industry, { value: PropertyType; label: string }[]>> = {
  property_management: [
    { value: 'office', label: 'Office' },
    { value: 'retail', label: 'Retail' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'mixed_use', label: 'Mixed-Use' },
    { value: 'multifamily', label: 'Multifamily' },
    { value: 'other', label: 'Other' },
  ],
  construction: [
    { value: 'other', label: 'Commercial' },
    { value: 'multifamily', label: 'Residential' },
    { value: 'industrial', label: 'Infrastructure' },
  ],
  logistics: [
    { value: 'industrial', label: 'Warehouse' },
    { value: 'other', label: 'Distribution Center' },
    { value: 'office', label: 'Office' },
  ],
  healthcare: [
    { value: 'other', label: 'Hospital' },
    { value: 'office', label: 'Clinic' },
    { value: 'retail', label: 'Urgent Care' },
  ],
  manufacturing: [
    { value: 'industrial', label: 'Factory' },
    { value: 'other', label: 'Warehouse' },
    { value: 'office', label: 'Office' },
  ],
  hospitality: [
    { value: 'other', label: 'Hotel' },
    { value: 'retail', label: 'Resort' },
    { value: 'mixed_use', label: 'Restaurant' },
    { value: 'industrial', label: 'Event Venue' },
  ],
  retail: [
    { value: 'retail', label: 'Store' },
    { value: 'mixed_use', label: 'Mall' },
    { value: 'industrial', label: 'Warehouse' },
    { value: 'other', label: 'Other' },
  ],
};

interface StepPropertyProps {
  orgData: OrgSetupData;
  industry: Industry | null;
  data: PropertyData | null;
  onNext: (data: PropertyData) => void;
  onSkip: () => void;
  saving: boolean;
}

export function StepProperty({ orgData, industry, data, onNext, onSkip, saving }: StepPropertyProps) {
  const terms = getTerminology(industry);
  const [name, setName] = useState(data?.name ?? '');
  const [address, setAddress] = useState(data?.address ?? '');

  const typeOptions = PROPERTY_TYPES_BY_INDUSTRY[industry ?? 'other'] ?? null;
  const [propertyType, setPropertyType] = useState<PropertyType>(data?.property_type ?? 'other');

  // Pre-fill entity names from existing data or org defaults
  const existingCH = data?.entities?.find((e) => e.entity_type === 'certificate_holder');
  const existingAI = data?.entities?.find((e) => e.entity_type === 'additional_insured');
  const [certHolderName, setCertHolderName] = useState(
    existingCH?.entity_name ?? orgData.certificateHolder?.entity_name ?? ''
  );
  const [additionalInsuredName, setAdditionalInsuredName] = useState(
    existingAI?.entity_name ?? orgData.additionalInsured[0]?.entity_name ?? ''
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !certHolderName.trim()) return;

    const entities: PropertyEntityEntry[] = [];
    entities.push({
      id: existingCH?.id ?? crypto.randomUUID(),
      entity_name: certHolderName.trim(),
      entity_address: '',
      entity_type: 'certificate_holder',
    });
    if (additionalInsuredName.trim()) {
      entities.push({
        id: existingAI?.id ?? crypto.randomUUID(),
        entity_name: additionalInsuredName.trim(),
        entity_address: '',
        entity_type: 'additional_insured',
      });
    }

    onNext({
      name: name.trim(),
      address: address.trim(),
      city: '',
      state: '',
      zip: '',
      property_type: propertyType,
      entities,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Add your first {terms.location.toLowerCase()}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {terms.locationDescription}. You can add more {terms.locationPlural.toLowerCase()} later from the dashboard.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="propName">{terms.location} name *</Label>
          <Input
            id="propName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={industry === 'property_management' ? '100 Park Avenue' : `My ${terms.location}`}
            required
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="propAddress">Address</Label>
          <Input
            id="propAddress"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street address, city, state, zip"
          />
        </div>

        {/* Property type — only shown when industry has specific types */}
        {typeOptions && (
          <div className="space-y-2">
            <Label htmlFor="propType">Type</Label>
            <select
              id="propType"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as PropertyType)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value + opt.label} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Certificate Holder */}
        <div className="space-y-2">
          <Label htmlFor="certHolder">Certificate holder name *</Label>
          <Input
            id="certHolder"
            value={certHolderName}
            onChange={(e) => setCertHolderName(e.target.value)}
            placeholder="Your company or entity name"
            required
          />
          <p className="text-xs text-muted-foreground">
            The entity that must appear in the certificate holder field on COIs for this {terms.location.toLowerCase()}.
          </p>
        </div>

        {/* Additional Insured */}
        <div className="space-y-2">
          <Label htmlFor="additionalInsured">Additional insured name</Label>
          <Input
            id="additionalInsured"
            value={additionalInsuredName}
            onChange={(e) => setAdditionalInsuredName(e.target.value)}
            placeholder="Optional additional insured entity"
          />
          <p className="text-xs text-muted-foreground">
            Optional. The entity that must be listed as additional insured on COIs.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button type="submit" size="lg" className="w-full font-semibold" disabled={saving}>
          {saving ? 'Saving...' : 'Continue'}
        </Button>
        <button
          type="button"
          onClick={onSkip}
          className="text-center text-sm text-muted-foreground hover:text-foreground"
          disabled={saving}
        >
          Skip — I&apos;ll organize later
        </button>
      </div>
    </form>
  );
}
