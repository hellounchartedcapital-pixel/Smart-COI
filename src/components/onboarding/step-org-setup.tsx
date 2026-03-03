'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EntityEntry {
  id: string;
  entity_name: string;
  entity_address: string;
}

export interface OrgSetupData {
  companyName: string;
  certificateHolder: { entity_name: string; entity_address: string } | null;
  additionalInsured: EntityEntry[];
}

interface StepOrgSetupProps {
  data: OrgSetupData;
  onNext: (data: OrgSetupData) => void;
  onSkip: () => void;
  saving: boolean;
}

export function StepOrgSetup({ data, onNext, onSkip, saving }: StepOrgSetupProps) {
  const [companyName, setCompanyName] = useState(data.companyName);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) return;

    onNext({
      companyName: companyName.trim(),
      certificateHolder: data.certificateHolder,
      additionalInsured: data.additionalInsured,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome to SmartCOI
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Let&apos;s get you set up. First, what&apos;s your organization called?
        </p>
      </div>

      {/* Company Name */}
      <div className="space-y-2">
        <Label htmlFor="companyName">Organization / Company name *</Label>
        <Input
          id="companyName"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Acme Property Management"
          required
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          You can configure certificate holders and additional insured entities later in Settings.
        </p>
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
