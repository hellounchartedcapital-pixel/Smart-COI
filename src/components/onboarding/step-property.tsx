'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PropertyType } from '@/types';
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

interface StepPropertyProps {
  orgData: OrgSetupData;
  data: PropertyData | null;
  onNext: (data: PropertyData) => void;
  onSkip: () => void;
  saving: boolean;
}

export function StepProperty({ orgData, data, onNext, onSkip, saving }: StepPropertyProps) {
  const [name, setName] = useState(data?.name ?? '');
  const [address, setAddress] = useState(data?.address ?? '');

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
      property_type: 'office',
      entities,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Add your first property
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This is the building you&apos;ll upload COIs for. You can add more properties later from the dashboard.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="propName">Property name *</Label>
          <Input
            id="propName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="100 Park Avenue"
            required
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="propAddress">Street address</Label>
          <Input
            id="propAddress"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="100 Park Avenue, New York, NY 10178"
          />
        </div>

        {/* Certificate Holder */}
        <div className="space-y-2">
          <Label htmlFor="certHolder">Certificate holder name *</Label>
          <Input
            id="certHolder"
            value={certHolderName}
            onChange={(e) => setCertHolderName(e.target.value)}
            placeholder="Acme Property Management LLC"
            required
          />
          <p className="text-xs text-muted-foreground">
            The entity that must appear in the certificate holder field on COIs for this property.
          </p>
        </div>

        {/* Additional Insured */}
        <div className="space-y-2">
          <Label htmlFor="additionalInsured">Additional insured name</Label>
          <Input
            id="additionalInsured"
            value={additionalInsuredName}
            onChange={(e) => setAdditionalInsuredName(e.target.value)}
            placeholder="Park Avenue Owners LLC"
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
          Skip to Dashboard
        </button>
      </div>
    </form>
  );
}
