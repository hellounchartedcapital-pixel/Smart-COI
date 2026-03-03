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

  // Build default entities from org data for property creation
  function buildDefaultEntities(): PropertyEntityEntry[] {
    const entities: PropertyEntityEntry[] = [];
    if (orgData.certificateHolder && orgData.certificateHolder.entity_name) {
      entities.push({
        id: crypto.randomUUID(),
        entity_name: orgData.certificateHolder.entity_name,
        entity_address: orgData.certificateHolder.entity_address,
        entity_type: 'certificate_holder',
      });
    }
    for (const ai of orgData.additionalInsured) {
      if (ai.entity_name.trim()) {
        entities.push({
          id: crypto.randomUUID(),
          entity_name: ai.entity_name,
          entity_address: ai.entity_address,
          entity_type: 'additional_insured',
        });
      }
    }
    return entities;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    onNext({
      name: name.trim(),
      address: address.trim(),
      city: '',
      state: '',
      zip: '',
      property_type: 'office',
      entities: data?.entities ?? buildDefaultEntities(),
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
          <p className="text-xs text-muted-foreground">
            You can add city, state, ZIP, property type, and entity details later.
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
